/**
 * Admin-only middleware
 * Must be used AFTER the `authenticate` middleware.
 */
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }
    next();
};

module.exports = { requireAdmin };
