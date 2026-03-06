const User = require('../models/User');
const Task = require('../models/Task');
const Payment = require('../models/Payment');
const { getDb } = require('../config/database');

// ── Moderation ────────────────────────────────────────────────────────────────

exports.moderateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason, suspended_until } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const sql = getDb();

        switch (action) {
            case 'verify':
                await User.adminUpdate(id, { is_verified: 1 });
                if (user.role === 'worker') {
                    await sql`UPDATE worker_profiles SET is_verified = 1 WHERE worker_id = ${id}`;
                }
                return res.json({ message: 'User verified successfully', action });

            case 'unverify':
                await User.adminUpdate(id, { is_verified: 0 });
                if (user.role === 'worker') {
                    await sql`UPDATE worker_profiles SET is_verified = 0 WHERE worker_id = ${id}`;
                }
                return res.json({ message: 'Verification removed', action });

            case 'block':
                await User.adminUpdate(id, {
                    account_status: 'blocked',
                    suspension_reason: reason || 'Violated platform terms',
                    suspended_until: null
                });
                return res.json({ message: 'User blocked', action });

            case 'suspend':
                await User.adminUpdate(id, {
                    account_status: 'suspended',
                    suspension_reason: reason || 'Temporary suspension',
                    suspended_until: suspended_until || null
                });
                return res.json({ message: 'User suspended', action });

            case 'activate':
                await User.adminUpdate(id, {
                    account_status: 'active',
                    suspension_reason: null,
                    suspended_until: null
                });
                return res.json({ message: 'Account restored', action });

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.autoSuspendLowRatedWorkers = async (req, res) => {
    try {
        const { threshold = 2.5, min_reviews = 3 } = req.body;
        const sql = getDb();

        // Find workers below threshold with enough reviews
        const workers = await sql`
            SELECT u.id, u.name, u.email, wp.rating, wp.total_reviews
            FROM users u
            JOIN worker_profiles wp ON wp.worker_id = u.id
            WHERE u.role = 'worker'
              AND u.account_status = 'active'
              AND wp.total_reviews >= ${min_reviews}
              AND wp.rating < ${threshold}
        `;

        for (const w of workers) {
            await User.adminUpdate(w.id, {
                account_status: 'suspended',
                suspension_reason: `Auto-suspended: rating ${parseFloat(w.rating).toFixed(1)}/5 (below ${threshold}) based on ${w.total_reviews} reviews`,
                suspended_until: null
            });
        }

        res.json({
            message: `Auto-suspended ${workers.length} worker(s) with rating below ${threshold}`,
            suspended: workers.map(w => ({ name: w.name, email: w.email, rating: w.rating }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ── Dashboard Stats ───────────────────────────────────────────────────────────

exports.getDashboardStats = async (req, res) => {
    try {

        // Total Users
        const usersCountRes = await sql`SELECT COUNT(*) as count FROM users WHERE role != 'admin'`;
        const totalUsers = parseInt(usersCountRes[0].count, 10);

        // Total Workers
        const workersCountRes = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'worker'`;
        const totalWorkers = parseInt(workersCountRes[0].count, 10);

        // Total Tasks
        const tasksCountRes = await sql`SELECT COUNT(*) as count FROM tasks`;
        const totalTasks = parseInt(tasksCountRes[0].count, 10);

        // Total Revenue
        const revenueRes = await sql`SELECT SUM(amount) as total FROM payments WHERE status = 'confirmed'`;
        const totalRevenue = parseFloat(revenueRes[0].total) || 0;

        // Recent Tasks
        const recentTasks = await sql`
            SELECT t.*, ho.name as homeowner_name, w.name as worker_name 
            FROM tasks t
            JOIN users ho ON ho.id = t.homeowner_id
            JOIN users w ON w.id = t.worker_id
            ORDER BY t.created_at DESC
            LIMIT 5
        `;

        res.json({
            stats: {
                totalUsers,
                totalWorkers,
                totalTasks,
                totalRevenue
            },
            recentTasks
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { role, limit = 50, offset = 0 } = req.query;
        const sql = getDb();

        let users;
        let totalRes;

        if (role) {
            users = await sql`
                SELECT id, name, email, role, phone, location, created_at, is_online 
                FROM users 
                WHERE role = ${role}
                ORDER BY created_at DESC 
                LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
            `;
            totalRes = await sql`SELECT COUNT(*) as count FROM users WHERE role = ${role}`;
        } else {
            users = await sql`
                SELECT id, name, email, role, phone, location, created_at, is_online 
                FROM users 
                WHERE role != 'admin'
                ORDER BY created_at DESC 
                LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
            `;
            totalRes = await sql`SELECT COUNT(*) as count FROM users WHERE role != 'admin'`;
        }

        res.json({
            users,
            total: parseInt(totalRes[0].count, 10)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const bcrypt = require('bcryptjs');
const { saltRounds } = require('../config/auth-config');
const WorkerProfile = require('../models/WorkerProfile');

exports.addUser = async (req, res) => {
    try {
        const { role, name, email, phone, password } = req.body;
        if (!role || !name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existing = await User.findByEmail(email);
        if (existing) return res.status(409).json({ error: 'Email already registered.' });

        const hashedPassword = bcrypt.hashSync(password, saltRounds);
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=137fec&color=fff&size=128`;

        const user = await User.create({
            role, name, email, phone, password: hashedPassword, avatar
        });

        // Initialize blank profile for workers
        if (role === 'worker') {
            await WorkerProfile.create(user.id, {
                bio: '',
                services: '[]',
                skills: '[]',
                hourly_rate: 0,
                experience_years: 0,
            });
        }

        res.status(201).json({
            message: 'User created successfully',
            user: User.safeUser(user)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Revenue Analytics — GET /api/admin/analytics
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const sql = getDb();

        // Daily revenue — last 30 days
        const daily = await sql`
            SELECT
                TO_CHAR(confirmed_at, 'YYYY-MM-DD') as date,
                SUM(amount) as revenue,
                COUNT(*) as transactions
            FROM payments
            WHERE status = 'confirmed'
              AND confirmed_at >= NOW() - INTERVAL '30 days'
            GROUP BY TO_CHAR(confirmed_at, 'YYYY-MM-DD')
            ORDER BY date ASC
        `;

        // Monthly revenue — last 12 months
        const monthly = await sql`
            SELECT
                TO_CHAR(confirmed_at, 'YYYY-MM') as month,
                SUM(amount) as revenue,
                COUNT(*) as transactions
            FROM payments
            WHERE status = 'confirmed'
              AND confirmed_at >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(confirmed_at, 'YYYY-MM')
            ORDER BY month ASC
        `;

        // Top earning workers — top 5
        const topWorkers = await sql`
            SELECT u.name, SUM(p.amount) as total_earned, COUNT(p.id) as jobs
            FROM payments p
            JOIN users u ON u.id = p.worker_id
            WHERE p.status = 'confirmed'
            GROUP BY u.name
            ORDER BY total_earned DESC
            LIMIT 5
        `;

        // Task status breakdown
        const taskStatus = await sql`
            SELECT status, COUNT(*) as count FROM tasks GROUP BY status
        `;

        // Platform totals
        const totals = await sql`
            SELECT
                COUNT(*) as total_transactions,
                SUM(amount) as total_revenue,
                AVG(amount) as avg_transaction
            FROM payments WHERE status = 'confirmed'
        `;

        res.json({ daily, monthly, topWorkers, taskStatus, totals: totals[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

