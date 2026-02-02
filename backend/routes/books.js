const express = require('express');
const router = express.Router();
const { bookController } = require('../controllers');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validate, bookSchemas, bookRequestSchemas } = require('../middleware/validation');
const { uploadImages } = require('../middleware/upload');

// Book Requests (cold start)
router.post('/request', authenticate, validate(bookRequestSchemas.create), bookController.createBookRequest);
router.get('/requests', authenticate, bookController.getBookRequests);
router.delete('/requests/:id', authenticate, bookController.cancelBookRequest);
router.post('/requests/:id/fulfill', authenticate, bookController.fulfillBookRequest);

// My listings
router.get('/my-listings', authenticate, bookController.getMyListings);

// @route   GET /api/books
// @desc    Get all books with filters
// @access  Public
router.get('/', optionalAuth, validate(bookSchemas.filter, 'query'), bookController.getBooks);

// @route   GET /api/books/:id
// @desc    Get single book
// @access  Public
router.get('/:id', optionalAuth, bookController.getBookById);

// @route   POST /api/books
// @desc    Create a new book listing
// @access  Private
router.post('/', authenticate, uploadLimiter, uploadImages, validate(bookSchemas.create), bookController.createBook);

// @route   PUT /api/books/:id
// @desc    Update book listing
// @access  Private
router.put('/:id', authenticate, uploadImages, validate(bookSchemas.update), bookController.updateBook);

// @route   DELETE /api/books/:id
// @desc    Delete book listing
// @access  Private
router.delete('/:id', authenticate, bookController.deleteBook);

// @route   POST /api/books/:id/sold
// @desc    Mark book as sold
// @access  Private
router.post('/:id/sold', authenticate, bookController.markAsSold);

// @route   DELETE /api/books/:id/images/:imageId
// @desc    Remove book image
// @access  Private
router.delete('/:id/images/:imageId', authenticate, bookController.removeImage);

module.exports = router;
