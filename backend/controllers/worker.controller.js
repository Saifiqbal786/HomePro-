const WorkerProfile = require('../models/WorkerProfile');
const Review = require('../models/Review');

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
        const profile = WorkerProfile.update(req.user.id, req.body);
        res.json({ profile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
