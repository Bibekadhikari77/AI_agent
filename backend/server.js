const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const socketHandler = require('./services/socketService');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const fileRoutes = require('./routes/fileRoutes');
const automationRoutes = require('./routes/automationRoutes');
const memoryRoutes = require('./routes/memoryRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect Database
connectDB();

// Startup diagnostics (do not log secrets)
logger.info(`🤖 AI Provider: ${(process.env.AI_PROVIDER || 'openai').toLowerCase()}`);
logger.info(`🔑 GEMINI_API_KEY set: ${Boolean(process.env.GEMINI_API_KEY)}`);
logger.info(`🔑 OPENAI_API_KEY set: ${Boolean(process.env.OPENAI_API_KEY)}`);

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'app://.',          // Electron
    'file://'           // Electron file protocol
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/memory', memoryRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Socket.IO Handlers
socketHandler(io);

// Make io accessible globally
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 AI Agent Server running on port ${PORT}`);
  logger.info(`📡 Socket.IO enabled`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, io };
