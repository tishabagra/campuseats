const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const db = require("./db");
require("dotenv").config();

const typeDefs = fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8");
const resolvers = {
  Query: {
    dishes: async () => {
      const [rows] = await db.execute("SELECT id, name, price, available FROM dishes ORDER BY id");
      return rows.map(r => ({ ...r, available: Boolean(r.available) }));
    },
    dish: async (_, { id }) => {
      const [rows] = await db.execute("SELECT id, name, price, available FROM dishes WHERE id = ?", [id]);
      return rows.length ? { ...rows[0], available: Boolean(rows[0].available) } : null;
    }
  },
  Mutation: {
    addDish: async (_, { input }) => {
      const available = input.available === undefined ? true : input.available;
      const [result] = await db.execute(
        "INSERT INTO dishes (name, price, available) VALUES (?, ?, ?)",
        [input.name, input.price, available]
      );
      const [rows] = await db.execute(
        "SELECT id, name, price, available FROM dishes WHERE id = ?", [result.insertId]
      );
      return { ...rows[0], available: Boolean(rows[0].available) };
    }
  }
};
async function start() {
  const app = express();
  app.use(cors());
  app.use(express.static(path.join(__dirname, "public")));
  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();
  app.use("/graphql", express.json(), expressMiddleware(apollo));
  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => console.log(`CampusEats running at http://localhost:${port} (GraphQL: /graphql)`));
}
start().catch(err => { console.error(err); process.exit(1); });
