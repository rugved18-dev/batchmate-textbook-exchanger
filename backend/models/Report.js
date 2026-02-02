const mongoose = require('mongoose');

/**
 * Report Schema
 * Handles reporting of notes, books, and users
 * Supports auto-hiding and moderation workflow
 */
const reportSchema = new mongoose.Schema({
    // Reporter
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Target of report (polymorphic)
    targetType: {
        type: String,
        enum: ['Note', 'Book', 'User'],
        required: true,
        index: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'targetType',
        index: true
    },

    // Report details
    reason: {
        type: String,
        required: true,
        enum: [
            'spam',
            'inappropriate_content',
            'copyright_violation',
            'fake_upload',
            'harassment',
            'scam',
            'duplicate',
            'other'
        ],
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
        default: 'pending',
        index: true
    },

    // Moderation
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    moderatorNotes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    actionTaken: {
        type: String,
        enum: ['none', 'content_hidden', 'content_removed', 'user_warned', 'user_blocked'],
        default: 'none'
    },

    // Campus
    campus: {
        type: String,
        required: true,
        index: true
    },

    // Timestamp
    reportedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes
reportSchema.index({ targetType: 1, targetId: 1, status: 1 });
reportSchema.index({ campus: 1, status: 1, reportedAt: -1 });
reportSchema.index({ reportedBy: 1, reportedAt: -1 });

// Prevent duplicate reports from same user for same target
reportSchema.index({ reportedBy: 1, targetType: 1, targetId: 1 }, { unique: true });

// Static method to count reports for a target
reportSchema.statics.countReportsForTarget = async function (targetType, targetId) {
    return this.countDocuments({
        targetType,
        targetId,
        status: { $in: ['pending', 'reviewing'] }
    });
};

// Static method to check if auto-hide threshold is reached
reportSchema.statics.shouldAutoHide = async function (targetType, targetId, threshold = 3) {
    const count = await this.countReportsForTarget(targetType, targetId);
    return count >= threshold;
};

module.exports = mongoose.model('Report', reportSchema);
