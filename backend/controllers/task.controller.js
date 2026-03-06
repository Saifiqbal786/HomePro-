const Task = require('../models/Task');
const WorkerProfile = require('../models/WorkerProfile');
const Payment = require('../models/Payment');
const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.createTask = (req, res) => {
    try {
        const { worker_id, service_type, description, location, scheduled_date, scheduled_time } = req.body;
        const profile = WorkerProfile.findByWorkerId(worker_id);
        if (!profile) return res.status(404).json({ error: 'Worker not found.' });

        const task = Task.create({
            homeowner_id: req.user.id, worker_id, service_type,
            description, location, scheduled_date, scheduled_time,
            hourly_rate: profile.hourly_rate,
        });

        // Create notification for worker
        getDb().prepare(`INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(uuidv4(), worker_id, 'new_task', 'New Job Request',
                `${req.user.name} wants to hire you for ${service_type}`,
                JSON.stringify({ task_id: task.id }));

        res.status(201).json({ task });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTasks = (req, res) => {
    try {
        const { status } = req.query;
        const tasks = Task.findByUser(req.user.id, req.user.role, status || null);
        res.json({ tasks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTask = (req, res) => {
    try {
        const task = Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found.' });
        if (task.homeowner_id !== req.user.id && task.worker_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        res.json({ task });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.acceptTask = (req, res) => {
    try {
        const task = Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found.' });
        if (task.worker_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
        if (task.status !== 'pending') return res.status(400).json({ error: 'Task cannot be accepted.' });

        const updated = Task.updateStatus(task.id, 'accepted');

        getDb().prepare(`INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(uuidv4(), task.homeowner_id, 'task_accepted', 'Job Accepted',
                `${req.user.name} has accepted your ${task.service_type} request`,
                JSON.stringify({ task_id: task.id }));

        res.json({ task: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.startTask = (req, res) => {
    try {
        const task = Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found.' });
        if (task.worker_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
        if (task.status !== 'accepted') return res.status(400).json({ error: 'Task must be accepted before starting.' });

        const updated = Task.updateStatus(task.id, 'in_progress');
        res.json({ task: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.completeTask = (req, res) => {
    try {
        const task = Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found.' });
        if (task.worker_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
        if (task.status !== 'in_progress') return res.status(400).json({ error: 'Task must be in progress.' });

        const updated = Task.updateStatus(task.id, 'completed');
        WorkerProfile.incrementJobs(req.user.id);

        // Create payment record
        Payment.create({
            task_id: updated.id,
            homeowner_id: updated.homeowner_id,
            worker_id: updated.worker_id,
            amount: updated.payment_amount,
        });

        getDb().prepare(`INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(uuidv4(), task.homeowner_id, 'task_completed', 'Job Completed',
                `${req.user.name} has completed your ${task.service_type} task. Payment: $${updated.payment_amount}`,
                JSON.stringify({ task_id: task.id }));

        res.json({ task: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
