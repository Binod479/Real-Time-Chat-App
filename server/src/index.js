import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initializeDatabase } from './database/initDb.js';
import { socketAuthMiddleware } from './sockets/socketAuth.js';
import { registerChatHandlers } from './sockets/chatHandler.js';
import { errorHandler } from './middleware/error.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import roomsRoutes from './routes/rooms.routes.js';
import messagesRoutes from './routes/messages.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Store io on app instance for optional REST route access
app.set('io', io);

// Express Middleware
app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO authentication middleware and event handlers
io.use(socketAuthMiddleware);
registerChatHandlers(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'PERN Real-Time Chat Server',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/messages', messagesRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server & Auto-initialize DB schema
const startServer = async () => {
  try {
    // Attempt automatic table migration
    await initializeDatabase().catch((err) => {
      console.warn(
        '⚠️ Database auto-migration skipped or encountered error (ensure DB credentials in .env are correct):',
        err.message
      );
    });

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 PERN Chat Server running on port ${PORT}`);
      console.log(`📡 Socket.IO server ready for connections`);
      console.log(`🌐 Accepting requests from: ${CLIENT_URL}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
