# CampusEats · Menu service in GraphQL (CS543 Assignment 7)

**Team:** 20251651068 paras pandey
      20251651067 Pankaj singh 
      20251651069 Pranav
      20251651049 Jayesh
      20251651082 Shivam 
  **team no 24**

**Run:** `npm install && mysql -u root -p < schema.sql && node server.js` → open http://localhost:4000
(DB settings via env: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; defaults are `localhost` / `root` / empty / `campuseats`.)


## Answers
1. **Service picked:** Menu (`dishes` table: id, name, price, available).
2. **Skippable vs. required:** `description` is nullable (`String`, no `!`), so a client may leave it out of a query and it may come back `null`. `name: String!` is non-null: the server guarantees it is always present, and `addDish` rejects an input without it (`price: Float!` likewise), so clients never have to null-check it.
3. **GraphQL → SQL:**
   - `dish(id: 2)` → the `id` argument became the WHERE clause: `SELECT id, name, price, available FROM dishes WHERE id = ?`. The `dishes` list query has no WHERE (`SELECT ... FROM dishes ORDER BY id`).
   - The `Mutation.addDish` resolver in `server.js` ran the `INSERT INTO dishes (name, price, available) VALUES (?, ?, ?)`.
