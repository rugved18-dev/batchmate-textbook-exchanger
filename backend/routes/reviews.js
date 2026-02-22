const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { getBadges, submitReview, getSellerReviews, canReview } = require('../controllers/reviewController');

// Public — get any user's badges + stats
router.get('/badges/:userId', optionalAuth, getBadges);

// Public — get all reviews for a seller
router.get('/seller/:sellerId', getSellerReviews);

// Private — can current user review this book?
router.get('/can-review/:bookId', authenticate, canReview);

// Private — submit / update a review
router.post('/', authenticate, submitReview);

module.exports = router;
