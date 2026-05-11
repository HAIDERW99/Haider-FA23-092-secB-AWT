const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 *
 * In a traditional server (local dev / server.js), this runs once on startup.
 *
 * In a Vercel serverless environment, the Node.js process may be reused across
 * requests (warm lambda). We check mongoose.connection.readyState to avoid
 * opening duplicate connections on warm invocations.
 *
 * readyState values: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
const connectDB = async () => {
  // Already connected — reuse the existing connection (serverless warm start)
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌  MongoDB connection error: ${err.message}`);
    // In serverless, don't call process.exit() — it kills the lambda.
    // Throw instead so the caller (api/index.js) can handle it gracefully.
    if (process.env.VERCEL) {
      throw err;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
