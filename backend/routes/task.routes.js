const router = require('express').Router();
const task = require('../controllers/task.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.post('/', authMiddleware, roleMiddleware('homeowner'), task.createTask);
router.get('/', authMiddleware, task.getTasks);
router.get('/:id', authMiddleware, task.getTask);
router.put('/:id/accept', authMiddleware, roleMiddleware('worker'), task.acceptTask);
router.put('/:id/start', authMiddleware, roleMiddleware('worker'), task.startTask);
router.put('/:id/complete', authMiddleware, roleMiddleware('worker'), task.completeTask);

module.exports = router;
