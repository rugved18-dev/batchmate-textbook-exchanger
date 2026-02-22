const mongoose = require('mongoose');

/**
 * Notification Schema
 * Supports all platform event types that a user cares about:
 *  - new_message    : Someone sent you a chat message
 *  - book_request   : Someone enquired about your book
 *  - note_upvote    : Your note received an upvote
 *  - note_milestone : Your note hit 10/25/50 upvotes
 *  - book_sold      : Your book was marked as sold
 *  - system         : Platform announcements
 */
const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
            // Optional — system notifications have no sender
        },
        type: {
            type: String,
            enum: [
                'new_message',
                'book_request',
                'note_upvote',
                'note_milestone',
                'book_sold',
                'system'
            ],
            required: true
        },
        title: {
            type: String,
            required: true,
            maxlength: 100
        },
        message: {
            type: String,
            required: true,
            maxlength: 300
        },
        // Frontend route the user should land on when clicking the notification
        link: {
            type: String,
            default: null
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Compound index for fast "unread notifications for user" queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
