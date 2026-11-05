const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

let items = [
    { id: 1, name: 'Veg Thali', price: 90, available: true },
    { id: 2, name: 'Paneer Roll', price: 70, available: true },
    { id: 3, name: 'Masala Dosa', price: 60, available: true },
    { id: 4, name: 'Idli Sambhar', price: 50, available: false }
];

let nextId = 5;

app.get('/items', (req, res) =>{
    res.status(200).json(items);
});

app.get('/items/:id', (req, res) =>{
    const id = Number(req.params.id);
    const item = items.find(item => item.id === id);
    if(!item){
        return res.status(404).json({
            error: 'Item not found'
        });
    }
    res.status(200).json(item);
});

app.post('/items', (req, res) => {
    const { name, price, available } = req.body;
    if(!name || price === undefined || price === null){
        return res.status(422).json({
            error: 'Name and price are required'
        });
    }
    if (typeof name !== 'string' || !name.trim() || !Number.isFinite(Number(price)) || Number(price) <= 0){
        return res.status(422).json({
            error: 'Enter a valid name and positive price'
        });
    }

    const newItem = {
        id: nextId++,
        name: name.trim(),
        price: Number(price),
        available: available === undefined ? true : Boolean(available)
    };

    items.push(newItem);

    res.status(201).json(newItem);
});

app.delete('/items/:id', (req, res) => {
    const id = Number(req.params.id);

    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'not found' });
    }

    items.splice(index, 1);

    res.status(204).send();
});

app.post('/items', (req, res) => {
    const { name, price, available } = req.body;

    if (!name || !name.trim() || price === undefined || price === null) {
        return res.status(422).json({
            error: 'Name and price are required'
        });
    }
});

app.listen(PORT, () => {
    console.log(`CampusEats server running at http://localhost:${PORT}`);
});
