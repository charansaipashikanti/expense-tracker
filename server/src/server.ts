import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { configureCloudinary } from './config/cloudinary';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Configure Cloudinary
    configureCloudinary();

    // Start server
    app.listen(env.PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║         Room Expense Tracker API Server           ║
╠═══════════════════════════════════════════════════╣
║  🚀 Server:  http://localhost:${String(env.PORT).padEnd(23)}║
║  📊 Health:  http://localhost:${env.PORT}/api/health       ║
║  🌍 Env:     ${String(env.NODE_ENV).padEnd(37)}║
╚═══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  console.error('❌ Unhandled Rejection:', reason.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

startServer();
