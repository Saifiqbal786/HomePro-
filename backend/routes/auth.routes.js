const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { upload } = require('../config/upload.config');

router.post('/register', upload.single('avatarFile'), validate({
    name: ['required'], email: ['required', 'email'],
    password: ['required', 'min:6'], role: ['required', 'role'],
}), auth.register);

router.post('/login', validate({
    email: ['required', 'email'], password: ['required'],
}), auth.login);

router.get('/me', authMiddleware, auth.getMe);

module.exports = router;
