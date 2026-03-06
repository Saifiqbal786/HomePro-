const router = require('express').Router();
const review = require('../controllers/review.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

router.post('/', authMiddleware, roleMiddleware('homeowner'), review.createReview);
router.get('/worker/:id', review.getWorkerReviews);

module.exports = router;
