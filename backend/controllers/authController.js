const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const { generateTokenResponse } = require('../utils/jwt');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { isValidCollegeEmail } = require('../utils/emailValidator');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // Temp Debug Logging
    console.log("OAuth profile:", payload);
    console.log("OAuth email:", email);
    console.log("Trimmed email:", email?.trim());
    console.log("Extracted domain:", email ? email.trim().toLowerCase().split('@')[1] : '');
    console.log("Validation result:", isValidCollegeEmail(email));

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

    // Temp Debug Logging
    console.log("OAuth profile:", payload);
    console.log("OAuth email:", email);
    console.log("Trimmed email:", email?.trim());
    console.log("Extracted domain:", email ? email.trim().toLowerCase().split('@')[1] : '');
    console.log("Validation result:", isValidCollegeEmail(email));

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

/**
 * Helper to dynamically construct the Google OAuth2 Client
 */
const getOAuth2Client = (req) => {
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 
        `${process.env.NODE_ENV === 'production' ? 'https' : req.protocol}://${req.get('host')}/api/auth/google/callback`;
    return new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );
};

/**
 * @desc    Redirect to Google OAuth consent page
 * @route   GET /api/auth/google
 * @access  Public
 */
const googleRedirect = asyncHandler(async (req, res) => {
    const oauth2Client = getOAuth2Client(req);
    
    const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ],
        prompt: 'consent'
    });
    
    res.redirect(authorizeUrl);
});

/**
 * @desc    Google OAuth callback handling
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleCallback = asyncHandler(async (req, res) => {
    const { code } = req.query;
    if (!code) {
        throw new AppError('Authorization code is required', 400);
    }
    
    const oauth2Client = getOAuth2Client(req);
    
    // Exchange code for tokens
    let tokens;
    try {
        const response = await oauth2Client.getToken(code);
        tokens = response.tokens;
    } catch (error) {
        console.error('Failed to retrieve Google tokens:', error);
        throw new AppError('Failed to retrieve Google tokens', 400);
    }
    
    oauth2Client.setCredentials(tokens);
    
    // Verify ID token
    let ticket;
    try {
        ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
    } catch (error) {
        console.error('Google token verification error:', error);
        throw new AppError('Invalid Google token in callback', 401);
    }
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Verify college email domain (accepts .edu and .ac.in subdomains)
    if (!isValidCollegeEmail(email)) {
        return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Please use your college email address (ending with .edu or .ac.in)')}`);
    }
    
    // Find or create user
    let user = await User.findOne({ googleId });
    
    if (!user) {
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Email already registered with different account')}`);
        }
        
        // Redirect to complete registration
        return res.redirect(`${frontendUrl}/complete-registration?credential=${encodeURIComponent(tokens.id_token)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&picture=${encodeURIComponent(picture || '')}`);
    } else {
        // Update user active time
        user.lastActive = new Date();
        if (picture) {
            user.profilePicture = picture;
        }
        await user.save();
        
        // Generate JWT tokens
        const jwtTokens = generateTokenResponse(user._id);
        
        // Redirect to frontend login with tokens
        return res.redirect(`${frontendUrl}/login?token=${encodeURIComponent(jwtTokens.accessToken)}&refreshToken=${encodeURIComponent(jwtTokens.refreshToken)}`);
    }
});

module.exports = {
    googleLogin,
    completeRegistration,
    refreshToken,
    getCurrentUser,
    logout,
    googleRedirect,
    googleCallback
};
