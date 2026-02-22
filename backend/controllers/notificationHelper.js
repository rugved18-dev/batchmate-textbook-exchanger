const { Notification } = require('../models');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Notification Helper
 * Create a notification in DB and push it in real-time via Socket.io.
 *
 * @param {import('socket.io').Server} io  - Socket.io server instance
 * @param {Object} data
 * @param {string} data.recipientId        - ObjectId string of the recipient user
 * @param {string} [data.senderId]         - ObjectId string of the actor (optional)
 * @param {string} data.type               - Notification type enum
 * @param {string} data.title              - Short title
 * @param {string} data.message            - Full notification message
 * @param {string} [data.link]             - Frontend route to navigate to on click
 */
const createNotification = async (io, data) => {
    try {
        const { recipientId, senderId, type, title, message, link } = data;

        // Don't notify yourself
        if (senderId && recipientId.toString() === senderId.toString()) return null;

        // Persist to MongoDB
        const notification = await Notification.create({
            recipient: recipientId,
            sender: senderId || null,
            type,
            title,
            message,
            link: link || null
        });

        // Populate sender info for the real-time payload
        await notification.populate('sender', 'name profilePicture');

        // Emit to recipient's personal socket room (they joined as userData._id in setup)
        if (io) {
            io.to(recipientId.toString()).emit('new_notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('[NotificationHelper] Failed to create notification:', error.message);
        // Non-fatal — never crash the calling request
        return null;
    }
};

module.exports = { createNotification };