const mongoose = require('mongoose');

/**
 * Book Schema
 * Represents textbooks listed for exchange/sale
 * Includes depreciation logic and meetup locations
 */
const bookSchema = new mongoose.Schema({
    // Seller information
    listedBy: {
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
        maxlength: 300,
        index: true
    },
    author: {
        type: String,
        trim: true,
        maxlength: 200
    },
    isbn: {
        type: String,
        trim: true,
        maxlength: 20
    },
    edition: {
        type: String,
        trim: true,
        maxlength: 50
    },
    publisher: {
        type: String,
        trim: true,
        maxlength: 200
    },

    // Academic categorization
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
        maxlength: 100,
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

    // Pricing
    mrp: {
        type: Number,
        required: true,
        min: 0
    },
    suggestedPrice: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: function (v) {
                // Suggested price should be 40-60% of MRP (50-60% depreciation)
                return v >= this.mrp * 0.4 && v <= this.mrp * 0.6;
            },
            message: 'Suggested price should be 40-60% of MRP'
        }
    },
    finalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    isNegotiable: {
        type: Boolean,
        default: true
    },

    // Condition
    condition: {
        type: String,
        required: true,
        enum: ['Like New', 'Good', 'Fair', 'Acceptable'],
        index: true
    },
    conditionNotes: {
        type: String,
        trim: true,
        maxlength: 500
    },

    // Images
    images: [{
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        }
    }],

    // Meetup preferences
    preferredMeetupLocations: [{
        type: String,
        trim: true,
        maxlength: 100
    }],

    // Status
    status: {
        type: String,
        enum: ['available', 'reserved', 'sold', 'removed'],
        default: 'available',
        index: true
    },

    // Engagement
    viewCount: {
        type: Number,
        default: 0
    },
    interestedCount: {
        type: Number,
        default: 0
    },

    // Campus restriction
    campus: {
        type: String,
        required: true,
        index: true
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
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },

    // Timestamps
    listedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    soldAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes for efficient filtering
bookSchema.index({ campus: 1, department: 1, semester: 1 });
bookSchema.index({ campus: 1, subject: 1, status: 1 });
bookSchema.index({ campus: 1, status: 1, listedAt: -1 });
bookSchema.index({ listedBy: 1, status: 1 });

// Pre-save hook to calculate suggested price if not provided
bookSchema.pre('save', function (next) {
    if (this.isNew && !this.suggestedPrice) {
        // Default to 50% depreciation (50% of MRP)
        this.suggestedPrice = Math.round(this.mrp * 0.5);
    }
    next();
});

// Method to mark as sold
bookSchema.methods.markAsSold = function () {
    this.status = 'sold';
    this.soldAt = new Date();
    return this.save();
};

// Method to increment view count
bookSchema.methods.incrementView = function () {
    this.viewCount += 1;
    return this.save();
};

// Static method to find available books
bookSchema.statics.findAvailable = function (campus, filters = {}) {
    const query = {
        campus,
        status: 'available',
        isHidden: false,
        moderationStatus: { $in: ['approved', 'pending'] }
    };

    if (filters.department) query.department = filters.department;
    if (filters.semester) query.semester = filters.semester;
    if (filters.subject) query.subject = filters.subject;

    return this.find(query)
        .sort({ listedAt: -1 })
        .populate('listedBy', 'name department semester reputationScore');
};

module.exports = mongoose.model('Book', bookSchema);
