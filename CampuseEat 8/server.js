const express = require("express");
const path = require("path");

const app = express();
const PORT = 4000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Seed Data
let items = [
    {
        id: 1,
        name: "Veg Burger",
        price: 80,
        available: true
    },
    {
        id: 2,
        name: "Pizza",
        price: 150,
        available: true
    },
    {
        id: 3,
        name: "Cold Coffee",
        price: 60,
        available: false
    }
];

let nextId = 4;

// GET All Items
app.get("/items", (req, res) => {
    res.status(200).json(items);
});

// GET Item By ID
app.get("/items/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const item = items.find(i => i.id === id);

    if (!item) {
        return res.status(404).json({
            error: "Item not found"
        });
    }

    res.status(200).json(item);
});

// POST New Item
app.post("/items", (req, res) => {

    const { name, price, available } = req.body;

    if (!name || price === undefined || available === undefined) {
        return res.status(422).json({
            error: "name, price and available fields are required"
        });
    }

    const newItem = {
        id: nextId++,
        name,
        price,
        available
    };

    items.push(newItem);

    res.status(201).json(newItem);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});