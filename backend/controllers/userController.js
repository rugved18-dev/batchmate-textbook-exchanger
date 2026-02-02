const { User, Note, Book, Report } = require('../models');
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
    getAllUsers,
    updateUserRole,
    adminBlockUser
};
