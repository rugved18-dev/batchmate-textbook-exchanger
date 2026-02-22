const { SellerReview, Book, Note, User } = require('../models');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { computeBadges } = require('../utils/badges');

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Recompute and return a user's badges by querying their activity stats.
 * Also updates the seller's avg rating on the User doc if avgRating field exists.
 */
const getUserBadges = async (userId) => {
    const [user, soldCount, upvotedNotesCount, reviews] = await Promise.all([
        User.findById(userId).select('reputationScore role').lean(),
        Book.countDocuments({ listedBy: userId, status: 'sold' }),
        Note.countDocuments({ uploadedBy: userId, voteScore: { $gte: 1 } }),
        SellerReview.find({ seller: userId }).select('rating').lean()
    ]);

    if (!user) return [];

    const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    const stats = {
        soldBooks: soldCount,
        reputationScore: user.reputationScore,
        upvotedNotes: upvotedNotesCount,
        role: user.role
    };

    return { badges: computeBadges(stats), stats, avgRating, reviewCount: reviews.length };
};

// ── 1. Get badges + stats for any user (public) ───────────────────────────────
const getBadges = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const result = await getUserBadges(userId);
    res.json({ success: true, ...result });
});

// ── 2. Submit a review for a seller ──────────────────────────────────────────
const submitReview = asyncHandler(async (req, res) => {
    const { bookId, rating, comment } = req.body;
    const reviewerId = req.user._id;

    // Validate input
    if (!bookId) throw new AppError('bookId is required', 400);
    if (!rating || rating < 1 || rating > 5) throw new AppError('Rating must be 1-5', 400);

    // Fetch the book
    const book = await Book.findById(bookId).populate('listedBy', '_id name');
    if (!book) throw new AppError('Book not found', 404);
    if (book.status !== 'sold') throw new AppError('You can only review after the book is sold', 400);

    const sellerId = book.listedBy._id;
    if (sellerId.toString() === reviewerId.toString()) {
        throw new AppError('You cannot review yourself', 400);
    }

    // Upsert — allows editing existing review
    const review = await SellerReview.findOneAndUpdate(
        { book: bookId, reviewer: reviewerId },
        { seller: sellerId, rating: Number(rating), comment: comment || '' },
        { new: true, upsert: true, runValidators: true }
    ).populate('reviewer', 'name profilePicture');

    res.status(201).json({ success: true, review });
});

// ── 3. Get all reviews for a seller ──────────────────────────────────────────
const getSellerReviews = asyncHandler(async (req, res) => {
    const { sellerId } = req.params;

    const reviews = await SellerReview.find({ seller: sellerId })
        .populate('reviewer', 'name profilePicture department')
        .populate('book', 'title')
        .sort({ createdAt: -1 })
        .lean();

    const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    res.json({ success: true, reviews, avgRating, count: reviews.length });
});

// ── 4. Check if current user can review a book ────────────────────────────────
const canReview = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const reviewerId = req.user._id;

    const book = await Book.findById(bookId).select('status listedBy').lean();
    if (!book) throw new AppError('Book not found', 404);

    const alreadyReviewed = await SellerReview.exists({ book: bookId, reviewer: reviewerId });
    const isOwner = book.listedBy.toString() === reviewerId.toString();

    res.json({
        success: true,
        canReview: book.status === 'sold' && !isOwner && !alreadyReviewed,
        alreadyReviewed: !!alreadyReviewed,
        bookSold: book.status === 'sold'
    });
});

module.exports = { getBadges, submitReview, getSellerReviews, canReview, getUserBadges };
