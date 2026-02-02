const mongoose = require('mongoose');

/**
 * Vote Schema
 * Tracks upvotes/downvotes on notes
 * Prevents duplicate voting and enables vote tracking
 */
const voteSchema = new mongoose.Schema({
    // Voter
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Target note
    note: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
        required: true,
        index: true
    },

    // Vote type
    voteType: {
        type: String,
        enum: ['upvote', 'downvote'],
        required: true
    },

    // Timestamp
    votedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate votes
voteSchema.index({ user: 1, note: 1 }, { unique: true });

// Index for querying user's votes
voteSchema.index({ user: 1, votedAt: -1 });

// Index for querying note's votes
voteSchema.index({ note: 1, voteType: 1 });

module.exports = mongoose.model('Vote', voteSchema);
