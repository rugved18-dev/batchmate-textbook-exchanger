const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// @route   POST /api/auth/google
// @desc    Login with Google OAuth (token verification)
// @access  Public
router.post('/google', authLimiter, authController.googleLogin);

// @route   GET /api/auth/google
// @desc    Redirect to Google OAuth consent page
// @access  Public
router.get('/google', authController.googleRedirect);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback handling
// @access  Public
router.get('/google/callback', authController.googleCallback);

// @route   POST /api/auth/complete-registration
// @desc    Complete registration after Google OAuth
// @access  Public
router.post('/complete-registration', authLimiter, authController.completeRegistration);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', authController.refreshToken);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, authController.getCurrentUser);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, authController.logout);

module.exports = router;
