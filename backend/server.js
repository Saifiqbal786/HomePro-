require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { initDb } = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function startServer() {
    // Initialize database first (sql.js requires async init)
    await initDb();
    logger.info('Database initialized');

    // Now require app (which uses getDb synchronously)
    const app = require('./app');

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    // Setup real-time features
    const { setupSocket } = require('./realtime/socket');
    setupSocket(io);

    // Make io available to routes
    app.set('io', io);

    // Start server
    server.listen(PORT, () => {
        logger.info(`🚀 HomePro server running on http://localhost:${PORT}`);
        logger.info(`📦 API available at http://localhost:${PORT}/api`);
        logger.info(`🌐 Frontend served from http://localhost:${PORT}`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
