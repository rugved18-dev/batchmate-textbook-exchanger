const { Chat, Message, User, Book, Note } = require('../models');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Chat Controller
 * Safe messaging system between buyers and sellers
 * Features: predefined templates, rate limiting for new users, blocking
 */

/**
 * @desc    Create or get existing chat
 * @route   POST /api/chat
 * @access  Private
 */
const createOrGetChat = asyncHandler(async (req, res) => {
    const { recipientId, bookId, noteId } = req.body;

    if (!recipientId) {
        throw new AppError('Recipient ID is required', 400);
    }

    // Cannot chat with yourself
    if (recipientId === req.user._id.toString()) {
        throw new AppError('You cannot start a chat with yourself', 400);
    }

    // Get recipient
    const recipient = await User.findById(recipientId);

    if (!recipient) {
        throw new AppError('User not found', 404);
    }

    // Check if recipient is blocked or has blocked the user
    if (recipient.isBlocked) {
        throw new AppError('Cannot message this user', 403);
    }

    if (recipient.blockedUsers.includes(req.user._id)) {
        throw new AppError('You cannot message this user', 403);
    }

    if (req.user.blockedUsers.includes(recipientId)) {
        throw new AppError('You have blocked this user. Unblock to message.', 400);
    }

    // Verify same campus
    if (recipient.campus !== req.user.campus && req.user.role !== 'admin') {
        throw new AppError('You can only chat with users from your campus', 403);
    }

    // Validate book/note if provided
    let relatedBook = null;
    let relatedNote = null;

    if (bookId) {
        const book = await Book.findById(bookId);
        if (!book) {
            throw new AppError('Book not found', 404);
        }
        // Verify book belongs to recipient (seller)
        if (book.listedBy.toString() !== recipientId) {
            throw new AppError('Invalid book reference', 400);
        }
        relatedBook = bookId;
    }

    if (noteId) {
        const note = await Note.findById(noteId);
        if (!note) {
            throw new AppError('Note not found', 404);
        }
        relatedNote = noteId;
    }

    // Find or create chat
    const chat = await Chat.findOrCreate(
        req.user._id,
        recipientId,
        req.user.campus,
        relatedBook,
        relatedNote
    );

    // Populate details
    await chat.populate([
        { path: 'participants', select: 'name profilePicture department semester reputationScore' },
        { path: 'relatedBook', select: 'title finalPrice condition images' },
        { path: 'relatedNote', select: 'title subject thumbnailUrl' }
    ]);

    // Get unread count
    const unreadCount = await Message.getUnreadCount(chat._id, req.user._id);

    res.status(200).json({
        success: true,
        chat,
        unreadCount
    });
});

/**
 * @desc    Get all user's chats
 * @route   GET /api/chat
 * @access  Private
 */
const getUserChats = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find chats where user is a participant
    const [chats, total] = await Promise.all([
        Chat.find({
            participants: req.user._id,
            isActive: true
        })
            .sort({ lastMessageAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('participants', 'name profilePicture department')
            .populate('relatedBook', 'title finalPrice images')
            .populate('relatedNote', 'title thumbnailUrl'),
        Chat.countDocuments({
            participants: req.user._id,
            isActive: true
        })
    ]);

    // Add unread count to each chat
    const chatsWithUnread = await Promise.all(
        chats.map(async (chat) => {
            const unreadCount = await Message.getUnreadCount(chat._id, req.user._id);
            return {
                ...chat.toObject(),
                unreadCount
            };
        })
    );

    res.status(200).json({
        success: true,
        count: chats.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        chats: chatsWithUnread
    });
});

/**
 * @desc    Get chat messages
 * @route   GET /api/chat/:id/messages
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
        throw new AppError('Chat not found', 404);
    }

    // Verify user is participant
    if (!chat.participants.includes(req.user._id)) {
        throw new AppError('You are not a participant in this chat', 403);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
        Message.find({ chat: chat._id })
            .sort({ sentAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('sender', 'name profilePicture'),
        Message.countDocuments({ chat: chat._id })
    ]);

    // Reverse to get chronological order
    messages.reverse();

    res.status(200).json({
        success: true,
        count: messages.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        messages
    });
});

/**
 * @desc    Send a message
 * @route   POST /api/chat/:id/messages
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
    const { content, isTemplate, templateType } = req.body;

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
        throw new AppError('Chat not found', 404);
    }

    // Verify user is participant
    if (!chat.participants.includes(req.user._id)) {
        throw new AppError('You are not a participant in this chat', 403);
    }

    // Check if chat is active
    if (!chat.isActive) {
        throw new AppError('This chat has been closed', 400);
    }

    // Get other participant
    const otherParticipantId = chat.participants.find(
        p => p.toString() !== req.user._id.toString()
    );
    const otherParticipant = await User.findById(otherParticipantId);

    // Check if blocked
    if (otherParticipant.blockedUsers.includes(req.user._id)) {
        throw new AppError('You cannot message this user', 403);
    }

    // Get message content
    let messageContent = content;

    // Use template if specified
    if (isTemplate && templateType && Message.TEMPLATES[templateType]) {
        messageContent = Message.TEMPLATES[templateType];
    }

    if (!messageContent || messageContent.trim().length === 0) {
        throw new AppError('Message content is required', 400);
    }

    // Validate message length
    if (messageContent.length > 1000) {
        throw new AppError('Message is too long (max 1000 characters)', 400);
    }

    // Create message
    const message = await Message.create({
        chat: chat._id,
        sender: req.user._id,
        content: messageContent.trim(),
        isTemplate: isTemplate || false,
        templateType: templateType || 'custom'
    });

    // Update chat's last message
    chat.lastMessage = messageContent.substring(0, 100);
    chat.lastMessageAt = new Date();
    await chat.save();

    // Populate sender info
    await message.populate('sender', 'name profilePicture');

    res.status(201).json({
        success: true,
        message
    });
});

/**
 * @desc    Mark messages as read
 * @route   PUT /api/chat/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
        throw new AppError('Chat not found', 404);
    }

    // Verify user is participant
    if (!chat.participants.includes(req.user._id)) {
        throw new AppError('You are not a participant in this chat', 403);
    }

    // Mark all unread messages from other participants as read
    const result = await Message.updateMany(
        {
            chat: chat._id,
            sender: { $ne: req.user._id },
            isRead: false
        },
        {
            isRead: true,
            readAt: new Date()
        }
    );

    res.status(200).json({
        success: true,
        markedAsRead: result.modifiedCount
    });
});

/**
 * @desc    Get predefined message templates
 * @route   GET /api/chat/templates
 * @access  Private
 */
const getTemplates = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        templates: Message.TEMPLATES
    });
});

/**
 * @desc    Block a user
 * @route   POST /api/chat/block/:userId
 * @access  Private
 */
const blockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
        throw new AppError('You cannot block yourself', 400);
    }

    const userToBlock = await User.findById(userId);

    if (!userToBlock) {
        throw new AppError('User not found', 404);
    }

    // Check if already blocked
    if (req.user.blockedUsers.includes(userId)) {
        throw new AppError('User is already blocked', 400);
    }

    // Add to blocked list
    req.user.blockedUsers.push(userId);
    await req.user.save();

    // Deactivate any existing chats between them
    await Chat.updateMany(
        {
            participants: { $all: [req.user._id, userId] }
        },
        { isActive: false }
    );

    res.status(200).json({
        success: true,
        message: 'User blocked successfully'
    });
});

/**
 * @desc    Unblock a user
 * @route   DELETE /api/chat/block/:userId
 * @access  Private
 */
const unblockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const index = req.user.blockedUsers.indexOf(userId);

    if (index === -1) {
        throw new AppError('User is not blocked', 400);
    }

    // Remove from blocked list
    req.user.blockedUsers.splice(index, 1);
    await req.user.save();

    // Reactivate chats
    await Chat.updateMany(
        {
            participants: { $all: [req.user._id, userId] }
        },
        { isActive: true }
    );

    res.status(200).json({
        success: true,
        message: 'User unblocked successfully'
    });
});

/**
 * @desc    Get blocked users
 * @route   GET /api/chat/blocked
 * @access  Private
 */
const getBlockedUsers = asyncHandler(async (req, res) => {
    await req.user.populate('blockedUsers', 'name profilePicture department');

    res.status(200).json({
        success: true,
        blockedUsers: req.user.blockedUsers
    });
});

/**
 * @desc    Get total unread count across all chats
 * @route   GET /api/chat/unread
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
    // Get all active chats for user
    const chats = await Chat.find({
        participants: req.user._id,
        isActive: true
    });

    // Count unread messages across all chats
    let totalUnread = 0;
    for (const chat of chats) {
        const count = await Message.getUnreadCount(chat._id, req.user._id);
        totalUnread += count;
    }

    res.status(200).json({
        success: true,
        unreadCount: totalUnread
    });
});

module.exports = {
    createOrGetChat,
    getUserChats,
    getMessages,
    sendMessage,
    markAsRead,
    getTemplates,
    blockUser,
    unblockUser,
    getBlockedUsers,
    getUnreadCount
};
