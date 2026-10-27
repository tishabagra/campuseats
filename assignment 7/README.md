# CampusEats GraphQL — Dishes Service
**CS543 · Web Services · Assignment 7 of 12**

## Which CampusEats service did you pick?
We picked the **Menu/Dishes service**. It lists campus food dishes and allows a user to add a dish.

## Name one field a client can skip and one it cannot. Why use `!`?
A client can skip `available` in a selection set if it does not need the status. It cannot omit `name` from `AddDishInput`, because `name: String!` is required. GraphQL's `!` means non-null: a required input must be supplied and a non-null output must not resolve to null.

## Map the GraphQL operation to SQL.
For `dish(id: ID!)`, the resolver maps the supplied `id` to SQL `WHERE id = ?`. The `addDish` mutation resolver runs `INSERT INTO dishes (name, price, available) VALUES (?, ?, ?)`.

## Team — Group ID 21
| Roll number | Name |
|---|---|
| 20251651097 | Tisha Bagra |
| 20251651045 | Ishu Rajput |
| 20251651051 | Komal |
| 20251651103 | Vinita Rathore |
| 20251651080 | Rupini C Bhojannavar |

## Run the project
Requirements: Node.js 18+ and MySQL.

1. Open this folder in VS Code.
2. Run `schema.sql` in MySQL Workbench or phpMyAdmin. It creates the database and seeds four dishes.
3. Copy `.env.example` to `.env` and set your MySQL credentials.
4. In the project terminal run `npm install`, then `npm start`.
5. Open **http://localhost:4000**. The page uses `fetch()` to query `/graphql` and submit the `addDish` mutation.

### Example query
```graphql
query { dishes { id name price available } }
```

### Example mutation
```graphql
mutation { addDish(input: { name: "Paneer Roll", price: 90 }) { id name price } }
```

## Submission checklist
- Before screenshot: start the app and capture the initial four dishes.
- Add `Paneer Roll` with price `90`.
- After screenshot: capture the list showing the newly added dish.
- Record a short demo video showing the page and mutation; upload the video and two screenshots to Google Drive.
- Push the folder to your team's GitHub repository and add links below.

GitHub repository: **[Add your team repository URL]**  
Google Drive demo and screenshots: **[Add your share link]**

Note: The project files are supplied here; you must run them locally, verify your MySQL credentials, take the actual screenshots, record the video, and upload those deliverables.
