module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'homepro_default_secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    saltRounds: 10,
};
