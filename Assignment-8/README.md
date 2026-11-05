CampusEats Catalogue Service – Assignment 8


How to Run:
Open the project folder in the terminal and execute npm install followed by npm start. Open http://localhost:3000 in your browser.
1. Which CampusEats service did you pick, and what are its routes?
I selected the Catalogue (Menu Items) Service. It manages food menu items.   
HTTP Method  
Route
Description
GET
/items
Get all menu items

GET
/items/:id
Get a menu item by ID

POST
/items
Add a new menu item


2. Which status codes did you return, and for which outcomes?
200 OK: When menu items are successfully retrieved.
201 Created: When a new menu item is successfully added.
404 Not Found: When the requested menu item ID does not exist.
422 Unprocessable Entity: When required fields (name or price) are missing or invalid.

3. Where did you use req.params and where req.body? Why does POST need express.json()?
req.params: Used in GET /items/:id to retrieve the item ID from the URL.
req.body: Used in POST /items to access the new item's details, such as name, price, and availability.
express.json(): Used as middleware to parse incoming JSON request data and make it available in req.body. Without it, Express cannot automatically read JSON request bodies.
Technologies Used
* Node.js
* Express.js
* HTML
* CSS
* JavaScript
The menu items are stored in an in-memory array. Therefore, newly added items are reset when the server restarts.
