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

    io.on('connection', async (socket) => {
        const userId = socket.user.id;
        console.log(`[SOCKET] User connected: ${userId}`);

        // Join personal room
        socket.join(userId);

        // Set user online
        await User.setOnline(userId, true);
        io.emit('userOnline', { userId, online: true });

        // Handle chat messages
        socket.on('sendMessage', async (data, callback) => {
            const Message = require('../models/Message');
            try {
                const message = await Message.create({
                    sender_id: userId,
                    receiver_id: data.receiver_id,
                    content: data.content,
                    message_type: data.message_type || 'text',
                });

                // Emit to receiver
                io.to(data.receiver_id).emit('newMessage', message);
                // Confirm to sender
                if (callback) callback(message);
            } catch (err) {
                console.error('Socket sendMessage error:', err);
                if (callback) callback({ error: err.message });
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            io.to(data.receiver_id).emit('userTyping', {
                userId, typing: data.typing,
            });
        });

        // Disconnect
        socket.on('disconnect', async () => {
            console.log(`[SOCKET] User disconnected: ${userId}`);
            await User.setOnline(userId, false);
            io.emit('userOnline', { userId, online: false });
        });
    });
}

module.exports = { setupSocket };
