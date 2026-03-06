const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const workerRoutes = require('./routes/worker.routes');
const homeownerRoutes = require('./routes/homeowner.routes');
const taskRoutes = require('./routes/task.routes');
const chatRoutes = require('./routes/chat.routes');
const reviewRoutes = require('./routes/review.routes');
const paymentRoutes = require('./routes/payment.routes');
const uploadRoutes = require('./routes/upload.routes'); // NEW
const errorMiddleware = require('./middleware/error.middleware');
const authMiddleware = require('./middleware/auth.middleware');
const { getDb } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Serve local uploads if cloudinary is not used
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/homeowner', homeownerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes); // NEW

// Notifications API
app.get('/api/notifications', authMiddleware, (req, res) => {
    try {
        const notifications = getDb().prepare(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
        ).all(req.user.id);
        const unreadCount = getDb().prepare(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
        ).get(req.user.id);
        res.json({ notifications, unread_count: unreadCount.count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
    try {
        getDb().prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notifications/read-all', authMiddleware, (req, res) => {
    try {
        getDb().prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend pages — SPA-like routing
app.get('*', (req, res) => {
    // If the request is for a file, let express.static handle it
    if (req.path.includes('.')) return res.status(404).send('Not found');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

// Error handling
app.use(errorMiddleware);

module.exports = app;
