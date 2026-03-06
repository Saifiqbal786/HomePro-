const router = require('express').Router();
const homeowner = require('../controllers/homeowner.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.get('/dashboard', authMiddleware, roleMiddleware('homeowner'), homeowner.getDashboard);
router.post('/favorites', authMiddleware, roleMiddleware('homeowner'), homeowner.toggleFavorite);

module.exports = router;
