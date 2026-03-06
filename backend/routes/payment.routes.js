const router = require('express').Router();
const payment = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.put('/:taskId/confirm', authMiddleware, payment.confirmPayment);
router.get('/history', authMiddleware, payment.getPaymentHistory);

module.exports = router;
