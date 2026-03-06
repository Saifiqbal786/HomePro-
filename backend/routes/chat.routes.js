const router = require('express').Router();
const chat = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/conversations', authMiddleware, chat.getConversations);
router.get('/:userId', authMiddleware, chat.getMessages);
router.post('/', authMiddleware, chat.sendMessage);

module.exports = router;
