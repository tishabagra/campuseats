ASSIGNMENT 09
Securing the Catalogue REST API


1. overview
This project secures the existing Catalogue REST API using password hashing, JSON Web Tokens (JWT), authentication middleware, and role-based authorization. The existing service is reused; it is not a new API.The application uses Node.js, Express, SQLite (better-sqlite3), bcryptjs, jsonwebtoken and dotenv.

2. Prerequisites and files
? Install Node.js and npm.
? Keep server.js, database.js, package.json, .env, .env.example and the public folder in the project directory.
? The SQLite database file (catalogue.db) is created automatically by database.js if it does not exist.
Open PowerShell and move to the project directory:
cd C:\cs543\Assignment-9
Install the required packages (if they are not already installed):
npm install express jsonwebtoken bcryptjs dotenv better-sqlite3
Create a .env file in the project root. Use your own long, random secret; do not commit this file:
JWT_SECRET=replace_this_with_a_long_random_secret
PORT=3000
Create .env.example and commit this template instead:
JWT_SECRET=
PORT=3000
Make sure .gitignore contains:
node_modules/
.env
catalogue.db

Do not publish the real JWT secret. If the database is intentionally required by your instructor, follow the instructor's submission rule for catalogue.db; otherwise keep the local demo database out of Git.



3. Seeded demonstration accounts
The supplied database.js seeds these accounts when the users table is empty. Passwords are stored as bcrypt hashes, not plain text.
RoleEmailDemo passwordcustomerasha@campus.educustomer123restaurantmealhub@campus.eduresto123adminadmin@campus.eduadmin123customerriya@campus.eduriya123
Important: database.js inserts demo users only when the users table is empty. If an older catalogue.db already contains users, changing the seed code will not automatically update existing rows.

4. Start the server
In the first PowerShell window, run:
cd C:\cs543\Assignment-9
node server.js
Expected startup message:
Secured Catalogue on http://localhost:3000

Keep this terminal open. Open a second PowerShell window for the demonstration commands below.

5. Five required demonstrations
Demo 1 – Request without a token (401)
curl.exe -i http://localhost:3000/items
Expected: HTTP/1.1 401 Unauthorized. The request has no Bearer token, so authentication fails.
Demo 2 – Successful login and JWT token (200)
$body = @{
    email = "asha@campus.edu"
    password = "customer123"
} | ConvertTo-Json

$customerLogin = Invoke-RestMethod `
    -Uri "http://localhost:3000/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$customerToken = $customerLogin.token
$customerToken
Expected: the login request succeeds and returns a JWT. Keep this PowerShell window open because later commands use $customerToken.
Demo 3 – GET items with a valid customer token (200)
curl.exe -i `
    -H "Authorization: Bearer $customerToken" `
    http://localhost:3000/items
Expected: HTTP/1.1 200 OK and the catalogue items in the response.
Get a restaurant token for Demo 4
$body = @{
    email = "mealhub@campus.edu"
    password = "resto123"
} | ConvertTo-Json

$restaurantLogin = Invoke-RestMethod `
    -Uri "http://localhost:3000/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$restaurantToken = $restaurantLogin.token
Demo 4 – Add an item with a restaurant token (201)
$newItem = @{
    name = "Masala Dosa"
    price = 80
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://localhost:3000/items" `
    -Method Post `
    -Headers @{ Authorization = "Bearer $restaurantToken" } `
    -ContentType "application/json" `
    -Body $newItem `
    -UseBasicParsing
Expected: HTTP 201 Created and the new item in the response. If the item name already exists, choose another name; the API's in-memory list is reset when the server restarts.
Demo 5 – Customer attempts to add an item (403)
Invoke-WebRequest `
    -Uri "http://localhost:3000/items" `
    -Method Post `
    -Headers @{ Authorization = "Bearer $customerToken" } `
    -ContentType "application/json" `
    -Body '{"name":"Pizza","price":120}' `
    -UseBasicParsing
Expected: HTTP 403 Forbidden with {"error":"forbidden"}. PowerShell may display a red WebException for a non-2xx HTTP response; this is expected for this test.




6. Questions

1. Which route(s) require only authentication, and which also require a role? Give the method + path and the role allowed for each.
The following table describes the routes in the supplied server.js. The POST and DELETE route declarations must use requireRole('restaurant', 'admin') to match this table and the assignment tutorial.
Method + pathGuard / permissionAccess rulePOST /loginPublicNo authentication requiredGET /itemsauthAny authenticated userGET /items/:idauthAny authenticated userPOST /itemsauth + requireRole('restaurant','admin')Restaurant and adminDELETE /items/:idauth + requireRole('restaurant','admin')Restaurant and adminGET /ordersauth + role/ownership checks in handlerAdmin sees all orders; customer sees own orders; other roles receive 403GET /orders/:idauth + ownership check in handlerAdmin can view any order; customer can view only their own order
Required route check: In server.js, use the following middleware order on both write routes:
app.post('/items', auth, requireRole('restaurant', 'admin'), (req, res) => {
    // existing POST handler
});

app.delete('/items/:id', auth, requireRole('restaurant', 'admin'), (req, res) => {
    // existing DELETE handler
});

If your actual server.js still says requireRole('restaurant') only, then admin is not permitted to write. Either update both route declarations as shown or change the README permissions to match the actual code. The assignment tutorial's example allows both restaurant and admin.




2. Show one 401 and one 403 from your demo. In one line each, say why the server returned that code (not the other).
401 Unauthorized: GET /items without an Authorization: Bearer token returns 401 because the server cannot authenticate the request.
403 Forbidden: POST /items with a valid customer token returns 403 because the customer is authenticated but does not have the restaurant/admin role required to add an item.
Difference: 401 means authentication is missing or invalid; 403 means the identity is authenticated but lacks permission for the requested action.

3. What is inside your JWT payload? Why is it safe to trust the role claim on the server, and why must the secret stay out of your code?
The application signs a JWT containing the user's database ID and role:
{
    sub: user.id,
    role: user.role
}
The token is signed with the server-side secret and verified using jwt.verify(token, SECRET). The server can trust the role claim only after successful signature verification; a client must not be allowed to supply or edit the role independently. A JWT payload is encoded, not encrypted, so it must not contain passwords or other secrets.
JWT_SECRET must stay out of source code and public repositories. If exposed, an attacker could use it to create forged tokens that pass signature verification. The application reads it from process.env.JWT_SECRET, loaded from the ignored .env file. The blank .env.example documents the required variable without revealing the secret.


