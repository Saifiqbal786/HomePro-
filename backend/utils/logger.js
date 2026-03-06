function log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
        case 'error':
            console.error(prefix, message, ...args);
            break;
        case 'warn':
            console.warn(prefix, message, ...args);
            break;
        case 'info':
            console.log(prefix, message, ...args);
            break;
        case 'debug':
            if (process.env.NODE_ENV === 'development') {
                console.log(prefix, message, ...args);
            }
            break;
        default:
            console.log(prefix, message, ...args);
    }
}

module.exports = {
    info: (msg, ...args) => log('info', msg, ...args),
    warn: (msg, ...args) => log('warn', msg, ...args),
    error: (msg, ...args) => log('error', msg, ...args),
    debug: (msg, ...args) => log('debug', msg, ...args),
};
