const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn, saltRounds } = require('../config/auth-config');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');

exports.register = (req, res) => {
    try {
        const { role, name, email, phone, password, gender, location, latitude, longitude } = req.body;

        const existing = User.findByEmail(email);
        if (existing) return res.status(409).json({ error: 'Email already registered.' });

        const hashedPassword = bcrypt.hashSync(password, saltRounds);
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=137fec&color=fff&size=128`;

        const user = User.create({ role, name, email, phone, password: hashedPassword, gender, location, latitude, longitude, avatar });

        // If worker, create default profile
        if (role === 'worker') {
            const { bio, services, skills, hourly_rate, experience_years } = req.body;
            WorkerProfile.create(user.id, {
                bio: bio || '',
                services: JSON.stringify(services || []),
                skills: JSON.stringify(skills || []),
                hourly_rate: hourly_rate || 0,
                experience_years: experience_years || 0,
            });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

        res.status(201).json({
            token,
            user: User.safeUser(user),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = (req, res) => {
    try {
        const { email, password } = req.body;

        const user = User.findByEmail(email);
        if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

        const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

        res.json({
            token,
            user: User.safeUser(user),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMe = (req, res) => {
    res.json({ user: req.user });
};
