require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const pool = require('./db');

const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    country: String
    books: [Book!]!
  }
  type Book {
    id: ID!
    title: String!
    year: Int
    author: Author!
  }
  type Query {
    authors: [Author!]!
    author(id: ID!): Author
    books(year: Int): [Book!]!
  }
  type Mutation {
    addBook(title: String!, year: Int, authorId: ID!): Book!
    deleteBook(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    authors: async () => {
      const [rows] = await pool.query('SELECT id, name, country FROM authors ORDER BY name');
      return rows;
    },
    author: async (_parent, { id }) => {
      const [rows] = await pool.query('SELECT id, name, country FROM authors WHERE id = ?', [id]);
      return rows[0] || null;
    },
    books: async (_parent, { year }) => {
      const sql = year == null
        ? 'SELECT id, title, year, author_id FROM books ORDER BY title'
        : 'SELECT id, title, year, author_id FROM books WHERE year = ? ORDER BY title';
      const [rows] = year == null ? await pool.query(sql) : await pool.query(sql, [year]);
      return rows;
    }
  },
  Author: {
    books: async author => {
      const [rows] = await pool.query(
        'SELECT id, title, year, author_id FROM books WHERE author_id = ? ORDER BY title', [author.id]
      );
      return rows;
    }
  },
  Book: {
    author: async book => {
      const [rows] = await pool.query('SELECT id, name, country FROM authors WHERE id = ?', [book.author_id]);
      if (!rows[0]) throw new Error('Author for this book was not found.');
      return rows[0];
    }
  },
  Mutation: {
    addBook: async (_parent, { title, year, authorId }) => {
      const cleanTitle = title.trim();
      if (!cleanTitle) throw new Error('Book title cannot be empty.');
      const [authors] = await pool.query('SELECT id FROM authors WHERE id = ?', [authorId]);
      if (!authors.length) throw new Error('The selected author does not exist.');
      const [result] = await pool.query(
        'INSERT INTO books (title, year, author_id) VALUES (?, ?, ?)',
        [cleanTitle, year ?? null, authorId]
      );
      const [rows] = await pool.query(
        'SELECT id, title, year, author_id FROM books WHERE id = ?', [result.insertId]
      );
      return rows[0];
    },
    deleteBook: async (_parent, { id }) => {
      const [result] = await pool.query('DELETE FROM books WHERE id = ?', [id]);
      return result.affectedRows > 0;
    }
  }
};

async function start() {
  const server = new ApolloServer({ typeDefs, resolvers });
  const port = Number(process.env.PORT || 4000);
  const { url } = await startStandaloneServer(server, {
    listen: { port },
    cors: {
      origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
      credentials: false
    }
  });
  console.log(`Campus Library GraphQL API ready at ${url}`);
}
start().catch(error => {
  console.error('Could not start GraphQL API:', error.message);
  process.exit(1);
});
