/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles and permissions
 */

/**
 * Require specific role(s)
 * @param {string|string[]} roles - Required role(s)
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
};

/**
 * Require admin role
 */
const requireAdmin = requireRole('admin');

/**
 * Require moderator or admin role
 */
const requireModerator = requireRole('moderator', 'admin');

/**
 * Check if user can moderate (high reputation or moderator/admin)
 */
const canModerate = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.user.canModerate()) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'You need higher reputation or moderator status to perform this action'
    });
};

/**
 * Check if user owns the resource
 * Expects req.params.userId or req.body.userId
 */
const requireOwnership = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const targetUserId = req.params.userId || req.body.userId;

    if (!targetUserId) {
        return res.status(400).json({
            success: false,
            message: 'User ID not provided'
        });
    }

    // Allow if user is admin or owns the resource
    if (req.user.role === 'admin' || req.user._id.toString() === targetUserId.toString()) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'You can only modify your own resources'
    });
};

/**
 * Verify same campus
 * Ensures users can only interact within their campus
 */
const verifySameCampus = (campusField = 'campus') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const targetCampus = req.body[campusField] || req.params[campusField] || req.query[campusField];

        // If no campus specified, use user's campus
        if (!targetCampus) {
            req.body[campusField] = req.user.campus;
            return next();
        }

        // Verify same campus (admins can access all campuses)
        if (req.user.role === 'admin' || req.user.campus === targetCampus) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'You can only access resources from your campus'
        });
    };
};

module.exports = {
    requireRole,
    requireAdmin,
    requireModerator,
    canModerate,
    requireOwnership,
    verifySameCampus
};
