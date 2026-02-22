const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { authenticate } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get current user's notifications (most recent 50, unread first)
 * @route   GET /api/notifications
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 30, 50);

    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ isRead: 1, createdAt: -1 })   // unread first, then newest
        .limit(limit)
        .populate('sender', 'name profilePicture')
        .lean();

    const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false
    });

    res.status(200).json({
        success: true,
        data: {
            notifications,
            unreadCount
        }
    });
}));

/**
 * @desc    Get unread notification count only (for Navbar badge poll fallback)
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
router.get('/unread-count', authenticate, asyncHandler(async (req, res) => {
    const unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false
    });

    res.status(200).json({
        success: true,
        data: { unreadCount }
    });
}));

/**
 * @desc    Mark ALL notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 * NOTE: This route must be defined BEFORE /:id/read to avoid Express
 *       treating "read-all" as an :id parameter.
 */
router.put('/read-all', authenticate, asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
    });
}));

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
router.put('/:id/read', authenticate, asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user._id },
        { isRead: true, readAt: new Date() },
        { new: true }
    );

    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    res.status(200).json({
        success: true,
        data: { notification }
    });
}));

/**
 * @desc    Delete a single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: req.user._id
    });

    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    res.status(200).json({
        success: true,
        message: 'Notification deleted'
    });
}));

module.exports = router;
