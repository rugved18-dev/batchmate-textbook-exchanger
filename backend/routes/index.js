/**
 * Central export for all routes
 */

const authRoutes = require('./auth');
const noteRoutes = require('./notes');
const bookRoutes = require('./books');
const chatRoutes = require('./chat');
const reportRoutes = require('./reports');
const userRoutes = require('./users');

module.exports = {
    authRoutes,
    noteRoutes,
    bookRoutes,
    chatRoutes,
    reportRoutes,
    userRoutes
};
