const Message = require('../models/Message');

exports.getConversations = (req, res) => {
    try {
        const conversations = Message.getConversations(req.user.id);
        res.json({ conversations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMessages = (req, res) => {
    try {
        const { limit, offset } = req.query;
        // Mark messages as read
        Message.markAsRead(req.params.userId, req.user.id);
        const messages = Message.getConversation(req.user.id, req.params.userId, parseInt(limit) || 50, parseInt(offset) || 0);
        res.json({ messages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.sendMessage = (req, res) => {
    try {
        const { receiver_id, content } = req.body;
        const message = Message.create({ sender_id: req.user.id, receiver_id, content });
        res.status(201).json({ message });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
