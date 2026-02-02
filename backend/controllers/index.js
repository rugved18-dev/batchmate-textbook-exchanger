/**
 * Central export for all controllers
 */

const authController = require('./authController');
const noteController = require('./noteController');
const bookController = require('./bookController');
const chatController = require('./chatController');
const reportController = require('./reportController');
const userController = require('./userController');

module.exports = {
    authController,
    noteController,
    bookController,
    chatController,
    reportController,
    userController
};
