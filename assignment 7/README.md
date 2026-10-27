# Campus Library — GraphQL + Node.js + MySQL

A small full-stack GraphQL application. The browser queries authors and nested books through Apollo Server, and a form adds books to MySQL.

## Requirements
- Node.js 18+
- MySQL 8 or compatible MariaDB
- VS Code with Live Server extension

## Setup
1. Start MySQL.
2. Run `schema.sql` in MySQL Workbench/phpMyAdmin, or from a terminal:
   ```bash
   mysql -u root -p < schema.sql
   ```
3. Copy `.env.example` to `.env` and set your actual MySQL password/port.
   Windows PowerShell: `Copy-Item .env.example .env`
4. Install dependencies and start the API:
   ```bash
   npm install
   npm start
   ```
   API and Apollo Sandbox: `http://localhost:4000/`
5. In VS Code, right-click `public/index.html` and select **Open with Live Server**. The configured origin is normally `http://127.0.0.1:5500`.

If MySQL uses port 3307, set `DB_PORT=3307` in `.env`. Never commit `.env`.

## Test query
```graphql
query {
  authors {
    id
    name
    country
    books { id title year }
  }
}
```

## Test mutation
```graphql
mutation {
  addBook(title: "GraphQL for Beginners", year: 2025, authorId: "2") {
    id
    title
    year
    author { name }
  }
}
```

Filter books:
```graphql
query { books(year: 2023) { title year author { name } } }
```

Delete a book:
```graphql
mutation { deleteBook(id: "1") }
```

## Troubleshooting
- `Access denied`: verify DB_USER, DB_PASSWORD and DB_PORT in `.env`.
- `ECONNREFUSED`: start MySQL and check its port.
- Browser connection/CORS error: ensure API runs on port 4000 and Live Server uses `localhost:5500` or `127.0.0.1:5500`. Add a different Live Server origin to the CORS list in `server.js` if needed.
- PowerShell blocks npm scripts: use `npm.cmd install` and `npm.cmd start`.

## Team details
Team ID: 21

| Member | Roll number | Name |
|---|---|---|
| 1 | 20251651097 | Tisha Bagra |
| 2 | 20251651045 | Ishu Rajput |
| 3 | 20251651051 | Komal |
| 4 | 20251651103 | Vinita Rathore |
| 5 | 20251651080 | Rupini C Bhojannavar |
