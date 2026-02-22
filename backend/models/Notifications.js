const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who triggered it
    type: {
        type: String,
        enum: ['MESSAGE', 'BOOK_REQUEST', 'NOTE_UPVOTE', 'SYSTEM'],
        required: true
    },
    message: { type: String, required: true },
    link: { type: String }, // Clicking the notification goes here (e.g., /chat/123)
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);