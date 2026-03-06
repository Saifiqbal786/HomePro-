const Task = require('../models/Task');
const User = require('../models/User');
const { getDb } = require('../config/database');

exports.getDashboard = (req, res) => {
    try {
        const tasks = Task.findByUser(req.user.id, 'homeowner');
        const activeTasks = tasks.filter(t => ['pending', 'accepted', 'in_progress'].includes(t.status));
        const completedTasks = tasks.filter(t => t.status === 'completed');

        // Get favorites
        const favorites = getDb().prepare(`
      SELECT f.*, u.name, u.avatar, wp.services, wp.hourly_rate, wp.rating
      FROM favorites f
      JOIN users u ON u.id = f.worker_id
      JOIN worker_profiles wp ON wp.worker_id = f.worker_id
      WHERE f.homeowner_id = ?
    `).all(req.user.id);

        res.json({
            active_tasks: activeTasks.length,
            completed_tasks: completedTasks.length,
            total_spent: completedTasks.reduce((sum, t) => sum + (t.payment_amount || 0), 0),
            tasks: activeTasks,
            favorites,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleFavorite = (req, res) => {
    try {
        const { worker_id } = req.body;
        const db = getDb();
        const existing = db.prepare('SELECT id FROM favorites WHERE homeowner_id = ? AND worker_id = ?').get(req.user.id, worker_id);
        if (existing) {
            db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);
            res.json({ favorited: false });
        } else {
            const { v4: uuidv4 } = require('uuid');
            db.prepare('INSERT INTO favorites (id, homeowner_id, worker_id) VALUES (?, ?, ?)').run(uuidv4(), req.user.id, worker_id);
            res.json({ favorited: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = (req, res) => {
    try {
        const user = User.update(req.user.id, {
            name: req.body.name,
            phone: req.body.phone,
            location: req.body.location,
            avatar: req.body.avatar
        });
        res.json({ user: User.safeUser(user) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
