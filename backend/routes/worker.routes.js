const router = require('express').Router();
const worker = require('../controllers/worker.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.get('/', worker.searchWorkers);
router.get('/:id', worker.getWorkerProfile);
router.put('/profile', authMiddleware, roleMiddleware('worker'), worker.updateProfile);
router.put('/availability', authMiddleware, roleMiddleware('worker'), worker.updateAvailability);

module.exports = router;
