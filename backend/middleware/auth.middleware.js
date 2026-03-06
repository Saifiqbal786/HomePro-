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

        // ── Account status check (skip for admins) ───────────────
        if (user.role !== 'admin') {
            if (user.account_status === 'blocked') {
                return res.status(403).json({ error: 'Your account has been blocked by an administrator. Please contact support.' });
            }
            if (user.account_status === 'suspended') {
                const until = user.suspended_until ? new Date(user.suspended_until) : null;
                if (!until || until > new Date()) {
                    const untilStr = until ? ` until ${until.toLocaleDateString()}` : ' indefinitely';
                    return res.status(403).json({ error: `Your account has been suspended${untilStr}. Reason: ${user.suspension_reason || 'Violation of terms'}` });
                }
                // Suspension expired — auto-lift it
                await User.adminUpdate(user.id, {
                    account_status: 'active',
                    suspension_reason: null,
                    suspended_until: null
                });
            }
        }
        // ─────────────────────────────────────────────────────────

        req.user = User.safeUser(user);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.verifyToken = authMiddleware;

