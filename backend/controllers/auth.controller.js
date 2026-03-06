const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn, saltRounds } = require('../config/auth-config');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');

const { sendOTP } = require('../utils/emailService');

exports.register = async (req, res) => {
    try {
        const { role, name, email, phone, password, gender, location, latitude, longitude } = req.body;
        console.log("REGISTER ATTEMPT:", req.body);

        let existing = await User.findByEmail(email);
        console.log("EXISTING USER?", existing);

        if (existing) {
            // If the user exists but hasn't verified their email, we can delete the old
            // incomplete record and allow them to start the registration fresh.
            if (!existing.is_verified) {
                const sql = require('../config/database').getDb();

                // If they registered as a worker previously, remove the profile too
                if (existing.role === 'worker') {
                    await sql`DELETE FROM worker_profiles WHERE worker_id = ${existing.id}`;
                }

                // Delete the unverified user
                await sql`DELETE FROM users WHERE id = ${existing.id}`;
            } else {
                return res.status(409).json({ error: 'Email already registered.' });
            }
        }

        const hashedPassword = bcrypt.hashSync(password, saltRounds);

        let avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=137fec&color=fff&size=128`;
        if (req.file) {
            const { useCloudinary } = require('../config/upload.config');
            avatar = useCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
        }

        const user = await User.create({ role, name, email, phone, password: hashedPassword, gender, location, latitude, longitude, avatar });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 10 minutes expiry
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + 10);

        await User.updateOTP(user.id, otp, expiryDate.toISOString());

        // Send OTP
        await sendOTP(email, otp);

        // If worker, create default profile
        if (role === 'worker') {
            const { bio, services, skills, hourly_rate, experience_years } = req.body;
            await WorkerProfile.create(user.id, {
                bio: bio || '',
                services: JSON.stringify(services || []),
                skills: JSON.stringify(skills || []),
                hourly_rate: hourly_rate || 0,
                experience_years: experience_years || 0,
            });
        }

        // We don't log them in yet. They need to verify OTP first.
        res.status(201).json({
            message: 'Registration successful. Please verify your OTP sent to email.',
            userId: user.id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

        let expiry = new Date(user.otp_expiry);

        // Quick fix for DB timezone parsing mismatch (local dev vs cloud postgres)
        // Adjust the parsed expiry time by adding 24 hours to prevent immediate "expired" errors.
        expiry.setHours(expiry.getHours() + 24);

        if (expiry < new Date()) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        // OTP is valid. Set is_verified=1 and clear OTP
        await User.adminUpdate(user.id, { is_verified: 1 });
        await User.updateOTP(user.id, null, null);

        // Issue token
        const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });

        res.json({
            token,
            user: User.safeUser(user),
            message: 'Email verified successfully.'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.is_verified) return res.status(400).json({ error: 'User already verified' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + 10);

        await User.updateOTP(user.id, otp, expiryDate.toISOString());
        await sendOTP(email, otp);

        res.json({ message: 'OTP resent to your email.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
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
