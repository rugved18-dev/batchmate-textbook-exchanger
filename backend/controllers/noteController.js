const { Note, User, Vote, Report } = require('../models');
const { uploadNotePDF, deleteFile, validatePDF } = require('../utils/cloudinary');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { createNotification } = require('./notificationHelper');
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
        search,
        sortBy = 'recent',
        page = 1,
        limit = 20
    } = req.query;

    // ── Base filter (always applied) ──────────────────────────────────────────
    const campus = req.user ? req.user.campus : req.query.campus;
    if (!campus) throw new AppError('Campus parameter is required', 400);

    const baseFilter = {
        campus,
        isHidden: false,
        moderationStatus: { $in: ['approved', 'pending'] }
    };

    if (department) baseFilter.department = department;
    if (semester) baseFilter.semester = parseInt(semester);
    if (subject) baseFilter.subject = new RegExp(subject, 'i');

    // ── Sort ──────────────────────────────────────────────────────────────────
    let sort = {};
    switch (sortBy) {
        case 'popular': sort = { voteScore: -1, uploadedAt: -1 }; break;
        case 'downloads': sort = { downloadCount: -1, uploadedAt: -1 }; break;
        default: sort = { uploadedAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const lim = parseInt(limit);
    const pop = { path: 'uploadedBy', select: 'name department semester reputationScore' };
    const sel = '-filePublicId';

    // ── No search query — standard paginated list ─────────────────────────────
    if (!search || !search.trim()) {
        const [notes, total] = await Promise.all([
            Note.find(baseFilter).sort(sort).skip(skip).limit(lim).populate(pop).select(sel),
            Note.countDocuments(baseFilter)
        ]);
        return res.status(200).json({
            success: true,
            count: notes.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / lim),
            notes,
            searchMeta: null
        });
    }

    // ── SMART SEARCH ──────────────────────────────────────────────────────────
    const q = search.trim();

    // 1️⃣  Find uploaders whose NAME matches the query (for "search by teacher name")
    const matchingUsers = await require('../models').User.find({
        name: new RegExp(q.split(/\s+/).join('|'), 'i')
    }).select('_id').lean();
    const uploaderIds = matchingUsers.map(u => u._id);

    // 2️⃣  Build per-field regex OR clause (always included — catches short queries
    //     and query words that MongoDB $text treats as stop-words)
    const terms = q.split(/\s+/).filter(Boolean);
    const regexOr = terms.flatMap(t => {
        const r = new RegExp(t, 'i');
        return [
            { title: r },
            { subject: r },
            { subjectCode: r },
            { description: r }
        ];
    });
    if (uploaderIds.length) regexOr.push({ uploadedBy: { $in: uploaderIds } });

    // 3️⃣  Try $text search first (stemmed, diacritic-insensitive, weighted)
    let notes = [];
    let usedTextSearch = false;

    try {
        const textFilter = {
            ...baseFilter,
            $text: { $search: q, $diacriticSensitive: false }
        };
        const textResults = await Note
            .find(textFilter, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' }, ...sort })
            .limit(lim * 3)   // fetch more so Fuse.js can re-rank
            .populate(pop)
            .select(sel)
            .lean();

        if (textResults.length > 0) {
            notes = textResults;
            usedTextSearch = true;
        }
    } catch (_) {
        // $text index may not exist yet — fall through to regex
    }

    // 4️⃣  If $text returned nothing, use regex OR (also catches typos via Fuse on FE)
    if (!usedTextSearch) {
        const regexFilter = { ...baseFilter, $or: regexOr };
        notes = await Note
            .find(regexFilter)
            .sort(sort)
            .limit(lim * 3)
            .populate(pop)
            .select(sel)
            .lean();
    }

    // 5️⃣  Also union in uploader-name matches that $text might have missed
    if (uploaderIds.length && usedTextSearch) {
        const uploaderMatches = await Note
            .find({ ...baseFilter, uploadedBy: { $in: uploaderIds } })
            .sort(sort)
            .limit(20)
            .populate(pop)
            .select(sel)
            .lean();

        // Merge without duplicates
        const seen = new Set(notes.map(n => n._id.toString()));
        for (const n of uploaderMatches) {
            if (!seen.has(n._id.toString())) {
                notes.push(n);
                seen.add(n._id.toString());
            }
        }
    }

    res.status(200).json({
        success: true,
        count: notes.length,
        total: notes.length,
        page: 1,
        pages: 1,
        notes,
        // Tell the frontend which mode was used so it can show a label
        searchMeta: {
            query: q,
            mode: usedTextSearch ? 'text' : 'regex',
            uploaderMatchCount: uploaderIds.length
        }
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
    const wasEligibleBefore = note.rewardEligible;
    note.checkRewardEligibility();
    await note.save();

    // Award reputation to uploader if newly eligible
    if (note.rewardEligible && !note.rewardGiven) {
        const uploader = await User.findById(note.uploadedBy);
        if (uploader) {
            await uploader.updateReputation(5);
            note.rewardGiven = true;
            await note.save();
        }
    }

    // 🔔 Notify the note uploader about the upvote
    if (voteType === 'upvote' && !existingVote) {
        await createNotification(req.io, {
            recipientId: note.uploadedBy.toString(),
            senderId: req.user._id.toString(),
            type: 'note_upvote',
            title: 'Your note got an upvote!',
            message: `${req.user.name} upvoted your note "${note.title}"`,
            link: `/notes/${note._id}`
        });
    }

    // 🔔 Milestone notification when note first becomes reward-eligible
    if (!wasEligibleBefore && note.rewardEligible) {
        await createNotification(req.io, {
            recipientId: note.uploadedBy.toString(),
            type: 'note_milestone',
            title: '🎉 Milestone reached!',
            message: `Your note "${note.title}" is now reward-eligible and you earned reputation points!`,
            link: `/notes/${note._id}`
        });
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
