const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const admin = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

// Platform stats
router.get('/stats', admin.getStats);

// Users
router.get('/users', admin.getUsers);
router.patch('/users/:id/block', admin.toggleBlockUser);
router.patch('/users/:id/role', admin.setUserRole);

// Notes
router.get('/notes', admin.getNotes);
router.patch('/notes/:id/moderate', admin.moderateNote);

// Books
router.get('/books', admin.getBooks);
router.delete('/books/:id', admin.removeBook);

// Reports
router.get('/reports', admin.getReports);
router.patch('/reports/:id/resolve', admin.resolveReport);

module.exports = router;
