require('dotenv').config();                 // loads .env (git-ignored) into process.env
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.JWT_SECRET;      // never hard-code the secret
if (!SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// ---------------------------------------------------------------- 1. Users
// Passwords are stored ONLY as bcrypt hashes (never plain text).
const users = [
  { id: 1, username: 'alice', role: 'customer',   passwordHash: bcrypt.hashSync('alice123', 10) },
  { id: 2, username: 'bob',   role: 'restaurant', passwordHash: bcrypt.hashSync('bob123',   10) }
];

// ---------------------------------------------------------------- Catalogue data
const items = [
  { id: 1, name: 'Margherita Pizza', price: 250 },
  { id: 2, name: 'Veg Burger',       price: 120 }
];
let nextId = 3;

// ---------------------------------------------------------------- 3. Authentication
// "Who are you?"  Reads  Authorization: Bearer <token>, verifies it.
function auth(req, res, next) {
  const token = (req.get('Authorization') || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'token missing' });
  try {
    req.user = jwt.verify(token, SECRET);   // throws if invalid or expired
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'token expired' : 'invalid token';
    res.status(401).json({ error: msg });
  }
}

// ---------------------------------------------------------------- 4. Authorization
// "May you?"  Must run AFTER auth (it relies on req.user).
const requireRole = (...allowed) => (req, res, next) =>
  allowed.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: 'forbidden' });

// ---------------------------------------------------------------- 2. Login
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find(u => u.username === username);

  if (!user || typeof password !== 'string' || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },       // payload: user id + role only
    SECRET,
    { expiresIn: '1h' }                     // expiry
  );
  res.json({ token });
});

// ---------------------------------------------------------------- Routes
// Authentication only: any logged-in user may read.
app.get('/items', auth, (req, res) => res.json(items));

app.get('/items/:id', auth, (req, res) => {
  const item = items.find(i => i.id === Number(req.params.id));
  item ? res.json(item) : res.status(404).json({ error: 'not found' });
});

// Authentication + role: only restaurant (or admin) may create.
app.post('/items', auth, requireRole('restaurant', 'admin'), (req, res) => {
  const { name, price } = req.body || {};
  if (!name || typeof price !== 'number') {
    return res.status(400).json({ error: 'name (string) and price (number) required' });
  }
  const item = { id: nextId++, name, price };
  items.push(item);
  res.status(201).json(item);
});

app.listen(PORT, () => console.log(`Secured Catalogue API on http://localhost:${PORT}`));
