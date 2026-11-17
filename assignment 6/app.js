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

// Part C1 & C2: Validate body and collect field-level validation errors
function validateOrderPayload(body) {
    const errors = [];
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return [{ field: 'body', msg: 'Request body must be a JSON object' }];
    }

    if (body.userId === undefined || body.userId === null) {
        errors.push({ field: 'userId', msg: 'required' });
    } else if (!Number.isInteger(body.userId) || body.userId <= 0) {
        errors.push({ field: 'userId', msg: 'must be a positive integer' });
    }

    if (!body.address) {
        errors.push({ field: 'address', msg: 'required' });
    } else if (typeof body.address !== 'string' || body.address.trim() === '') {
        errors.push({ field: 'address', msg: 'must be a non-empty string' });
    }

    if (!body.items) {
        errors.push({ field: 'items', msg: 'required' });
    } else if (!Array.isArray(body.items) || body.items.length === 0) {
        errors.push({ field: 'items', msg: 'must be a non-empty array' });
    } else {
        body.items.forEach((item, idx) => {
            if (!item || typeof item !== 'object') {
                errors.push({ field: `items[${idx}]`, msg: 'must be an object' });
            } else {
                if (item.menuItemId === undefined) {
                    errors.push({ field: `items[${idx}].menuItemId`, msg: 'required' });
                } else if (!Number.isInteger(item.menuItemId) || item.menuItemId <= 0) {
                    errors.push({ field: `items[${idx}].menuItemId`, msg: 'must be a positive integer' });
                }

                if (item.quantity === undefined) {
                    errors.push({ field: `items[${idx}].quantity`, msg: 'required' });
                } else if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                    errors.push({ field: `items[${idx}].quantity`, msg: 'must be an integer >= 1' });
                }
            }
        });
    }

    if (body.total === undefined || body.total === null) {
        errors.push({ field: 'total', msg: 'required' });
    } else if (typeof body.total !== 'number' || body.total <= 0) {
        errors.push({ field: 'total', msg: 'must be a positive number' });
    }

    return errors;
}

// Part C3: Content Negotiation
function handleContentNegotiation(req, res, next) {
    const accept = req.get('Accept') || '*/*';
    if (accept.includes('application/json') || accept.includes('*/*')) {
        req.negotiatedType = 'json';
        return next();
    }
    if (accept.includes('application/xml') || accept.includes('text/xml')) {
        req.negotiatedType = 'xml';
        return next();
    }
    return problem(res, 406, 'not-acceptable', 'Not Acceptable', 'The requested media type is not supported. Use application/json or application/xml.');
}

function sendFormatted(req, res, status, data) {
    if (req.negotiatedType === 'xml') {
        res.set('Content-Type', 'application/xml; charset=utf-8');
        if (!data) return res.status(status).end();
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<order>';
        for (const [k, v] of Object.entries(data)) {
            xml += `<${k}>${typeof v === 'object' ? JSON.stringify(v) : v}</${k}>`;
        }
        xml += '</order>';
        return res.status(status).send(xml);
    }

    res.set('Content-Type', 'application/json; charset=utf-8');
    if (status === 204) return res.status(204).end();
    return res.status(status).json(data);
}

function etag(order) {
    return `"${crypto.createHash('sha256').update(JSON.stringify(order.asJson())).digest('hex').slice(0, 16)}"`;
}

function authRequired(req, res) {
    const header = req.get('Authorization') || '';
    if (!/^Bearer\s+\S+$/.test(header)) {
        problem(res, 401, 'unauthorized', 'Unauthorized', 'Authorization Bearer token is required.');
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
        return problem(res, 429, 'rate-limit-exceeded', 'Too Many Requests', 'Per-client request budget exceeded.');
    }
    next();
});

app.use(express.json({ strict: true }));
app.use(handleContentNegotiation);

// POST /orders — Place an order
app.post('/orders', async (req, res) => {
    try {
        const validationErrors = validateOrderPayload(req.body);
        if (validationErrors.length > 0) {
            return problem(res, 422, 'validation-failed', 'Validation failed', 'The request body contained invalid or missing fields.', validationErrors);
        }

        if (req.body.items.some(i => i.menuItemId === 999)) {
            return problem(res, 422, 'item-unavailable', 'That item is sold out', 'Paneer Roll is unavailable today');
        }

        const key = req.get('Idempotency-Key');
        const { order, repeated } = createOrder(req.body, key);
        if (repeated) {
            res.set('Location', `/orders/${order.id}`);
            return sendFormatted(req, res, 201, order.asJson());
        }

        try {
            const payment = await callPayment(order, key || `order-${order.id}`);
            order.paymentId = payment.paymentId || null;
            res.set('Location', `/orders/${order.id}`);
            return sendFormatted(req, res, 201, order.asJson());
        } catch (e) {
            rollbackOrder(order);
            if (e.nonRetryable) {
                return problem(res, 422, 'payment-declined', 'Payment declined', 'The payment provider rejected the order payment.');
            }
            res.set('Retry-After', '5');
            return problem(res, 503, 'service-unavailable', 'Service unavailable', 'Payment service unreachable.');
        }
    } catch (err) {
        console.error('[Internal Error]:', err);
        return problem(res, 500, 'internal-error', 'Internal server error', 'An unexpected error occurred while processing your request.');
    }
});

// GET /orders/:id — Read an order
app.get('/orders/:id', (req, res) => {
    const order = getOrder(req.params.id);
    if (!order) {
        return problem(res, 404, 'order-not-found', 'Order not found', `No order exists with id ${req.params.id}`);
    }
    const tag = etag(order);
    res.set('ETag', tag);
    res.set('Cache-Control', 'public, max-age=30, must-revalidate');
    if (req.get('If-None-Match') === tag) return res.status(304).end();
    return sendFormatted(req, res, 200, order.asJson());
});

// PATCH /orders/:id — Update order status
app.patch('/orders/:id', (req, res) => {
    const order = getOrder(req.params.id);
    if (!order) {
        return problem(res, 404, 'order-not-found', 'Order not found', `No order exists with id ${req.params.id}`);
    }
    if (order.status === 'DELIVERED') {
        return problem(res, 409, 'illegal-transition', 'Illegal state transition', 'Cannot modify an order that has already been delivered.');
    }
    if (req.body.status) order.status = req.body.status;
    return sendFormatted(req, res, 200, order.asJson());
});

// DELETE /orders/:id — Cancel/delete a draft order
app.delete('/orders/:id', (req, res) => {
    if (!authRequired(req, res)) return;
    const current = getOrder(req.params.id);
    if (!current) {
        return problem(res, 404, 'order-not-found', 'Order not found', `No order exists with id ${req.params.id}`);
    }
    const result = deleteOrder(req.params.id);
    if (result.conflict) {
        return problem(res, 409, 'illegal-transition', 'Illegal state transition', 'Paid or delivered orders cannot be deleted.');
    }
    return res.status(204).end();
});

// JSON parse error handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        return problem(res, 400, 'malformed-json', 'Malformed JSON', 'Request body contains invalid JSON syntax.');
    }
    console.error('[Unhandled Error]:', err);
    return problem(res, 500, 'internal-error', 'Internal server error', 'An unexpected error occurred.');
});

if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`CampusEats Orders service running on http://localhost:${port}`));
}

module.exports = { app, rateState };
