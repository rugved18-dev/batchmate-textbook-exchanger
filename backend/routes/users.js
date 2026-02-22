const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { validate, userSchemas } = require('../middleware/validation');

// Leaderboard
router.get('/leaderboard', authenticate, userController.getLeaderboard);

// Analytics (dashboard charts) — must be before /:id
router.get('/analytics', authenticate, userController.getAnalytics);

// Blocked users
router.get('/blocked', authenticate, userController.getBlockedUsers);

// @route   GET /api/users/profile
// @desc    Get own profile
// @access  Private
router.get('/profile', authenticate, userController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update own profile
// @access  Private
router.put('/profile', authenticate, validate(userSchemas.updateProfile), userController.updateProfile);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticate, userController.getUserById);

// @route   GET /api/users/:id/notes
// @desc    Get user's notes
// @access  Private
router.get('/:id/notes', authenticate, userController.getUserNotes);

// @route   GET /api/users/:id/books
// @desc    Get user's books
// @access  Private
router.get('/:id/books', authenticate, userController.getUserBooks);

// @route   POST /api/users/block/:id
// @desc    Block a user
// @access  Private
router.post('/block/:id', authenticate, userController.blockUser);

// @route   DELETE /api/users/block/:id
// @desc    Unblock a user
// @access  Private
router.delete('/block/:id', authenticate, userController.unblockUser);

// Admin routes
router.get('/', authenticate, requireAdmin, userController.getAllUsers);
router.put('/:id/role', authenticate, requireAdmin, userController.updateUserRole);
router.put('/:id/block', authenticate, requireAdmin, userController.adminBlockUser);

module.exports = router;
