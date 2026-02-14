import app from './app';
import dotenv from 'dotenv';
import db from './db/connection';

// Load environment variables from .env file
dotenv.config();

// Server configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Graceful shutdown function
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    await db.disconnect();
    console.log('Database connection closed');
    
    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle different shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));  // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Kubernetes/Docker stop

// Start the server
const startServer = async () => {
  try {
    // First connect to MongoDB
    await db.connect();
    
    // Then start Express server
    const server = app.listen(PORT, () => {
      console.log(`
        🚀 Server running on http://${HOST}:${PORT}
        📊 Health check: http://${HOST}:${PORT}/health
        🗄️  Database: ${db.isDBConnected() ? 'Connected ✅' : 'Disconnected ❌'}
        ⏰ Started at: ${new Date().toISOString()}
      `);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();
