const WorkerProfile = require('../models/WorkerProfile');
const Review = require('../models/Review');
const User = require('../models/User');

exports.searchWorkers = (req, res) => {
    try {
        const { category, minRate, maxRate, minRating, gender, sortBy, page } = req.query;
        const result = WorkerProfile.search({
            category, minRate: minRate ? parseFloat(minRate) : null,
            maxRate: maxRate ? parseFloat(maxRate) : null,
            minRating: minRating ? parseFloat(minRating) : null,
            gender: gender || null, sortBy, page: page ? parseInt(page) : 1,
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getWorkerProfile = (req, res) => {
    try {
        const profile = WorkerProfile.findByWorkerId(req.params.id);
        if (!profile) return res.status(404).json({ error: 'Worker not found.' });
        const reviews = Review.findByWorker(req.params.id, 10);
        res.json({ profile, reviews });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = (req, res) => {
    try {
        // Update base user info (name, avatar)
        User.update(req.user.id, {
            name: req.body.name,
            avatar: req.body.avatar,
            phone: req.body.phone,
            location: req.body.location
        });

        // Update worker specific info
        const profile = WorkerProfile.update(req.user.id, req.body);
        res.json({ profile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.updateAvailability = (req, res) => {
    try {
        const { blocked_dates } = req.body;
        if (!Array.isArray(blocked_dates)) {
            return res.status(400).json({ error: 'blocked_dates must be an array of date strings' });
        }

        // Fetch current profile to merge availability
        const currentProfile = WorkerProfile.findByWorkerId(req.user.id);
        if (!currentProfile) return res.status(404).json({ error: 'Worker profile not found.' });

        const currentAvailability = JSON.parse(currentProfile.availability || '{}');
        currentAvailability.blocked_dates = blocked_dates;

        const profile = WorkerProfile.update(req.user.id, {
            availability: currentAvailability
        });

        res.json({ profile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
