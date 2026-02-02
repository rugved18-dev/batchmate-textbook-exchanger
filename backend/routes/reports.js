const express = require('express');
const router = express.Router();
const { reportController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { canModerate, requireAdmin } = require('../middleware/rbac');
const { reportLimiter } = require('../middleware/rateLimiter');
const { validate, reportSchemas } = require('../middleware/validation');

// @route   POST /api/reports
// @desc    Create a report
// @access  Private
router.post('/', authenticate, reportLimiter, validate(reportSchemas.create), reportController.createReport);

// @route   GET /api/reports
// @desc    Get reports (moderator only)
// @access  Private (Moderator)
router.get('/', authenticate, canModerate, reportController.getReports);

// @route   GET /api/reports/stats
// @desc    Get moderation statistics
// @access  Private (Admin)
router.get('/stats', authenticate, requireAdmin, reportController.getStats);

// @route   PUT /api/reports/:id
// @desc    Review a report
// @access  Private (Moderator)
router.put('/:id', authenticate, canModerate, validate(reportSchemas.review), reportController.reviewReport);

module.exports = router;
