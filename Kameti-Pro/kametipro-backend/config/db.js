const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * Exits the process on failure so the server doesn't start in a broken state.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8 no longer needs useNewUrlParser / useUnifiedTopology
    });
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌  MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
