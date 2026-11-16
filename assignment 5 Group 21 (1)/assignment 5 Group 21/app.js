const express = require('express');
const crypto = require('node:crypto');
const { problem } = require('./errors');
const { createOrder, rollbackOrder, getOrder, listOrders, cancelOrder, deleteOrder } = require('./store');
const { callPayment } = require('./payment_client');

const app = express();
app.set('trust proxy', true);

const rateState = new Map();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Body must be a JSON object';
  if (!Number.isInteger(body.userId) || body.userId <= 0) return 'userId must be a positive integer';
  if (!Array.isArray(body.items) || body.items.length === 0) return 'items must be a non-empty array';
  if (typeof body.total !== 'number' || body.total <= 0) return 'total must be a positive number';
  for (const item of body.items) {
    if (!item || !Number.isInteger(item.menuItemId) || item.menuItemId <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return 'Each item needs positive integer menuItemId and quantity';
    }
  }
  return null;
}

function acceptsJson(req) {
  const accept = req.get('Accept');
  if (!accept || accept === '*/*') return true;
  return accept.split(',').some(v => {
    const media = v.trim().split(';')[0].toLowerCase();
    return media === 'application/json' || media === 'application/*' || media === '*/*';
  });
}

function etag(order) {
  return `"${crypto.createHash('sha256').update(JSON.stringify(order.asJson())).digest('hex').slice(0, 16)}"`;
}

function authRequired(req, res) {
  const header = req.get('Authorization') || '';
  if (!/^Bearer\s+\S+$/.test(header)) {
    problem(res, 401, 'Unauthorized', 'Authorization: Bearer <token> is required.');
    return false;
  }
  return true;
}

function setCommonHeaders(req, res) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Accept, Content-Type, Authorization, Idempotency-Key, If-Match, If-None-Match, X-HTTP-Method-Override');
  res.set('Access-Control-Expose-Headers', 'Location, ETag, X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After');
  res.set('Vary', 'Accept, Origin');
}

app.use((req, res, next) => {
  setCommonHeaders(req, res);
  const client = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let state = rateState.get(client);
  if (!state || now >= state.resetAt) state = { count: 0, resetAt: now + RATE_WINDOW_MS };
  state.count += 1;
  rateState.set(client, state);
  res.set('X-RateLimit-Limit', String(RATE_LIMIT));
  res.set('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT - state.count)));
  if (state.count > RATE_LIMIT) {
    res.set('Retry-After', String(Math.ceil((state.resetAt - now) / 1000)));
    return problem(res, 429, 'Too Many Requests', 'Per-client request budget exceeded.');
  }
  next();
});

app.use((req, res, next) => {
  const override = req.get('X-HTTP-Method-Override');
  if (override) {
    const method = override.toUpperCase();
    if (['PUT', 'DELETE'].includes(method)) req.method = method;
  }
  next();
});

app.options('/orders', (req, res) => res.set('Allow', 'GET, POST, OPTIONS').status(204).end());
app.options('/orders/:id', (req, res) => res.set('Allow', 'GET, DELETE, OPTIONS').status(204).end());
app.options('/orders/:id/cancellation', (req, res) => res.set('Allow', 'POST, OPTIONS').status(204).end());

app.use(express.json({ strict: true }));

app.use((req, res, next) => {
  if (!acceptsJson(req)) return problem(res, 406, 'Not Acceptable', 'This service returns application/json only.');
  next();
});

app.post('/orders', async (req, res) => {
  const validationError = validate(req.body);
  if (validationError) return problem(res, 400, 'Malformed request body', validationError);

  const key = req.get('Idempotency-Key');
  const { order, repeated } = createOrder(req.body, key);
  if (repeated) {
    res.set('Location', `/orders/${order.id}`);
    return res.status(201).json(order.asJson());
  }

  try {
    const payment = await callPayment(order, key || `order-${order.id}`);
    order.paymentId = payment.paymentId || null;
    res.set('Location', `/orders/${order.id}`);
    return res.status(201).json(order.asJson());
  } catch (e) {
    rollbackOrder(order);
    if (e.nonRetryable) return problem(res, 422, 'Payment rejected', 'The payment provider rejected the order payment.');
    return problem(res, 503, 'Payment service unavailable', 'Order could not be completed because the payment service is unreachable.');
  }
});

app.get('/orders/:id', (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return problem(res, 404, 'Order not found', `No order exists with id ${req.params.id}`);
  const tag = etag(order);
  res.set('ETag', tag);
  res.set('Cache-Control', 'public, max-age=30, must-revalidate');
  if (req.get('If-None-Match') === tag) return res.status(304).end();
  return res.status(200).json(order.asJson());
});

app.get('/orders', (req, res) => {
  const allowed = ['PENDING', 'PAID', 'CANCELLED'];
  if (req.query.status && !allowed.includes(req.query.status)) return problem(res, 422, 'Invalid status', 'The requested order status is not supported.');
  const userId = req.query.userId;
  if (userId !== undefined && (!/^\d+$/.test(userId) || Number(userId) <= 0)) return problem(res, 400, 'Malformed query', 'userId must be a positive integer.');
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) return problem(res, 400, 'Malformed query', 'page must be >= 1 and limit must be between 1 and 100.');
  const sort = req.query.sort || 'id';
  if (!['id', '-id', 'total', '-total'].includes(sort)) return problem(res, 422, 'Invalid sort', 'sort must be id, -id, total or -total.');
  return res.status(200).json(listOrders({ status: req.query.status, userId, sort, page, limit }).map(o => o.asJson()));
});

app.post('/orders/:id/cancellation', (req, res) => {
  if (!authRequired(req, res)) return;
  const current = getOrder(req.params.id);
  if (!current) return problem(res, 404, 'Order not found', `No order exists with id ${req.params.id}`);
  const currentTag = etag(current);
  const match = req.get('If-Match');
  if (!match) return problem(res, 412, 'Precondition Required', 'If-Match is required for a conditional cancellation.');
  if (match !== currentTag) return problem(res, 412, 'Precondition Failed', 'The order changed since it was read. Refresh before retrying.');
  if (req.body && Object.keys(req.body).length > 0 && typeof req.body.reason !== 'string') {
    return problem(res, 400, 'Malformed request body', 'reason must be a string when supplied');
  }
  const result = cancelOrder(req.params.id);
  if (!result) return problem(res, 404, 'Order not found', `No order exists with id ${req.params.id}`);
  if (result.conflict) return problem(res, 409, 'Order state conflict', 'Only PENDING orders can be cancelled.');
  res.set('ETag', etag(result.order));
  return res.status(200).json(result.order.asJson());
});

app.delete('/orders/:id', (req, res) => {
  if (!authRequired(req, res)) return;
  const current = getOrder(req.params.id);
  if (!current) return problem(res, 404, 'Order not found', `No order exists with id ${req.params.id}`);
  const match = req.get('If-Match');
  if (match && match !== etag(current)) return problem(res, 412, 'Precondition Failed', 'The order changed since it was read.');
  const result = deleteOrder(req.params.id);
  if (result.conflict) return problem(res, 409, 'Order state conflict', 'Paid orders cannot be deleted.');
  return res.status(204).end();
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) return problem(res, 400, 'Malformed request body', 'Request body contains invalid JSON.');
  if (err.type === 'entity.parse.failed') return problem(res, 400, 'Malformed request body', 'Request body contains invalid JSON.');
  next(err);
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`CampusEats Orders service running on http://localhost:${port}`));
}
module.exports = { app, validate, etag, rateState };
