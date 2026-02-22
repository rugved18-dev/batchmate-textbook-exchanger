const { User, Note, Book, BookRequest, Report, Vote } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ─── 1. Platform Overview Stats ───────────────────────────────────────────────
const getStats = asyncHandler(async (req, res) => {
    const now = new Date();
    const startOf7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const startOf30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
        totalUsers,
        newUsers7d,
        activeUsers7d,
        blockedUsers,
        totalNotes,
        pendingNotes,
        hiddenNotes,
        totalBooks,
        activeBooks,
        totalReports,
        openReports,
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: startOf7Days } }),
        User.countDocuments({ lastActive: { $gte: startOf7Days } }),
        User.countDocuments({ isBlocked: true }),
        Note.countDocuments(),
        Note.countDocuments({ moderationStatus: 'pending' }),
        Note.countDocuments({ isHidden: true }),
        Book.countDocuments(),
        Book.countDocuments({ status: 'available' }),
        Report.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
    ]);

    // Last 8 weeks signups
    const signupTrend = await User.aggregate([
        { $match: { createdAt: { $gte: startOf30Days } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.json({
        success: true,
        stats: {
            users: { total: totalUsers, new7d: newUsers7d, active7d: activeUsers7d, blocked: blockedUsers },
            notes: { total: totalNotes, pending: pendingNotes, hidden: hiddenNotes },
            books: { total: totalBooks, active: activeBooks },
            reports: { total: totalReports, open: openReports },
            signupTrend
        }
    });
});

// ─── 2. List Users ───────────────────────────────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '', role = '', blocked = '' } = req.query;
    const filter = {};
    if (search) filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { campus: new RegExp(search, 'i') }
    ];
    if (role) filter.role = role;
    if (blocked !== '') filter.isBlocked = blocked === 'true';

    const [users, total] = await Promise.all([
        User.find(filter)
            .select('-googleId')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(+limit),
        User.countDocuments(filter)
    ]);
    res.json({ success: true, users, total, page: +page, pages: Math.ceil(total / limit) });
});

// ─── 3. Block / Unblock User ─────────────────────────────────────────────────
const toggleBlockUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Cannot block an admin', 403);

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, isBlocked: user.isBlocked, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}` });
});

// ─── 4. Change User Role ─────────────────────────────────────────────────────
const setUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) throw new AppError('Invalid role', 400);

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-googleId');
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, user });
});

// ─── 5. List Notes ───────────────────────────────────────────────────────────
const getNotes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const filter = {};
    if (search) filter.$or = [
        { title: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') }
    ];
    if (status === 'pending') filter.moderationStatus = 'pending';
    if (status === 'hidden') filter.isHidden = true;
    if (status === 'flagged') filter.moderationStatus = 'flagged';

    const [notes, total] = await Promise.all([
        Note.find(filter)
            .select('-filePublicId')
            .populate('uploadedBy', 'name email campus')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(+limit),
        Note.countDocuments(filter)
    ]);
    res.json({ success: true, notes, total, page: +page, pages: Math.ceil(total / limit) });
});

// ─── 6. Approve / Hide Note ──────────────────────────────────────────────────
const moderateNote = asyncHandler(async (req, res) => {
    const { action } = req.body; // 'approve' | 'hide' | 'flag'
    const validActions = ['approve', 'hide', 'flag'];
    if (!validActions.includes(action)) throw new AppError('Invalid action', 400);

    const update = {
        approve: { moderationStatus: 'approved', isHidden: false, moderatedBy: req.user._id },
        hide: { isHidden: true, moderationStatus: 'rejected', moderatedBy: req.user._id },
        flag: { moderationStatus: 'flagged', moderatedBy: req.user._id },
    }[action];

    const note = await Note.findByIdAndUpdate(req.params.id, update, { new: true })
        .populate('uploadedBy', 'name email');
    if (!note) throw new AppError('Note not found', 404);
    res.json({ success: true, note });
});

// ─── 7. List Books ───────────────────────────────────────────────────────────
const getBooks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const filter = {};
    if (search) filter.$or = [
        { title: new RegExp(search, 'i') },
        { author: new RegExp(search, 'i') }
    ];
    if (status) filter.status = status;

    const [books, total] = await Promise.all([
        Book.find(filter)
            .populate('seller', 'name email campus')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(+limit),
        Book.countDocuments(filter)
    ]);
    res.json({ success: true, books, total, page: +page, pages: Math.ceil(total / limit) });
});

// ─── 8. Remove Book ──────────────────────────────────────────────────────────
const removeBook = asyncHandler(async (req, res) => {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) throw new AppError('Book not found', 404);
    res.json({ success: true, message: 'Book removed' });
});

// ─── 9. List Reports ─────────────────────────────────────────────────────────
const getReports = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status = '' } = req.query;
    const filter = status ? { status } : {};

    const [reports, total] = await Promise.all([
        Report.find(filter)
            .populate('reportedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(+limit),
        Report.countDocuments(filter)
    ]);
    res.json({ success: true, reports, total, page: +page, pages: Math.ceil(total / limit) });
});

// ─── 10. Resolve Report ──────────────────────────────────────────────────────
const resolveReport = asyncHandler(async (req, res) => {
    const { action } = req.body; // 'resolve' | 'dismiss'
    const report = await Report.findByIdAndUpdate(
        req.params.id,
        { status: action === 'resolve' ? 'resolved' : 'dismissed', resolvedAt: new Date(), resolvedBy: req.user._id },
        { new: true }
    );
    if (!report) throw new AppError('Report not found', 404);
    res.json({ success: true, report });
});

module.exports = {
    getStats,
    getUsers, toggleBlockUser, setUserRole,
    getNotes, moderateNote,
    getBooks, removeBook,
    getReports, resolveReport
};
