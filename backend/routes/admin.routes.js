const router = require('express').Router();
const admin = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Protect all admin routes
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/stats', admin.getDashboardStats);
router.get('/users', admin.getAllUsers);
router.post('/add-user', admin.addUser);

module.exports = router;
