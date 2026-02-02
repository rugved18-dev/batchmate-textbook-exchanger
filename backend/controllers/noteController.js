const { Note, User, Vote, Report } = require('../models');
const { uploadNotePDF, deleteFile, validatePDF } = require('../utils/cloudinary');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const fs = require('fs').promises;

/**
 * Notes Controller
 * Primary engagement driver - handwritten notes sharing
 */

/**
 * @desc    Upload a new note
 * @route   POST /api/notes
 * @access  Private
 */
const uploadNote = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        subject,
        subjectCode,
        department,
        semester,
        confirmedHandwritten
    } = req.body;

    // Check if file is uploaded
    if (!req.file) {
        throw new AppError('Please upload a PDF file', 400);
    }

    // Validate PDF
    validatePDF(req.file);

    // Verify handwritten confirmation
    if (confirmedHandwritten !== 'true' && confirmedHandwritten !== true) {
        // Clean up uploaded file
        await fs.unlink(req.file.path);
        throw new AppError('You must confirm this is handwritten content', 400);
    }

    // Upload to Cloudinary
    let uploadResult;
    try {
        uploadResult = await uploadNotePDF(req.file.path);
    } catch (error) {
        // Clean up local file
        await fs.unlink(req.file.path);
        throw error;
    }

    // Clean up local file after successful upload
    await fs.unlink(req.file.path);

    // Check page count (minimum 2 pages)
    if (uploadResult.pageCount < 2) {
        // Delete from Cloudinary
        await deleteFile(uploadResult.filePublicId, 'raw');
        throw new AppError('Notes must have at least 2 pages', 400);
    }

    // Create note
    const note = await Note.create({
        uploadedBy: req.user._id,
        title,
        description,
        subject,
        subjectCode,
        department,
        semester,
        fileUrl: uploadResult.fileUrl,
        filePublicId: uploadResult.filePublicId,
        thumbnailUrl: uploadResult.thumbnailUrl,
        pageCount: uploadResult.pageCount,
        fileSize: uploadResult.fileSize,
        isHandwritten: true,
        confirmedHandwritten: true,
        campus: req.user.campus
    });

    // Update user upload count
    req.user.uploadCount += 1;
    await req.user.save();

    // Populate uploader info
    await note.populate('uploadedBy', 'name department semester reputationScore');

    res.status(201).json({
        success: true,
        message: 'Note uploaded successfully',
        note
    });
});

/**
 * @desc    Get all notes with filters
 * @route   GET /api/notes
 * @access  Public (with optional auth for personalization)
 */
const getNotes = asyncHandler(async (req, res) => {
    const {
        department,
        semester,
        subject,
        sortBy = 'recent',
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

    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (subject) query.subject = new RegExp(subject, 'i');

    // Build sort
    let sort = {};
    switch (sortBy) {
        case 'popular':
            sort = { voteScore: -1, uploadedAt: -1 };
            break;
        case 'downloads':
            sort = { downloadCount: -1, uploadedAt: -1 };
            break;
        case 'recent':
        default:
            sort = { uploadedAt: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [notes, total] = await Promise.all([
        Note.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('uploadedBy', 'name department semester reputationScore')
            .select('-filePublicId'),
        Note.countDocuments(query)
    ]);

    res.status(200).json({
        success: true,
        count: notes.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        notes
    });
});

/**
 * @desc    Get single note by ID
 * @route   GET /api/notes/:id
 * @access  Public
 */
const getNoteById = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id)
        .populate('uploadedBy', 'name department semester reputationScore profilePicture');

    if (!note) {
        throw new AppError('Note not found', 404);
    }

    // Check if hidden (only uploader and moderators can see)
    if (note.isHidden) {
        if (!req.user ||
            (req.user._id.toString() !== note.uploadedBy._id.toString() &&
                !req.user.canModerate())) {
            throw new AppError('Note not found', 404);
        }
    }

    // Increment view count
    note.viewCount += 1;
    await note.save();

    // Get user's vote if authenticated
    let userVote = null;
    if (req.user) {
        const vote = await Vote.findOne({
            user: req.user._id,
            note: note._id
        });
        userVote = vote ? vote.voteType : null;
    }

    res.status(200).json({
        success: true,
        note,
        userVote
    });
});

/**
 * @desc    Download note
 * @route   GET /api/notes/:id/download
 * @access  Private
 */
const downloadNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
        throw new AppError('Note not found', 404);
    }

    if (note.isHidden) {
        throw new AppError('Note not available', 404);
    }

    // Verify same campus
    if (note.campus !== req.user.campus && req.user.role !== 'admin') {
        throw new AppError('You can only download notes from your campus', 403);
    }

    // Increment download count and check reward eligibility
    await note.incrementDownload();

    // Award reputation to uploader if eligible
    if (note.rewardEligible && !note.rewardGiven) {
        const uploader = await User.findById(note.uploadedBy);
        if (uploader) {
            await uploader.updateReputation(5); // 5 points for eligible note
            note.rewardGiven = true;
            await note.save();
        }
    }

    res.status(200).json({
        success: true,
        downloadUrl: note.fileUrl,
        note: {
            title: note.title,
            subject: note.subject,
            pageCount: note.pageCount
        }
    });
});

/**
 * @desc    Vote on a note (upvote/downvote)
 * @route   POST /api/notes/:id/vote
 * @access  Private
 */
const voteNote = asyncHandler(async (req, res) => {
    const { voteType } = req.body;
    const noteId = req.params.id;

    if (!['upvote', 'downvote'].includes(voteType)) {
        throw new AppError('Invalid vote type', 400);
    }

    const note = await Note.findById(noteId);

    if (!note) {
        throw new AppError('Note not found', 404);
    }

    // Can't vote on own notes
    if (note.uploadedBy.toString() === req.user._id.toString()) {
        throw new AppError('You cannot vote on your own notes', 400);
    }

    // Check if user already voted
    let existingVote = await Vote.findOne({
        user: req.user._id,
        note: noteId
    });

    if (existingVote) {
        // If same vote type, remove vote
        if (existingVote.voteType === voteType) {
            // Remove vote
            if (voteType === 'upvote') {
                note.upvotes = Math.max(0, note.upvotes - 1);
            } else {
                note.downvotes = Math.max(0, note.downvotes - 1);
            }
            await existingVote.deleteOne();
        } else {
            // Change vote
            if (voteType === 'upvote') {
                note.upvotes += 1;
                note.downvotes = Math.max(0, note.downvotes - 1);
            } else {
                note.downvotes += 1;
                note.upvotes = Math.max(0, note.upvotes - 1);
            }
            existingVote.voteType = voteType;
            await existingVote.save();
        }
    } else {
        // Create new vote
        await Vote.create({
            user: req.user._id,
            note: noteId,
            voteType
        });

        if (voteType === 'upvote') {
            note.upvotes += 1;
        } else {
            note.downvotes += 1;
        }
    }

    // Update vote score
    await note.updateVoteScore();

    // Check reward eligibility
    note.checkRewardEligibility();
    await note.save();

    // Award reputation to uploader if eligible
    if (note.rewardEligible && !note.rewardGiven) {
        const uploader = await User.findById(note.uploadedBy);
        if (uploader) {
            await uploader.updateReputation(5);
            note.rewardGiven = true;
            await note.save();
        }
    }

    res.status(200).json({
        success: true,
        message: 'Vote recorded',
        voteScore: note.voteScore,
        upvotes: note.upvotes,
        downvotes: note.downvotes
    });
});

/**
 * @desc    Delete own note
 * @route   DELETE /api/notes/:id
 * @access  Private
 */
const deleteNote = asyncHandler(async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
        throw new AppError('Note not found', 404);
    }

    // Check ownership or admin
    if (note.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new AppError('You can only delete your own notes', 403);
    }

    // Delete from Cloudinary
    try {
        await deleteFile(note.filePublicId, 'raw');
    } catch (error) {
        console.error('Failed to delete from Cloudinary:', error);
        // Continue with database deletion even if Cloudinary fails
    }

    // Delete associated votes
    await Vote.deleteMany({ note: note._id });

    // Delete associated reports
    await Report.deleteMany({ targetType: 'Note', targetId: note._id });

    // Delete note
    await note.deleteOne();

    // Update user upload count
    const user = await User.findById(note.uploadedBy);
    if (user) {
        user.uploadCount = Math.max(0, user.uploadCount - 1);
        await user.save();
    }

    res.status(200).json({
        success: true,
        message: 'Note deleted successfully'
    });
});

/**
 * @desc    Get popular notes
 * @route   GET /api/notes/popular
 * @access  Public
 */
const getPopularNotes = asyncHandler(async (req, res) => {
    const campus = req.user ? req.user.campus : req.query.campus;
    const limit = parseInt(req.query.limit) || 10;

    if (!campus) {
        throw new AppError('Campus parameter is required', 400);
    }

    const notes = await Note.findPopular(campus, limit);

    res.status(200).json({
        success: true,
        count: notes.length,
        notes
    });
});

module.exports = {
    uploadNote,
    getNotes,
    getNoteById,
    downloadNote,
    voteNote,
    deleteNote,
    getPopularNotes
};
