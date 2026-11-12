# CS543 Assignment 8

## Team Members

Paras Pandey(20251651068)
Pankaj Singh(20251651067)
Jayesh (20251651049)
Pranav(20251651069)
Shivam(20251651082)

---

## How to Run

1. npm install
2. node server.js
3. Open http://localhost:4000

---

## 1. Selected CampusEats Service

Menu/Catalogue Service

### Routes

GET /items

GET /items/:id

POST /items

---

## 2. Status Codes Used

200 OK
- Successfully fetched data

201 Created
- New item added successfully

404 Not Found
- Item does not exist

422 Unprocessable Entity
- Required field missing

---

## 3. req.params and req.body

req.params:
Used in GET /items/:id to read the item ID from URL.

In this project it is used in:

GET /items/:id

Example:
req.params.id

req.body:
Used in POST /items to receive item data sent by user.

In this project it is used in:

POST /items

Example:
req.body.name
req.body.price

express.json():
Used to convert incoming JSON data into JavaScript objects so that req.body can read the values properly.

Example:

app.use(express.json());

GitHub Repository Link --
https://github.com/pandeypandey01/campusEat

Google Drive link --
https://drive.google.com/file/d/1dewastFTqMkdtf988EaPPDM2jt7BGrok/view?usp=sharing