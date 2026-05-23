const logger = require('../utils/logger');

// ─── Socket.IO Handler ───────────────────────────────────────────────────
const socketHandler = (io) => {
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // User authentication via socket
    socket.on('authenticate', (data) => {
      if (data?.userId) {
        connectedUsers.set(data.userId, socket.id);
        socket.userId = data.userId;
        socket.join(`user_${data.userId}`);
        socket.emit('authenticated', { status: 'ok', socketId: socket.id });
        logger.info(`👤 User ${data.userId} authenticated via socket`);
      }
    });

    // Agent thinking indicator
    socket.on('agent:thinking', (data) => {
      socket.to(`user_${socket.userId}`).emit('agent:thinking', data);
    });

    // Real-time voice processing status
    socket.on('voice:start', () => {
      socket.emit('voice:listening', { status: 'listening' });
    });

    socket.on('voice:stop', () => {
      socket.emit('voice:processing', { status: 'processing' });
    });

    // Desktop automation progress
    socket.on('automation:progress', (data) => {
      io.to(`user_${socket.userId}`).emit('automation:progress', data);
    });

    // File generation progress
    socket.on('file:generating', (data) => {
      io.to(`user_${socket.userId}`).emit('file:generating', data);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  // Export helper to send events to specific users
  io.sendToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
  };
};

module.exports = socketHandler;
