const mongoose = require('mongoose');

/**
 * SellerReview Schema
 * A buyer leaves a review for a seller after a book is marked "sold"
 * One review per book transaction — enforced with a unique index on (book, reviewer)
 */
const sellerReviewSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
        index: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    }
}, {
    timestamps: true
});

// One review per book per reviewer
sellerReviewSchema.index({ book: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('SellerReview', sellerReviewSchema);
