const router = require('express').Router();
const admin = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Protect all admin routes
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/stats', admin.getDashboardStats);
router.get('/users', admin.getAllUsers);
router.patch('/users/:id/moderate', admin.moderateUser);
router.post('/workers/auto-suspend', admin.autoSuspendLowRatedWorkers);
router.get('/analytics', admin.getRevenueAnalytics);

module.exports = router;
