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
const adminRoutes = require('./routes/admin.routes'); // NEW ADMIN 
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
app.use('/api/admin', adminRoutes); // NEW ADMIN

// Location API — get a worker's last known position
app.get('/api/location/:workerId', authMiddleware, async (req, res) => {
    try {
        const sql = getDb();
        const rows = await sql`
            SELECT id, name, latitude, longitude, is_online, updated_at
            FROM users WHERE id = ${req.params.workerId} AND role = 'worker'
        `;
        if (!rows.length) return res.status(404).json({ error: 'Worker not found' });
        const w = rows[0];
        if (!w.latitude || !w.longitude) return res.status(404).json({ error: 'Location unavailable' });
        res.json({ workerId: w.id, name: w.name, latitude: w.latitude, longitude: w.longitude, is_online: w.is_online });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Notifications API
app.get('/api/notifications', authMiddleware, async (req, res) => {
    try {
        const sql = getDb();
        const notifications = await sql`
            SELECT * FROM notifications 
            WHERE user_id = ${req.user.id} 
            ORDER BY created_at DESC LIMIT 50
        `;
        const unreadResult = await sql`
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE user_id = ${req.user.id} AND is_read = 0
        `;

        let unreadCount = 0;
        if (unreadResult.length > 0) {
            unreadCount = parseInt(unreadResult[0].count, 10);
        }
        res.json({ notifications, unread_count: unreadCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const sql = getDb();
        await sql`
            UPDATE notifications 
            SET is_read = 1 
            WHERE id = ${req.params.id} AND user_id = ${req.user.id}
        `;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
    try {
        const sql = getDb();
        await sql`
            UPDATE notifications 
            SET is_read = 1 
            WHERE user_id = ${req.user.id}
        `;
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
