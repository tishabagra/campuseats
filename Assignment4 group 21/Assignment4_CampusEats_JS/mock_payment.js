const express = require('express');
const app = express();
app.use(express.json());
app.post('/payments', (req, res) => res.status(201).json({ paymentId: `PAY-${req.body.orderId}` }));
app.listen(4000, () => console.log('Mock Payments service running on http://localhost:4000/payments'));
