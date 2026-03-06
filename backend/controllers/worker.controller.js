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

// ── PORTFOLIO ─────────────────────────────────────────────────────────────────

// POST /api/workers/portfolio  — upload image and append URL to portfolio array
exports.addPortfolioImage = async (req, res) => {
    try {
        const { useCloudinary } = require('../config/upload.config');

        if (!req.file) return res.status(400).json({ error: 'No image file provided.' });

        const imageUrl = useCloudinary
            ? req.file.path
            : `/uploads/${req.file.filename}`;

        const currentProfile = await WorkerProfile.findByWorkerId(req.user.id);
        if (!currentProfile) return res.status(404).json({ error: 'Worker profile not found.' });

        let portfolio = [];
        try { portfolio = JSON.parse(currentProfile.portfolio || '[]'); } catch (_) { portfolio = []; }

        if (portfolio.length >= 12) {
            return res.status(400).json({ error: 'Portfolio limit reached. Maximum 12 photos allowed.' });
        }

        portfolio.push({ url: imageUrl, caption: req.body.caption || '', uploaded_at: new Date().toISOString() });

        await WorkerProfile.update(req.user.id, { portfolio: JSON.stringify(portfolio) });

        res.json({ message: 'Photo added to portfolio.', url: imageUrl, portfolio });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/workers/portfolio  — remove a photo from portfolio array by URL
exports.deletePortfolioImage = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'Image URL is required.' });

        const currentProfile = await WorkerProfile.findByWorkerId(req.user.id);
        if (!currentProfile) return res.status(404).json({ error: 'Worker profile not found.' });

        let portfolio = [];
        try { portfolio = JSON.parse(currentProfile.portfolio || '[]'); } catch (_) { portfolio = []; }

        const updatedPortfolio = portfolio.filter(p => p.url !== url);

        await WorkerProfile.update(req.user.id, { portfolio: JSON.stringify(updatedPortfolio) });

        res.json({ message: 'Photo removed from portfolio.', portfolio: updatedPortfolio });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

