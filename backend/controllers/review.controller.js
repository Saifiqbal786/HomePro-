const Review = require('../models/Review');
const WorkerProfile = require('../models/WorkerProfile');
const Task = require('../models/Task');
const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.createReview = async (req, res) => {
    try {
        const { worker_id, task_id, rating, comment } = req.body;

        // Verify task exists and belongs to this homeowner
        const task = await Task.findById(task_id);
        if (!task) return res.status(404).json({ error: 'Task not found.' });
        if (task.homeowner_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
        if (task.status !== 'completed') return res.status(400).json({ error: 'Can only review completed tasks.' });

        // Check for existing review
        const existing = await Review.existsForTask(task_id);
        if (existing) return res.status(409).json({ error: 'Review already submitted for this task.' });

        const review = await Review.create({ homeowner_id: req.user.id, worker_id, task_id, rating, comment });

        // Update worker rating
        await WorkerProfile.updateRating(worker_id);

        // Notify worker
        const sql = getDb();
        await sql`
            INSERT INTO notifications (id, user_id, type, title, message, data) 
            VALUES (${uuidv4()}, ${worker_id}, 'new_review', 'New Review',
                    ${req.user.name + ' left a ' + rating + '-star review'},
                    ${JSON.stringify({ review_id: review.id })})
        `;

        res.status(201).json({ review });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getWorkerReviews = async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const reviews = await Review.findByWorker(req.params.id, parseInt(limit) || 20, parseInt(offset) || 0);
        res.json({ reviews });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
