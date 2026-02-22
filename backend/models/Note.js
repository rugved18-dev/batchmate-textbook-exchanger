const mongoose = require('mongoose');

/**
 * Note Schema
 * Represents handwritten notes uploaded by students
 * Primary engagement driver for the platform
 */
const noteSchema = new mongoose.Schema({
    // Uploader information
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Academic categorization
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: true
    },
    subjectCode: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 20,
        index: true
    },
    department: {
        type: String,
        required: true,
        enum: [
            'Computer Science',
            'Electrical Engineering',
            'Mechanical Engineering',
            'Civil Engineering',
            'Electronics',
            'Information Technology',
            'Chemical Engineering',
            'Biotechnology',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Business Administration',
            'Economics',
            'Other'
        ],
        index: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
        index: true
    },

    // File information
    fileUrl: {
        type: String,
        required: true // Cloudinary URL
    },
    filePublicId: {
        type: String,
        required: true // Cloudinary public ID for deletion
    },
    thumbnailUrl: {
        type: String,
        required: true // Auto-generated preview
    },
    pageCount: {
        type: Number,
        required: true,
        min: 2, // Reject files under 2 pages
        validate: {
            validator: function (v) {
                return v >= 2;
            },
            message: 'Notes must have at least 2 pages'
        }
    },
    fileSize: {
        type: Number, // in bytes
        required: true
    },

    // Verification
    isHandwritten: {
        type: Boolean,
        required: true,
        default: true
    },
    confirmedHandwritten: {
        type: Boolean,
        required: true,
        validate: {
            validator: function (v) {
                return v === true;
            },
            message: 'You must confirm this is handwritten content'
        }
    },

    // Engagement metrics
    voteScore: {
        type: Number,
        default: 0,
        index: true
    },
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    downloadCount: {
        type: Number,
        default: 0,
        index: true
    },
    viewCount: {
        type: Number,
        default: 0
    },

    // Reward tracking (delayed rewards)
    rewardGiven: {
        type: Boolean,
        default: false
    },
    rewardEligible: {
        type: Boolean,
        default: false
    },

    // Moderation
    isHidden: {
        type: Boolean,
        default: false,
        index: true
    },
    reportCount: {
        type: Number,
        default: 0
    },
    moderationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged'],
        default: 'pending',
        index: true
    },
    moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    moderationNotes: {
        type: String,
        maxlength: 500
    },

    // Campus restriction
    campus: {
        type: String,
        required: true,
        index: true
    },

    // AI Summary (Gemini-generated, cached to avoid repeated API calls)
    aiSummary: {
        type: String,
        default: null
    },
    aiSummaryGeneratedAt: {
        type: Date,
        default: null
    },

    // Timestamps
    uploadedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient filtering
noteSchema.index({ campus: 1, department: 1, semester: 1 });
noteSchema.index({ campus: 1, subject: 1 });
noteSchema.index({ voteScore: -1, uploadedAt: -1 });
noteSchema.index({ isHidden: 1, moderationStatus: 1 });
noteSchema.index({ uploadedBy: 1, uploadedAt: -1 });

// Full-text search index — powers $text queries across key fields
// Weights: title is most important, then subject/code, then description
noteSchema.index(
    { title: 'text', subject: 'text', subjectCode: 'text', description: 'text' },
    { weights: { title: 10, subject: 8, subjectCode: 6, description: 3 }, name: 'notes_text_search' }
);

// Auto-hide notes with score <= -5
noteSchema.pre('save', function (next) {
    if (this.voteScore <= -5) {
        this.isHidden = true;
    }
    next();
});

// Check reward eligibility (after 3 upvotes or 1 download)
noteSchema.methods.checkRewardEligibility = function () {
    if (!this.rewardGiven && (this.upvotes >= 3 || this.downloadCount >= 1)) {
        this.rewardEligible = true;
    }
    return this.rewardEligible;
};

// Method to update vote score
noteSchema.methods.updateVoteScore = function () {
    this.voteScore = this.upvotes - this.downvotes;
    return this.save();
};

// Method to increment download count
noteSchema.methods.incrementDownload = async function () {
    this.downloadCount += 1;
    await this.checkRewardEligibility();
    return this.save();
};

// Static method to find popular notes
noteSchema.statics.findPopular = function (campus, limit = 10) {
    return this.find({
        campus,
        isHidden: false,
        moderationStatus: { $in: ['approved', 'pending'] }
    })
        .sort({ voteScore: -1, downloadCount: -1 })
        .limit(limit)
        .populate('uploadedBy', 'name department semester reputationScore');
};

module.exports = mongoose.model('Note', noteSchema);
