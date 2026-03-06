function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[\d\s\-\+\(\)]{7,15}$/.test(phone);
}

function isValidPassword(password) {
    return typeof password === 'string' && password.length >= 6;
}

function isValidRating(rating) {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/<[^>]*>/g, '');
}

module.exports = { isValidEmail, isValidPhone, isValidPassword, isValidRating, sanitizeString };
