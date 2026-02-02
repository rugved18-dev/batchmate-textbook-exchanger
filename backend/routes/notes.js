const express = require('express');
const router = express.Router();
const { noteController } = require('../controllers');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadLimiter, voteLimiter } = require('../middleware/rateLimiter');
const { validate, noteSchemas } = require('../middleware/validation');
const { uploadPDF } = require('../middleware/upload');

// @route   GET /api/notes/popular
// @desc    Get popular notes
// @access  Public
router.get('/popular', optionalAuth, noteController.getPopularNotes);

// @route   GET /api/notes
// @desc    Get all notes with filters
// @access  Public
router.get('/', optionalAuth, validate(noteSchemas.filter, 'query'), noteController.getNotes);

// @route   GET /api/notes/:id
// @desc    Get single note
// @access  Public
router.get('/:id', optionalAuth, noteController.getNoteById);

// @route   POST /api/notes
// @desc    Upload a new note
// @access  Private
router.post('/', authenticate, uploadLimiter, uploadPDF, validate(noteSchemas.create), noteController.uploadNote);

// @route   GET /api/notes/:id/download
// @desc    Download note
// @access  Private
router.get('/:id/download', authenticate, noteController.downloadNote);

// @route   POST /api/notes/:id/vote
// @desc    Vote on a note
// @access  Private
router.post('/:id/vote', authenticate, voteLimiter, noteController.voteNote);

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/:id', authenticate, noteController.deleteNote);

module.exports = router;
