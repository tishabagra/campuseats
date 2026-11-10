
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('catalogue.db');

db.pragma('foreign_keys = ON');

// Create users table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        hash TEXT NOT NULL
    );
`);

// Create orders table
db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY,
        customerId INTEGER NOT NULL,
        item TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY (customerId) REFERENCES users(id)
    );
`);

// Insert demo users only if the table is empty
const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get();

if (userCount.count === 0) {
    const insertUser = db.prepare(`
        INSERT INTO users (id, email, role, hash)
        VALUES (?, ?, ?, ?)
    `);

    insertUser.run(1, 'asha@campus.edu', 'customer',
        bcrypt.hashSync('customer123', 10));

    insertUser.run(2, 'mealhub@campus.edu', 'restaurant',
        bcrypt.hashSync('resto123', 10));

    insertUser.run(3, 'admin@campus.edu', 'admin',
        bcrypt.hashSync('admin123', 10));

    insertUser.run(4, 'riya@campus.edu', 'customer',
        bcrypt.hashSync('riya123', 10));
}

// Insert demo orders only if the table is empty
const orderCount = db.prepare('SELECT COUNT(*) AS count FROM orders').get();

if (orderCount.count === 0) {
    const insertOrder = db.prepare(`
        INSERT INTO orders (id, customerId, item, quantity, total)
        VALUES (?, ?, ?, ?, ?)
    `);

    insertOrder.run(101, 1, 'Veg Thali', 2, 180);
    insertOrder.run(102, 4, 'Paneer Roll', 1, 70);
    insertOrder.run(103, 1, 'Paneer Roll', 2, 140);
}

module.exports = db;
