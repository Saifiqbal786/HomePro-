// Chat gateway is handled within socket.js for simplicity.
// This module can be extended for advanced chat features.

const Message = require('../models/Message');

class ChatGateway {
    constructor(io) {
        this.io = io;
    }

    sendToUser(userId, event, data) {
        this.io.to(userId).emit(event, data);
    }

    notifyNewMessage(receiverId, message) {
        this.sendToUser(receiverId, 'newMessage', message);
    }

    notifyTaskUpdate(userId, task) {
        this.sendToUser(userId, 'taskUpdate', task);
    }

    notifyNotification(userId, notification) {
        this.sendToUser(userId, 'notification', notification);
    }
}

module.exports = ChatGateway;
