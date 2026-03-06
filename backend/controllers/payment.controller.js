const Payment = require('../models/Payment');
const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.confirmPayment = (req, res) => {
    try {
        const payment = Payment.findByTask(req.params.taskId);
        if (!payment) return res.status(404).json({ error: 'Payment not found.' });
        if (payment.homeowner_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });

        const confirmed = Payment.confirm(req.params.taskId);

        // Notify worker
        getDb().prepare(`INSERT INTO notifications (id, user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(uuidv4(), payment.worker_id, 'payment_confirmed', 'Payment Confirmed',
                `Payment of $${payment.amount} has been confirmed`,
                JSON.stringify({ payment_id: payment.id }));

        res.json({ payment: confirmed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPaymentHistory = (req, res) => {
    try {
        const payments = Payment.getHistory(req.user.id, req.user.role);
        res.json({ payments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
