const express = require('express');
const { problem } = require('./errors');
const { createOrder, getOrder, listOrders, cancelOrder } = require('./store');
const { callPayment } = require('./payment_client');

const app = express();
app.use(express.json({ strict: true }));

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Body must be a JSON object';
  if (!Number.isInteger(body.userId) || body.userId <= 0) return 'userId must be a positive integer';
  if (!Array.isArray(body.items) || body.items.length === 0) return 'items must be a non-empty array';
  if (typeof body.total !== 'number' || body.total <= 0) return 'total must be a positive number';
  for (const item of body.items) {
    if (!Number.isInteger(item.menuItemId) || item.menuItemId <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return 'Each item needs positive integer menuItemId and quantity';
    }
  }
  return null;
}

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
    return problem(res, 503, 'Payment service unavailable', 'Order could not be completed because the payment service is unreachable.');
  }
});

app.get('/orders/:id', (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) return problem(res, 404, 'Order not found', `No order exists with id ${req.params.id}`);
  res.status(200).json(order.asJson());
});

app.get('/orders', (req, res) => {
  const allowed = ['PENDING', 'PAID', 'CANCELLED'];
  if (req.query.status && !allowed.includes(req.query.status)) return problem(res, 422, 'Invalid status', 'The requested order status is not supported.');
  res.status(200).json(listOrders(req.query.status).map(o => o.asJson()));
});

app.post('/orders/:id/cancellation', (req, res) => {
  if (req.body && Object.keys(req.body).length > 0 && typeof req.body.reason !== 'string') {
    return problem(res, 400, 'Malformed request body', 'reason must be a string when supplied');
  }
  const result = cancelOrder(req.params.id);
  if (!result) return problem(res, 404, 'Order not found', `No order exists with id ${req.params.id}`);
  if (result.conflict) return problem(res, 409, 'Order state conflict', 'Only PENDING orders can be cancelled.');
  res.status(200).json(result.order.asJson());
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) return problem(res, 400, 'Malformed request body', 'Request body contains invalid JSON.');
  next(err);
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`CampusEats Orders service running on http://localhost:${port}`));
}
module.exports = { app, validate };
