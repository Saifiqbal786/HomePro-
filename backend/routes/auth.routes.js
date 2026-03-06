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
router.post('/verify-otp', validate({
    email: ['required', 'email'], otp: ['required']
}), auth.verifyOTP);

router.post('/resend-otp', validate({
    email: ['required', 'email']
}), auth.resendOTP);

router.put('/password', authMiddleware, validate({
    currentPassword: ['required'],
    newPassword: ['required', 'min:6']
}), auth.changePassword);

router.delete('/account', authMiddleware, auth.deleteAccount);

router.post('/forgot-password', validate({
    email: ['required', 'email']
}), auth.forgotPassword);

router.post('/reset-password', validate({
    email: ['required', 'email'],
    otp: ['required'],
    newPassword: ['required', 'min:6']
}), auth.resetPassword);

module.exports = router;
