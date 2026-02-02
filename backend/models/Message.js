const mongoose = require('mongoose');

/**
 * Message Schema
 * Individual messages within a chat
 * Supports predefined templates and rate limiting
 */
const messageSchema = new mongoose.Schema({
    // Chat reference
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
        index: true
    },

    // Sender
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Message content
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },

    // Template flag (if using predefined template)
    isTemplate: {
        type: Boolean,
        default: false
    },
    templateType: {
        type: String,
        enum: [
            'greeting',
            'interested',
            'price_inquiry',
            'meetup_request',
            'availability_check',
            'thank_you',
            'custom'
        ],
        default: 'custom'
    },

    // Read status
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        default: null
    },

    // Moderation
    isFlagged: {
        type: Boolean,
        default: false
    },

    // Timestamp
    sentAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes
messageSchema.index({ chat: 1, sentAt: -1 });
messageSchema.index({ sender: 1, sentAt: -1 });
messageSchema.index({ chat: 1, isRead: 1 });

// Predefined message templates
messageSchema.statics.TEMPLATES = {
    greeting: "Hi! I saw your listing and I'm interested.",
    interested: "Is this still available?",
    price_inquiry: "Is the price negotiable?",
    meetup_request: "When and where can we meet?",
    availability_check: "Are you available to meet this week?",
    thank_you: "Thank you! Looking forward to the exchange."
};

// Method to mark as read
messageSchema.methods.markAsRead = function () {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

// Static method to get unread count for a user in a chat
messageSchema.statics.getUnreadCount = function (chatId, userId) {
    return this.countDocuments({
        chat: chatId,
        sender: { $ne: userId },
        isRead: false
    });
};

module.exports = mongoose.model('Message', messageSchema);
