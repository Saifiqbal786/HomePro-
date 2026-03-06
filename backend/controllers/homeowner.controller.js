const Task = require('../models/Task');
const User = require('../models/User');
const { getDb } = require('../config/database');

exports.getDashboard = async (req, res) => {
    try {
        const tasks = await Task.findByUser(req.user.id, 'homeowner');
        const activeTasks = tasks.filter(t => ['pending', 'accepted', 'in_progress'].includes(t.status));
        const completedTasks = tasks.filter(t => t.status === 'completed');

        // Get favorites
        const sql = getDb();
        const favorites = await sql`
            SELECT f.*, u.name, u.avatar, wp.services, wp.hourly_rate, wp.rating
            FROM favorites f
            JOIN users u ON u.id = f.worker_id
            JOIN worker_profiles wp ON wp.worker_id = f.worker_id
            WHERE f.homeowner_id = ${req.user.id}
        `;

        res.json({
            active_tasks: activeTasks.length,
            completed_tasks: completedTasks.length,
            total_spent: completedTasks.reduce((sum, t) => sum + (parseFloat(t.payment_amount) || 0), 0),
            tasks: activeTasks,
            favorites,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleFavorite = async (req, res) => {
    try {
        const { worker_id } = req.body;
        const sql = getDb();
        const existing = await sql`
            SELECT id FROM favorites WHERE homeowner_id = ${req.user.id} AND worker_id = ${worker_id}
        `;

        if (existing.length > 0) {
            await sql`DELETE FROM favorites WHERE id = ${existing[0].id}`;
            res.json({ favorited: false });
        } else {
            const { v4: uuidv4 } = require('uuid');
            await sql`
                INSERT INTO favorites (id, homeowner_id, worker_id) 
                VALUES (${uuidv4()}, ${req.user.id}, ${worker_id})
            `;
            res.json({ favorited: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.update(req.user.id, {
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
