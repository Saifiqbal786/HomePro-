function validate(rules) {
    return (req, res, next) => {
        const errors = [];
        for (const [field, checks] of Object.entries(rules)) {
            const value = req.body[field];
            for (const check of checks) {
                if (check === 'required' && (value === undefined || value === null || value === '')) {
                    errors.push(`${field} is required.`);
                }
                if (check === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errors.push(`${field} must be a valid email address.`);
                }
                if (check === 'min:6' && value && value.length < 6) {
                    errors.push(`${field} must be at least 6 characters.`);
                }
                if (check === 'role' && value && !['homeowner', 'worker'].includes(value)) {
                    errors.push(`${field} must be either "homeowner" or "worker".`);
                }
                if (check === 'rating' && value && (value < 1 || value > 5)) {
                    errors.push(`${field} must be between 1 and 5.`);
                }
            }
        }
        if (errors.length > 0) return res.status(400).json({ errors });
        next();
    };
}

module.exports = { validate };
