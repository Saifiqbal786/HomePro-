const WorkerProfile = require('../models/WorkerProfile');
const Review = require('../models/Review');
const User = require('../models/User');

exports.searchWorkers = async (req, res) => {
    try {
        const { category, minRate, maxRate, minRating, gender, sortBy, page, query } = req.query;
        const result = await WorkerProfile.search({
            category, query: query || null,
            minRate: minRate ? parseFloat(minRate) : null,
            maxRate: maxRate ? parseFloat(maxRate) : null,
            minRating: minRating ? parseFloat(minRating) : null,
            gender: gender || null, sortBy, page: page ? parseInt(page) : 1,
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getWorkerProfile = async (req, res) => {
    try {
        const profile = await WorkerProfile.findByWorkerId(req.params.id);
        if (!profile) return res.status(404).json({ error: 'Worker not found.' });
        const reviews = await Review.findByWorker(req.params.id, 10);
        res.json({ profile, reviews });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        // Update base user info (name, avatar, phone, location)
        await User.update(req.user.id, {
            name: req.body.name,
            avatar: req.body.avatar,
            phone: req.body.phone,
            location: req.body.location
        });

        // Update worker specific info
        const profile = await WorkerProfile.update(req.user.id, req.body);
        res.json({ profile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAvailability = async (req, res) => {
    try {
        const { blocked_dates } = req.body;
        if (!Array.isArray(blocked_dates)) {
            return res.status(400).json({ error: 'blocked_dates must be an array of date strings' });
        }

        // Fetch current profile to merge availability
        const currentProfile = await WorkerProfile.findByWorkerId(req.user.id);
        if (!currentProfile) return res.status(404).json({ error: 'Worker profile not found.' });

        const currentAvailability = JSON.parse(currentProfile.availability || '{}');
        currentAvailability.blocked_dates = blocked_dates;

        const profile = await WorkerProfile.update(req.user.id, {
            availability: currentAvailability
        });

        res.json({ profile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
