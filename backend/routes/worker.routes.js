const router = require('express').Router();
const worker = require('../controllers/worker.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { upload } = require('../config/upload.config');

router.get('/', worker.searchWorkers);
router.get('/:id', worker.getWorkerProfile);
router.put('/profile', authMiddleware, roleMiddleware('worker'), worker.updateProfile);
router.put('/availability', authMiddleware, roleMiddleware('worker'), worker.updateAvailability);

// Portfolio routes
router.post('/portfolio', authMiddleware, roleMiddleware('worker'), upload.single('image'), worker.addPortfolioImage);
router.delete('/portfolio', authMiddleware, roleMiddleware('worker'), worker.deletePortfolioImage);

module.exports = router;
