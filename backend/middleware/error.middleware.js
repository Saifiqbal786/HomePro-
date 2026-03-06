function errorMiddleware(err, req, res, next) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);
    console.error(err.stack);

    if (err.name === 'SqliteError') {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'A record with this information already exists.' });
        }
        return res.status(500).json({ error: 'Database error occurred.' });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal server error.',
    });
}

module.exports = errorMiddleware;
