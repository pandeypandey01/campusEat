const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const db = require('./db');

const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8');

// map a DB row to the GraphQL Dish shape (TINYINT -> Boolean, DECIMAL -> Number)
const toDish = (r) => ({ id: r.id, name: r.name, price: Number(r.price), available: !!r.available, description: null });

const resolvers = {
  Query: {
    dishes: async () => {
      const [rows] = await db.query('SELECT id, name, price, available FROM dishes ORDER BY id');
      return rows.map(toDish);
    },
    dish: async (_, { id }) => {
      const [rows] = await db.query('SELECT id, name, price, available FROM dishes WHERE id = ?', [id]);
      return rows[0] ? toDish(rows[0]) : null;
    },
  },
  Mutation: {
    addDish: async (_, { input }) => {
      const { name, price, available } = input;
      const [result] = await db.query(
        'INSERT INTO dishes (name, price, available) VALUES (?, ?, ?)', [name, price, available]);
      const [rows] = await db.query('SELECT id, name, price, available FROM dishes WHERE id = ?', [result.insertId]);
      return toDish(rows[0]);
    },
  },
};

async function start() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/graphql', cors(), express.json(), expressMiddleware(server));
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Page: http://localhost:${port}   GraphQL: http://localhost:${port}/graphql`));
}
start();
