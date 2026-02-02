const mongoose = require('mongoose');

/**
 * User Schema
 * Represents a verified college student with reputation system
 * Only accessible via Google OAuth with college email domain
 */
const userSchema = new mongoose.Schema({
    // Authentication fields
    googleId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                // Must be a college email (e.g., .edu, .ac.in, etc.)
                return /^[^\s@]+@[^\s@]+\.(edu|ac\.in)$/.test(v);
            },
            message: 'Must be a valid college email address (ending with .edu or .ac.in)'
        },
        index: true
    },

    // Profile information
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    profilePicture: {
        type: String, // Google profile picture URL
        default: null
    },

    // Academic information
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

    // Campus verification
    campus: {
        type: String,
        required: true,
        trim: true,
        index: true // For same-campus filtering
    },

    // Reputation system
    reputationScore: {
        type: Number,
        default: 0,
        index: true
    },
    uploadCount: {
        type: Number,
        default: 0
    },
    exchangeCount: {
        type: Number,
        default: 0
    },

    // Role-based access control
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin'],
        default: 'user',
        index: true
    },

    // Moderation fields
    isBlocked: {
        type: Boolean,
        default: false,
        index: true
    },
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reportCount: {
        type: Number,
        default: 0
    },

    // Activity tracking
    lastActive: {
        type: Date,
        default: Date.now
    },

    // Account status
    isVerified: {
        type: Boolean,
        default: true // Auto-verified via Google OAuth
    },
    accountCreatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
userSchema.index({ campus: 1, department: 1, semester: 1 });
userSchema.index({ reputationScore: -1 });
userSchema.index({ isBlocked: 1, role: 1 });

// Virtual for user age (account age)
userSchema.virtual('accountAge').get(function () {
    return Math.floor((Date.now() - this.accountCreatedAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to check if user can moderate
userSchema.methods.canModerate = function () {
    return this.role === 'moderator' || this.role === 'admin' || this.reputationScore >= 100;
};

// Method to check if user is rate limited (new users)
userSchema.methods.isRateLimited = function () {
    const accountAgeDays = this.accountAge;
    return accountAgeDays < 7 || this.reputationScore < 10;
};

// Method to update reputation
userSchema.methods.updateReputation = function (points) {
    this.reputationScore += points;
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
