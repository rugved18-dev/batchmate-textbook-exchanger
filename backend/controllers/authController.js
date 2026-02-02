const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const { generateTokenResponse } = require('../utils/jwt');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Validate if email is from an academic institution
 * Accepts any email whose domain ENDS WITH .edu or .ac.in (including subdomains)
 * Examples: user@stanford.edu, name@viit.ac.in, student@cs.university.edu
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid college email
 */
const isValidCollegeEmail = (email) => {
    console.log('[EMAIL VALIDATION] Testing email:', email);

    if (!email || typeof email !== 'string') {
        console.log('[EMAIL VALIDATION] Failed: Invalid input type');
        return false;
    }

    const emailLower = email.toLowerCase().trim();
    const atIndex = emailLower.lastIndexOf('@');

    // Must have @ and domain part
    if (atIndex === -1 || atIndex === emailLower.length - 1) {
        console.log('[EMAIL VALIDATION] Failed: No @ or no domain');
        return false;
    }

    const domain = emailLower.substring(atIndex + 1);
    console.log('[EMAIL VALIDATION] Extracted domain:', domain);

    // Reject known non-academic domains
    const blockedDomains = [
        'gmail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com',
        'live.com', 'icloud.com', 'protonmail.com', 'aol.com', 'rediffmail.com'
    ];
    if (blockedDomains.includes(domain)) {
        console.log('[EMAIL VALIDATION] Failed: Blocked domain');
        return false;
    }

    // Accept if domain ends with .edu or .ac.in
    const isValid = domain.endsWith('.edu') || domain.endsWith('.ac.in');
    console.log('[EMAIL VALIDATION] Ends with .edu?', domain.endsWith('.edu'));
    console.log('[EMAIL VALIDATION] Ends with .ac.in?', domain.endsWith('.ac.in'));
    console.log('[EMAIL VALIDATION] Final result:', isValid);

    return isValid;
};

/**
 * Authentication Controller
 * Handles Google OAuth login and JWT session management
 */

/**
 * @desc    Google OAuth login
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = asyncHandler(async (req, res) => {
    const { credential, campus } = req.body;

    if (!credential) {
        throw new AppError('Google credential is required', 400);
    }

    if (!campus) {
        throw new AppError('Campus selection is required', 400);
    }

    // Verify Google token
    let ticket;
    try {
        ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
    } catch (error) {
        console.error('Google token verification error:', error);
        throw new AppError('Invalid Google token', 401);
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Verify college email domain (accepts .edu and .ac.in subdomains)
    if (!isValidCollegeEmail(email)) {
        throw new AppError('Please use your college email address (ending with .edu or .ac.in) to sign up', 403);
    }

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
        // Check if email already exists (shouldn't happen, but safety check)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('Email already registered with different account', 400);
        }

        // Create new user - require additional info on first login
        if (!req.body.department || !req.body.semester) {
            return res.status(206).json({
                success: true,
                requiresAdditionalInfo: true,
                message: 'Please provide department and semester',
                userData: {
                    email,
                    name,
                    picture
                }
            });
        }

        user = await User.create({
            googleId,
            email,
            name,
            profilePicture: picture,
            campus,
            department: req.body.department,
            semester: req.body.semester
        });
    } else {
        // Update last active and profile picture
        user.lastActive = new Date();
        if (picture) {
            user.profilePicture = picture;
        }
        await user.save();
    }

    // Generate tokens
    const tokens = generateTokenResponse(user._id);

    res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture,
            department: user.department,
            semester: user.semester,
            campus: user.campus,
            role: user.role,
            reputationScore: user.reputationScore
        },
        tokens
    });
});

/**
 * @desc    Complete user registration (after Google OAuth)
 * @route   POST /api/auth/complete-registration
 * @access  Public
 */
const completeRegistration = asyncHandler(async (req, res) => {
    const { credential, campus, department, semester } = req.body;

    if (!credential || !campus || !department || !semester) {
        throw new AppError('All fields are required', 400);
    }

    // Verify Google token
    let ticket;
    try {
        ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
    } catch (error) {
        throw new AppError('Invalid Google token', 401);
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Verify college email domain (accepts .edu and .ac.in subdomains)
    if (!isValidCollegeEmail(email)) {
        throw new AppError('Please use your college email address (ending with .edu or .ac.in)', 403);
    }

    // Check if user already exists
    let user = await User.findOne({ googleId });

    if (user) {
        throw new AppError('User already registered', 400);
    }

    // Create user
    user = await User.create({
        googleId,
        email,
        name,
        profilePicture: picture,
        campus,
        department,
        semester
    });

    // Generate tokens
    const tokens = generateTokenResponse(user._id);

    res.status(201).json({
        success: true,
        message: 'Registration completed successfully',
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture,
            department: user.department,
            semester: user.semester,
            campus: user.campus,
            role: user.role,
            reputationScore: user.reputationScore
        },
        tokens
    });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const { verifyRefreshToken } = require('../utils/jwt');
    let decoded;

    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        throw new AppError('Invalid or expired refresh token', 401);
    }

    // Get user
    const user = await User.findById(decoded.userId);

    if (!user || user.isBlocked) {
        throw new AppError('User not found or blocked', 401);
    }

    // Generate new tokens
    const tokens = generateTokenResponse(user._id);

    res.status(200).json({
        success: true,
        tokens
    });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-__v');

    res.status(200).json({
        success: true,
        user
    });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    // In JWT-based auth, logout is handled client-side by removing tokens
    // This endpoint is for logging purposes

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = {
    googleLogin,
    completeRegistration,
    refreshToken,
    getCurrentUser,
    logout
};
