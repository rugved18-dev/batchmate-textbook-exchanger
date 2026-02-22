const { Book, BookRequest, User, Report } = require('../models');
const { uploadBookImage, deleteFile, deleteMultipleFiles, validateImage } = require('../utils/cloudinary');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { createNotification } = require('./notificationHelper');
const fs = require('fs').promises;

/**
 * Book Controller
 * Handles textbook listings, exchanges, and book requests
 */

/**
 * Calculate suggested price based on MRP and condition
 * Depreciation: 40-60% of MRP based on condition
 * @param {number} mrp - Maximum Retail Price
 * @param {string} condition - Book condition
 * @returns {number} Suggested price
 */
const calculateSuggestedPrice = (mrp, condition) => {
    const depreciationRates = {
        'Like New': 0.60, // 40% depreciation
        'Good': 0.55,     // 45% depreciation
        'Fair': 0.50,     // 50% depreciation
        'Acceptable': 0.40 // 60% depreciation
    };

    const rate = depreciationRates[condition] || 0.50;
    return Math.round(mrp * rate);
};

/**
 * @desc    Create a new book listing
 * @route   POST /api/books
 * @access  Private
 */
const createBook = asyncHandler(async (req, res) => {
    const {
        title,
        author,
        isbn,
        edition,
        publisher,
        subjectCode,
        subject,
        department,
        semester,
        mrp,
        finalPrice,
        isNegotiable,
        condition,
        conditionNotes,
        preferredMeetupLocations
    } = req.body;

    // Validate MRP
    if (!mrp || mrp <= 0) {
        throw new AppError('Valid MRP is required', 400);
    }

    // Calculate suggested price
    const suggestedPrice = calculateSuggestedPrice(mrp, condition);

    // Validate final price is within acceptable range (40-70% of MRP)
    // Allow some flexibility but warn if too high/low
    const minPrice = mrp * 0.30; // 70% depreciation max
    const maxPrice = mrp * 0.70; // 30% depreciation min

    if (finalPrice < minPrice) {
        throw new AppError(`Price seems too low. Minimum recommended: ₹${Math.round(minPrice)}`, 400);
    }

    if (finalPrice > maxPrice) {
        throw new AppError(`Price seems too high for used books. Maximum recommended: ₹${Math.round(maxPrice)}`, 400);
    }

    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
        // Validate each image
        for (const file of req.files) {
            validateImage(file);
        }

        // Upload to Cloudinary
        try {
            for (const file of req.files) {
                const result = await uploadBookImage(file.path);
                images.push(result);
                // Clean up local file
                await fs.unlink(file.path);
            }
        } catch (error) {
            // Clean up any uploaded images on error
            for (const img of images) {
                await deleteFile(img.publicId, 'image');
            }
            // Clean up remaining local files
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path);
                } catch (e) {
                    // File may already be deleted
                }
            }
            throw error;
        }
    }

    // At least one image is recommended
    if (images.length === 0) {
        // Not throwing error, but could add warning
        console.log('Book listed without images - may affect visibility');
    }

    // Create book listing
    const book = await Book.create({
        listedBy: req.user._id,
        title,
        author,
        isbn,
        edition,
        publisher,
        subjectCode,
        subject,
        department,
        semester,
        mrp,
        suggestedPrice,
        finalPrice,
        isNegotiable: isNegotiable !== false, // Default true
        condition,
        conditionNotes,
        preferredMeetupLocations: preferredMeetupLocations || [],
        images,
        campus: req.user.campus
    });

    // Populate seller info
    await book.populate('listedBy', 'name department semester reputationScore profilePicture');

    res.status(201).json({
        success: true,
        message: 'Book listed successfully',
        book,
        suggestedPrice // Return for reference
    });
});

/**
 * @desc    Get all books with filters
 * @route   GET /api/books
 * @access  Public (campus required)
 */
const getBooks = asyncHandler(async (req, res) => {
    const {
        department,
        semester,
        subject,
        condition,
        minPrice,
        maxPrice,
        sortBy = 'recent',
        status = 'available',
        page = 1,
        limit = 20
    } = req.query;

    // Build query
    const query = {
        campus: req.user ? req.user.campus : req.query.campus,
        isHidden: false,
        moderationStatus: { $in: ['approved', 'pending'] }
    };

    if (!query.campus) {
        throw new AppError('Campus parameter is required', 400);
    }

    // Apply filters
    if (status) query.status = status;
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (subject) query.subject = new RegExp(subject, 'i');
    if (condition) query.condition = condition;

    // Price range filter
    if (minPrice || maxPrice) {
        query.finalPrice = {};
        if (minPrice) query.finalPrice.$gte = parseInt(minPrice);
        if (maxPrice) query.finalPrice.$lte = parseInt(maxPrice);
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
        case 'price_low':
            sort = { finalPrice: 1 };
            break;
        case 'price_high':
            sort = { finalPrice: -1 };
            break;
        case 'recent':
        default:
            sort = { listedAt: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [books, total] = await Promise.all([
        Book.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('listedBy', 'name department semester reputationScore'),
        Book.countDocuments(query)
    ]);

    res.status(200).json({
        success: true,
        count: books.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        books
    });
});

/**
 * @desc    Get single book by ID
 * @route   GET /api/books/:id
 * @access  Public
 */
const getBookById = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id)
        .populate('listedBy', 'name department semester reputationScore profilePicture email');

    if (!book) {
        throw new AppError('Book not found', 404);
    }

    // Check if hidden
    if (book.isHidden) {
        if (!req.user ||
            (req.user._id.toString() !== book.listedBy._id.toString() &&
                !req.user.canModerate())) {
            throw new AppError('Book not found', 404);
        }
    }

    // Increment view count
    book.viewCount += 1;
    await book.save();

    // Remove seller email for non-authenticated users or if not same campus
    const bookResponse = book.toObject();
    if (!req.user || req.user.campus !== book.campus) {
        delete bookResponse.listedBy.email;
    }

    res.status(200).json({
        success: true,
        book: bookResponse
    });
});

/**
 * @desc    Update book listing
 * @route   PUT /api/books/:id
 * @access  Private (Owner only)
 */
const updateBook = asyncHandler(async (req, res) => {
    let book = await Book.findById(req.params.id);

    if (!book) {
        throw new AppError('Book not found', 404);
    }

    // Check ownership
    if (book.listedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new AppError('You can only update your own listings', 403);
    }

    // Check if book is already sold
    if (book.status === 'sold') {
        throw new AppError('Cannot update a sold book', 400);
    }

    // Allowed fields to update
    const allowedUpdates = [
        'finalPrice',
        'isNegotiable',
        'condition',
        'conditionNotes',
        'preferredMeetupLocations',
        'status'
    ];

    // Apply updates
    for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
            book[field] = req.body[field];
        }
    }

    // Recalculate suggested price if condition changed
    if (req.body.condition) {
        book.suggestedPrice = calculateSuggestedPrice(book.mrp, req.body.condition);
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
        // Max 5 images total
        if (book.images.length + req.files.length > 5) {
            throw new AppError('Maximum 5 images allowed per listing', 400);
        }

        for (const file of req.files) {
            validateImage(file);
            const result = await uploadBookImage(file.path);
            book.images.push(result);
            await fs.unlink(file.path);
        }
    }

    await book.save();
    await book.populate('listedBy', 'name department semester reputationScore');

    res.status(200).json({
        success: true,
        message: 'Book updated successfully',
        book
    });
});

/**
 * @desc    Delete book listing
 * @route   DELETE /api/books/:id
 * @access  Private (Owner only)
 */
const deleteBook = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);

    if (!book) {
        throw new AppError('Book not found', 404);
    }

    // Check ownership
    if (book.listedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new AppError('You can only delete your own listings', 403);
    }

    // Delete images from Cloudinary
    if (book.images.length > 0) {
        const publicIds = book.images.map(img => img.publicId);
        try {
            await deleteMultipleFiles(publicIds, 'image');
        } catch (error) {
            console.error('Failed to delete images from Cloudinary:', error);
            // Continue with deletion even if Cloudinary fails
        }
    }

    // Delete associated reports
    await Report.deleteMany({ targetType: 'Book', targetId: book._id });

    // Delete book
    await book.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Book deleted successfully'
    });
});

/**
 * @desc    Mark book as sold
 * @route   POST /api/books/:id/sold
 * @access  Private (Owner only)
 */
const markAsSold = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);

    if (!book) {
        throw new AppError('Book not found', 404);
    }

    // Check ownership
    if (book.listedBy.toString() !== req.user._id.toString()) {
        throw new AppError('You can only mark your own books as sold', 403);
    }

    // Check current status
    if (book.status === 'sold') {
        throw new AppError('Book is already marked as sold', 400);
    }

    // Mark as sold
    await book.markAsSold();

    // Update user's exchange count
    req.user.exchangeCount += 1;
    await req.user.updateReputation(10); // 10 points for successful exchange

    // 🔔 Notify the seller (self) with a congratulations
    await createNotification(req.io, {
        recipientId: req.user._id.toString(),
        type: 'book_sold',
        title: '🎉 Book sold!',
        message: `Congratulations! "${book.title}" has been marked as sold. You earned 10 reputation points.`,
        link: '/profile'
    });

    res.status(200).json({
        success: true,
        message: 'Book marked as sold. Congratulations!',
        book
    });
});

/**
 * @desc    Remove book image
 * @route   DELETE /api/books/:id/images/:imageId
 * @access  Private (Owner only)
 */
const removeImage = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);

    if (!book) {
        throw new AppError('Book not found', 404);
    }

    // Check ownership
    if (book.listedBy.toString() !== req.user._id.toString()) {
        throw new AppError('You can only modify your own listings', 403);
    }

    // Find image
    const imageIndex = book.images.findIndex(
        img => img.publicId === req.params.imageId || img._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
        throw new AppError('Image not found', 404);
    }

    // Delete from Cloudinary
    await deleteFile(book.images[imageIndex].publicId, 'image');

    // Remove from array
    book.images.splice(imageIndex, 1);
    await book.save();

    res.status(200).json({
        success: true,
        message: 'Image removed successfully',
        remainingImages: book.images.length
    });
});

/**
 * @desc    Create a book request (for cold start)
 * @route   POST /api/books/request
 * @access  Private
 */
const createBookRequest = asyncHandler(async (req, res) => {
    const {
        title,
        author,
        subjectCode,
        subject,
        department,
        semester,
        maxBudget,
        notes
    } = req.body;

    // Check for duplicate active request
    const existingRequest = await BookRequest.findOne({
        requestedBy: req.user._id,
        title: new RegExp(`^${title}$`, 'i'),
        status: 'active'
    });

    if (existingRequest) {
        throw new AppError('You already have an active request for this book', 400);
    }

    // Limit active requests per user (max 5)
    const activeCount = await BookRequest.countDocuments({
        requestedBy: req.user._id,
        status: 'active'
    });

    if (activeCount >= 5) {
        throw new AppError('You can have maximum 5 active book requests', 400);
    }

    // Create request
    const bookRequest = await BookRequest.create({
        requestedBy: req.user._id,
        title,
        author,
        subjectCode,
        subject,
        department,
        semester,
        maxBudget,
        notes,
        campus: req.user.campus
    });

    await bookRequest.populate('requestedBy', 'name department semester');

    // 🔔 Confirm to the requester that their request is live
    await createNotification(req.io, {
        recipientId: req.user._id.toString(),
        type: 'book_request',
        title: 'Book request posted!',
        message: `Your request for "${title}" is now live. We'll notify you when someone has it.`,
        link: '/books'
    });

    res.status(201).json({
        success: true,
        message: 'Book request created successfully',
        bookRequest
    });
});

/**
 * @desc    Get book requests
 * @route   GET /api/books/requests
 * @access  Private
 */
const getBookRequests = asyncHandler(async (req, res) => {
    const {
        department,
        semester,
        status = 'active',
        myRequests,
        page = 1,
        limit = 20
    } = req.query;

    // Build query
    const query = {
        campus: req.user.campus
    };

    if (status) query.status = status;
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (myRequests === 'true') query.requestedBy = req.user._id;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, total] = await Promise.all([
        BookRequest.find(query)
            .sort({ requestedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('requestedBy', 'name department semester'),
        BookRequest.countDocuments(query)
    ]);

    res.status(200).json({
        success: true,
        count: requests.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        requests
    });
});

/**
 * @desc    Cancel book request
 * @route   DELETE /api/books/requests/:id
 * @access  Private (Owner only)
 */
const cancelBookRequest = asyncHandler(async (req, res) => {
    const request = await BookRequest.findById(req.params.id);

    if (!request) {
        throw new AppError('Request not found', 404);
    }

    // Check ownership
    if (request.requestedBy.toString() !== req.user._id.toString()) {
        throw new AppError('You can only cancel your own requests', 403);
    }

    // Check if already fulfilled
    if (request.status === 'fulfilled') {
        throw new AppError('Cannot cancel a fulfilled request', 400);
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({
        success: true,
        message: 'Book request cancelled'
    });
});

/**
 * @desc    Mark book request as fulfilled
 * @route   POST /api/books/requests/:id/fulfill
 * @access  Private (Owner only)
 */
const fulfillBookRequest = asyncHandler(async (req, res) => {
    const request = await BookRequest.findById(req.params.id);

    if (!request) {
        throw new AppError('Request not found', 404);
    }

    // Check ownership
    if (request.requestedBy.toString() !== req.user._id.toString()) {
        throw new AppError('You can only update your own requests', 403);
    }

    request.status = 'fulfilled';
    request.fulfilledAt = new Date();
    await request.save();

    res.status(200).json({
        success: true,
        message: 'Book request marked as fulfilled'
    });
});

/**
 * @desc    Get user's listed books
 * @route   GET /api/books/my-listings
 * @access  Private
 */
const getMyListings = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { listedBy: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [books, total] = await Promise.all([
        Book.find(query)
            .sort({ listedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Book.countDocuments(query)
    ]);

    res.status(200).json({
        success: true,
        count: books.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        books
    });
});

module.exports = {
    createBook,
    getBooks,
    getBookById,
    updateBook,
    deleteBook,
    markAsSold,
    removeImage,
    createBookRequest,
    getBookRequests,
    cancelBookRequest,
    fulfillBookRequest,
    getMyListings
};
