const { User, Note, Book, BookRequest, Vote, Report } = require('../models');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * User Controller
 * Handles user profiles, reputation, and account management
 */

const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('-__v -blockedUsers');

    const [notesCount, booksCount] = await Promise.all([
        Note.countDocuments({ uploadedBy: req.user._id }),
        Book.countDocuments({ listedBy: req.user._id })
    ]);

    res.status(200).json({
        success: true,
        user,
        stats: { notesUploaded: notesCount, booksListed: booksCount }
    });
});

const updateProfile = asyncHandler(async (req, res) => {
    const { name, department, semester } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (department) updates.department = department;
    if (semester) updates.semester = semester;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });

    res.status(200).json({ success: true, message: 'Profile updated', user });
});

const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('name profilePicture department semester campus reputationScore uploadCount exchangeCount createdAt');

    if (!user) throw new AppError('User not found', 404);

    // Same campus check for detailed view
    const isSameCampus = req.user && req.user.campus === user.campus;

    const [notesCount, booksCount] = await Promise.all([
        Note.countDocuments({ uploadedBy: user._id, isHidden: false }),
        Book.countDocuments({ listedBy: user._id, isHidden: false, status: 'available' })
    ]);

    res.status(200).json({
        success: true,
        user,
        stats: { notesUploaded: notesCount, booksAvailable: booksCount },
        isSameCampus
    });
});

const getUserNotes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.params.id || req.user._id;

    const query = { uploadedBy: userId };
    // Only show hidden notes to owner
    if (userId.toString() !== req.user._id.toString()) {
        query.isHidden = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [notes, total] = await Promise.all([
        Note.find(query).sort({ uploadedAt: -1 }).skip(skip).limit(parseInt(limit)),
        Note.countDocuments(query)
    ]);

    res.status(200).json({ success: true, count: notes.length, total, notes });
});

const getUserBooks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.params.id || req.user._id;

    const query = { listedBy: userId };
    if (userId.toString() !== req.user._id.toString()) {
        query.isHidden = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [books, total] = await Promise.all([
        Book.find(query).sort({ listedAt: -1 }).skip(skip).limit(parseInt(limit)),
        Book.countDocuments(query)
    ]);

    res.status(200).json({ success: true, count: books.length, total, books });
});

const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id === req.user._id.toString()) throw new AppError('You cannot block yourself', 400);

    const userToBlock = await User.findById(id);
    if (!userToBlock) throw new AppError('User not found', 404);

    if (req.user.blockedUsers.includes(id)) {
        throw new AppError('User already blocked', 400);
    }

    req.user.blockedUsers.push(id);
    await req.user.save();

    res.status(200).json({ success: true, message: 'User blocked' });
});

const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const index = req.user.blockedUsers.indexOf(id);

    if (index === -1) throw new AppError('User is not blocked', 400);

    req.user.blockedUsers.splice(index, 1);
    await req.user.save();

    res.status(200).json({ success: true, message: 'User unblocked' });
});

const getBlockedUsers = asyncHandler(async (req, res) => {
    await req.user.populate('blockedUsers', 'name profilePicture');
    res.status(200).json({ success: true, blockedUsers: req.user.blockedUsers });
});

const getLeaderboard = asyncHandler(async (req, res) => {
    const users = await User.find({ campus: req.user.campus, isBlocked: false })
        .sort({ reputationScore: -1 })
        .limit(20)
        .select('name profilePicture department reputationScore uploadCount exchangeCount');

    res.status(200).json({ success: true, leaderboard: users });
});

// Admin: Get all users
const getAllUsers = asyncHandler(async (req, res) => {
    const { campus, role, isBlocked, page = 1, limit = 20 } = req.query;
    const query = {};

    if (campus) query.campus = campus;
    if (role) query.role = role;
    if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
        User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        User.countDocuments(query)
    ]);

    res.status(200).json({ success: true, count: users.length, total, users });
});

// Admin: Update user role
const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
        throw new AppError('Invalid role', 400);
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
    );

    if (!user) throw new AppError('User not found', 404);

    res.status(200).json({ success: true, message: 'User role updated', user });
});

// Admin: Block/Unblock user
const adminBlockUser = asyncHandler(async (req, res) => {
    const { isBlocked } = req.body;

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBlocked },
        { new: true }
    );

    if (!user) throw new AppError('User not found', 404);

    res.status(200).json({
        success: true,
        message: isBlocked ? 'User blocked' : 'User unblocked',
        user
    });
});

/**
 * @desc    Get personal analytics for dashboard charts (last 8 weeks)
 * @route   GET /api/users/analytics
 * @access  Private
 */
const getAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const weeksBack = 8;

    // Build the last N week-start dates (Monday-anchored ISO weeks)
    const now = new Date();
    const weeks = [];
    for (let i = weeksBack - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        // Zero out to Monday of that week
        const day = d.getDay() || 7;  // 0=Sun → 7
        d.setDate(d.getDate() - (day - 1));
        d.setHours(0, 0, 0, 0);
        weeks.push(d);
    }

    const cutoff = weeks[0];  // 8 weeks ago

    // Helper: bucket an array of {week, count} aggregation results
    const bucketize = (rows, key = 'count') => {
        const map = new Map();
        for (const row of rows) {
            const label = `W${String(row._id.week).padStart(2, '0')}/${row._id.year}`;
            map.set(label, row[key]);
        }
        return weeks.map((d) => {
            // Compute ISO week number for this monday
            const tmp = new Date(d);
            tmp.setHours(0, 0, 0, 0);
            tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
            const yearStart = new Date(tmp.getFullYear(), 0, 1);
            const week = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
            const label = `W${String(week).padStart(2, '0')}/${tmp.getFullYear()}`;
            // Short display label: "Feb 3"
            const short = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            return { week: short, value: map.get(label) || 0 };
        });
    };

    // 1. Get user's notes so we can aggregate vote/download data
    const myNotes = await Note.find({ uploadedBy: userId }).select('_id upvotes downloadCount uploadedAt').lean();
    const myNoteIds = myNotes.map(n => n._id);

    // 2. Weekly upvotes on my notes (from Vote collection)
    const upvoteAgg = await Vote.aggregate([
        {
            $match: {
                note: { $in: myNoteIds },
                voteType: 'upvote',
                createdAt: { $gte: cutoff }
            }
        },
        {
            $group: {
                _id: {
                    year: { $isoWeekYear: '$createdAt' },
                    week: { $isoWeek: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        }
    ]);

    // 3. Weekly downloads on my notes
    // Note: we don't store individual download events, so we estimate from
    // downloadCount on notes. For a true time-series we'd need a DownloadEvent
    // collection. As a practical alternative, spread total downloadCount across
    // upload week buckets, then add cumulative trend.
    // Since we have no time-series download events, we generate a
    // realistic proxy: use the note's downloadCount proportionally.
    // For charts this is good enough until a download-events collection is added.
    const myBooks = await Book.find({ listedBy: userId }).select('_id listedAt').lean();

    // 4. Weekly book requests made by campus users (visible to this user as platform activity)
    const bookReqAgg = await BookRequest.aggregate([
        {
            $match: {
                campus: req.user.campus,
                requestedAt: { $gte: cutoff }
            }
        },
        {
            $group: {
                _id: {
                    year: { $isoWeekYear: '$requestedAt' },
                    week: { $isoWeek: '$requestedAt' }
                },
                count: { $sum: 1 }
            }
        }
    ]);

    // 5. Weekly my notes uploaded (for 'my activity' bar chart)
    const noteUploadAgg = await Note.aggregate([
        {
            $match: { uploadedBy: userId, uploadedAt: { $gte: cutoff } }
        },
        {
            $group: {
                _id: {
                    year: { $isoWeekYear: '$uploadedAt' },
                    week: { $isoWeek: '$uploadedAt' }
                },
                count: { $sum: 1 }
            }
        }
    ]);

    // Summary stats
    const totalUpvotes = myNotes.reduce((s, n) => s + (n.upvotes || 0), 0);
    const totalDownloads = myNotes.reduce((s, n) => s + (n.downloadCount || 0), 0);

    const [totalNotes, totalBooks, totalBookRequests, campusUsers] = await Promise.all([
        Note.countDocuments({ campus: req.user.campus, isHidden: false }),
        Book.countDocuments({ campus: req.user.campus, isHidden: false, status: 'available' }),
        BookRequest.countDocuments({ campus: req.user.campus, status: 'active' }),
        User.countDocuments({ campus: req.user.campus, isBlocked: false })
    ]);

    res.status(200).json({
        success: true,
        data: {
            charts: {
                upvotes: bucketize(upvoteAgg),
                bookRequests: bucketize(bookReqAgg),
                myUploads: bucketize(noteUploadAgg)
            },
            myStats: {
                totalUpvotes,
                totalDownloads,
                notesUploaded: myNotes.length,
                booksListed: myBooks.length
            },
            campusStats: {
                totalNotes,
                totalBooks,
                totalBookRequests,
                campusUsers
            }
        }
    });
});

module.exports = {
    getProfile,
    updateProfile,
    getUserById,
    getUserNotes,
    getUserBooks,
    blockUser,
    unblockUser,
    getBlockedUsers,
    getLeaderboard,
    getAnalytics,
    getAllUsers,
    updateUserRole,
    adminBlockUser
};
