const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth-config');
const User = require('../models/User');

function setupSocket(io) {
    // Auth middleware for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded = jwt.verify(token, jwtSecret);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;
        console.log(`[SOCKET] User connected: ${userId}`);

        // Join personal room
        socket.join(userId);

        // Set user online
        User.setOnline(userId, true);
        io.emit('userOnline', { userId, online: true });

        // Handle chat messages
        socket.on('sendMessage', (data, callback) => {
            const Message = require('../models/Message');
            const message = Message.create({
                sender_id: userId,
                receiver_id: data.receiver_id,
                content: data.content,
                message_type: data.message_type || 'text',
            });

            // Emit to receiver
            io.to(data.receiver_id).emit('newMessage', message);
            // Confirm to sender
            if (callback) callback(message);
        });

        // Typing indicator
        socket.on('typing', (data) => {
            io.to(data.receiver_id).emit('userTyping', {
                userId, typing: data.typing,
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`[SOCKET] User disconnected: ${userId}`);
            User.setOnline(userId, false);
            io.emit('userOnline', { userId, online: false });
        });
    });
}

module.exports = { setupSocket };
