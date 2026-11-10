require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    throw new Error('JWT_SECRET is missing from .env file');
}

// POST /login -- verify credentials using database
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = db.prepare(
        'SELECT * FROM users WHERE email = ?'
    ).get(email);

    if (!user || !bcrypt.compareSync(password || '', user.hash)) {
        return res.status(401).json({ error: 'bad login' });
    }

    const token = jwt.sign(
        { sub: user.id, role: user.role },
        SECRET,
        { expiresIn: '1h' }
    );

    res.json({ token });
});

// Authentication middleware
function auth(req, res, next) {
    const header = req.get('Authorization') || '';

    if (!header.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'invalid or missing token'
        });
    }

    const token = header.split(' ')[1];

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        res.status(401).json({
            error: 'invalid or missing token'
        });
    }
}

// Authorization middleware
const requireRole = (...ok) => (req, res, next) => {
    ok.includes(req.user.role)
        ? next()
        : res.status(403).json({
            error: 'forbidden'
        });
};
// Menu remains in memory
let items = [
    { id: 1, name: 'Veg Thali', price: 90 },
    { id: 2, name: 'Paneer Roll', price: 70 }
];

let nextId = 3;

// GET /items -- any authenticated user
app.get('/items', auth, (req, res) => {
    res.json(items);
});

// GET /items/:id -- get one dish
app.get('/items/:id', auth, (req, res) => {
    const item = items.find(
        i => i.id === Number(req.params.id)
    );

    if (!item) {
        return res.status(404).json({ error: 'not found' });
    }

    res.json(item);
});

// POST /items -- restaurant or admin
app.post('/items', auth, requireRole('restaurant', 'admin'), (req, res) => {
    const { name, price } = req.body;

    if (!name || price === undefined || !Number.isFinite(Number(price))) {
    return res.status(422).json({
        error: 'Name and price are required'
    });
}
    const item = {
        id: nextId++,
        name,
        price: Number(price)
    };

    items.push(item);

    res.status(201).json(item);
});

// DELETE /items/:id -- restaurant or admin
app.delete('/items/:id', auth, requireRole('restaurant', 'admin'), (req, res) => {
    const index = items.findIndex(
        i => i.id === Number(req.params.id)
    );

    if (index === -1) {
        return res.status(404).json({ error: 'not found' });
    }

    items.splice(index, 1);

    res.status(204).send();
});

// GET /orders -- customers see only their orders
// Admin sees all orders
app.get('/orders', auth, (req, res) => {
    if (req.user.role === 'admin') {
        const orders = db.prepare(
            'SELECT * FROM orders'
        ).all();

        return res.json(orders);
    }

    if (req.user.role !== 'customer') {
        return res.status(403).json({ error: 'forbidden' });
    }

    const orders = db.prepare(
        'SELECT * FROM orders WHERE customerId = ?'
    ).all(Number(req.user.sub));

    res.json(orders);
});

// GET /orders/:id -- object-level ownership check
app.get('/orders/:id', auth, (req, res) => {
    const order = db.prepare(
        'SELECT * FROM orders WHERE id = ?'
    ).get(Number(req.params.id));

    if (!order) {
        return res.status(404).json({
            error: 'order not found'
        });
    }

    if (req.user.role !== 'admin' &&
        (req.user.role !== 'customer' ||
         order.customerId !== Number(req.user.sub))) {
        return res.status(403).json({ error: 'forbidden' });
    }

    res.json(order);
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Secured Catalogue on http://localhost:${PORT}`);
});
