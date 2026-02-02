const mongoose = require('mongoose');

/**
 * Chat Schema
 * Represents a chat conversation between buyer and seller
 * Safe by design with rate limiting and blocking
 */
const chatSchema = new mongoose.Schema({
    // Participants (buyer and seller)
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],

    // Related book (optional - can chat about notes too)
    relatedBook: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        default: null
    },

    // Related note (optional)
    relatedNote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
        default: null
    },

    // Last message info (for sorting)
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    // Status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    // Campus
    campus: {
        type: String,
        required: true,
        index: true
    },

    // Created timestamp
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound indexes
chatSchema.index({ participants: 1, isActive: 1 });
chatSchema.index({ campus: 1, lastMessageAt: -1 });

// Ensure exactly 2 participants
chatSchema.pre('save', function (next) {
    if (this.participants.length !== 2) {
        next(new Error('Chat must have exactly 2 participants'));
    } else {
        next();
    }
});

// Static method to find or create chat between two users
chatSchema.statics.findOrCreate = async function (user1Id, user2Id, campus, relatedBook = null, relatedNote = null) {
    // Sort participant IDs to ensure consistent ordering
    const participants = [user1Id, user2Id].sort();

    let chat = await this.findOne({
        participants: { $all: participants },
        isActive: true
    });

    if (!chat) {
        chat = await this.create({
            participants,
            campus,
            relatedBook,
            relatedNote
        });
    }

    return chat;
};

module.exports = mongoose.model('Chat', chatSchema);
