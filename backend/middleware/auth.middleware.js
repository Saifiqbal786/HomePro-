const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth-config');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ error: 'Invalid token. User not found.' });
        req.user = User.safeUser(user);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.verifyToken = authMiddleware;
