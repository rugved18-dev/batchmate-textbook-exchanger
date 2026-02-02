const mongoose = require('mongoose');

/**
 * BookRequest Schema
 * Allows students to request books they need (cold start problem solution)
 */
const bookRequestSchema = new mongoose.Schema({
    // Requester information
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Book details
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    author: {
        type: String,
        trim: true,
        maxlength: 200
    },
    subjectCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 20,
        index: true
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    department: {
        type: String,
        required: true,
        index: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
        index: true
    },

    // Budget
    maxBudget: {
        type: Number,
        required: true,
        min: 0
    },

    // Additional notes
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'fulfilled', 'cancelled'],
        default: 'active',
        index: true
    },

    // Response tracking
    responseCount: {
        type: Number,
        default: 0
    },

    // Campus
    campus: {
        type: String,
        required: true,
        index: true
    },

    // Timestamps
    requestedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    fulfilledAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes
bookRequestSchema.index({ campus: 1, status: 1, requestedAt: -1 });
bookRequestSchema.index({ campus: 1, department: 1, semester: 1 });

module.exports = mongoose.model('BookRequest', bookRequestSchema);
