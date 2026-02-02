const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware
 * Prevents spam and abuse
 */

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Auth rate limiter (stricter)
 * 5 login attempts per 15 minutes
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Upload rate limiter
 * 10 uploads per hour
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        success: false,
        message: 'Upload limit reached. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Chat rate limiter for new users
 * Checks user reputation and account age
 */
const chatLimiter = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // Check if user is rate limited
    if (req.user.isRateLimited()) {
        // Apply stricter limit for new users
        const newUserLimit = rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 5, // 5 messages per hour
            message: {
                success: false,
                message: 'New users are limited to 5 messages per hour. Build your reputation to unlock more.'
            },
            keyGenerator: (req) => req.user._id.toString(),
            standardHeaders: true,
            legacyHeaders: false
        });

        return newUserLimit(req, res, next);
    }

    // Regular users get normal limit
    next();
};

/**
 * Report rate limiter
 * 10 reports per day
 */
const reportLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10,
    message: {
        success: false,
        message: 'Report limit reached. Please try again tomorrow.'
    },
    keyGenerator: (req) => req.user ? req.user._id.toString() : req.ip,
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Vote rate limiter
 * 100 votes per hour
 */
const voteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Vote limit reached. Please try again later.'
    },
    keyGenerator: (req) => req.user ? req.user._id.toString() : req.ip,
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    generalLimiter,
    authLimiter,
    uploadLimiter,
    chatLimiter,
    reportLimiter,
    voteLimiter
};
