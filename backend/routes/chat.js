const express = require('express');
const router = express.Router();
const { chatController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const { validate, messageSchemas } = require('../middleware/validation');

// Get message templates
router.get('/templates', authenticate, chatController.getTemplates);

// Get unread count
router.get('/unread', authenticate, chatController.getUnreadCount);

// Get blocked users
router.get('/blocked', authenticate, chatController.getBlockedUsers);

// Block/Unblock user
router.post('/block/:userId', authenticate, chatController.blockUser);
router.delete('/block/:userId', authenticate, chatController.unblockUser);

// @route   GET /api/chat
// @desc    Get user's chats
// @access  Private
router.get('/', authenticate, chatController.getUserChats);

// @route   POST /api/chat
// @desc    Create or get chat
// @access  Private
router.post('/', authenticate, chatController.createOrGetChat);

// @route   GET /api/chat/:id/messages
// @desc    Get chat messages
// @access  Private
router.get('/:id/messages', authenticate, chatController.getMessages);

// @route   POST /api/chat/:id/messages
// @desc    Send message
// @access  Private
router.post('/:id/messages', authenticate, chatLimiter, chatController.sendMessage);

// @route   PUT /api/chat/:id/read
// @desc    Mark messages as read
// @access  Private
router.put('/:id/read', authenticate, chatController.markAsRead);

module.exports = router;
