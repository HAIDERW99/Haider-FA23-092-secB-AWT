/**
 * Vercel Serverless Entry Point
 *
 * Vercel invokes this file as a serverless function.
 * It connects to MongoDB (with connection caching) and
 * delegates every request to the existing Express app.
 *
 * Local development is NOT affected — server.js still runs
 * the app normally via app.listen().
 */

require('dotenv').config();
const app       = require('../app');
const connectDB = require('../config/db');

// Cache the DB connection promise across warm invocations.
// Vercel reuses the same Node.js process for subsequent requests
// within the same lambda instance, so we only connect once.
let dbConnectionPromise = null;

module.exports = async (req, res) => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch((err) => {
      // Reset so the next cold start retries the connection
      dbConnectionPromise = null;
      throw err;
    });
  }

  await dbConnectionPromise;

  // Hand off to Express
  return app(req, res);
};
