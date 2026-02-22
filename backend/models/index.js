/**
 * Central export for all Mongoose models
 * Ensures consistent model access across the application
 */

const User = require('./User');
const Note = require('./Note');
const Book = require('./Book');
const BookRequest = require('./BookRequest');
const Vote = require('./Vote');
const Report = require('./Report');
const Chat = require('./Chat');
const Message = require('./Message');
const Notification = require('./Notification');
const SellerReview = require('./SellerReview');

module.exports = {
    User,
    Note,
    Book,
    BookRequest,
    Vote,
    Report,
    Chat,
    Message,
    Notification,
    SellerReview
};
