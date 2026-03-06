const Message = require('../models/Message');

exports.getConversations = async (req, res) => {
    try {
        const conversations = await Message.getConversations(req.user.id);
        res.json({ conversations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { limit, offset } = req.query;
        // Mark messages as read
        await Message.markAsRead(req.params.userId, req.user.id);
        const messages = await Message.getConversation(req.user.id, req.params.userId, parseInt(limit) || 50, parseInt(offset) || 0);
        res.json({ messages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { receiver_id, content } = req.body;
        const message = await Message.create({ sender_id: req.user.id, receiver_id, content });
        res.status(201).json({ message });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
