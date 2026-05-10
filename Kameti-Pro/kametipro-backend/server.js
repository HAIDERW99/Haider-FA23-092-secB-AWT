require('dotenv').config();
const app       = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start the HTTP server
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀  Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`);
    console.log(`📋  API docs: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated.');
      process.exit(0);
    });
  });
});
