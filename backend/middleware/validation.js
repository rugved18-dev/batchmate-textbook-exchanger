const Joi = require('joi');

/**
 * Validation Middleware Factory
 * Validates request body, params, or query using Joi schemas
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false, // Return all errors
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Replace request data with validated data
        req[source] = value;
        next();
    };
};

/**
 * Validation Schemas
 */

// User validation
const userSchemas = {
    updateProfile: Joi.object({
        name: Joi.string().trim().max(100),
        department: Joi.string().valid(
            'Computer Science',
            'Electrical Engineering',
            'Mechanical Engineering',
            'Civil Engineering',
            'Electronics',
            'Information Technology',
            'Chemical Engineering',
            'Biotechnology',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Business Administration',
            'Economics',
            'Other'
        ),
        semester: Joi.number().integer().min(1).max(12)
    })
};

// Note validation
const noteSchemas = {
    create: Joi.object({
        title: Joi.string().trim().max(200).required(),
        description: Joi.string().trim().max(1000),
        subject: Joi.string().trim().max(100).required(),
        subjectCode: Joi.string().trim().uppercase().max(20),
        department: Joi.string().valid(
            'Computer Science',
            'Electrical Engineering',
            'Mechanical Engineering',
            'Civil Engineering',
            'Electronics',
            'Information Technology',
            'Chemical Engineering',
            'Biotechnology',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Business Administration',
            'Economics',
            'Other'
        ).required(),
        semester: Joi.number().integer().min(1).max(12).required(),
        confirmedHandwritten: Joi.boolean().valid(true).required()
            .messages({
                'any.only': 'You must confirm this is handwritten content'
            })
    }),

    filter: Joi.object({
        department: Joi.string(),
        semester: Joi.number().integer().min(1).max(12),
        subject: Joi.string(),
        sortBy: Joi.string().valid('recent', 'popular', 'downloads'),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(50).default(20)
    })
};

// Book validation
const bookSchemas = {
    create: Joi.object({
        title: Joi.string().trim().max(300).required(),
        author: Joi.string().trim().max(200),
        isbn: Joi.string().trim().max(20),
        edition: Joi.string().trim().max(50),
        publisher: Joi.string().trim().max(200),
        subjectCode: Joi.string().trim().uppercase().max(20).required(),
        subject: Joi.string().trim().max(100).required(),
        department: Joi.string().valid(
            'Computer Science',
            'Electrical Engineering',
            'Mechanical Engineering',
            'Civil Engineering',
            'Electronics',
            'Information Technology',
            'Chemical Engineering',
            'Biotechnology',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Business Administration',
            'Economics',
            'Other'
        ).required(),
        semester: Joi.number().integer().min(1).max(12).required(),
        mrp: Joi.number().min(0).required(),
        finalPrice: Joi.number().min(0).required(),
        isNegotiable: Joi.boolean().default(true),
        condition: Joi.string().valid('Like New', 'Good', 'Fair', 'Acceptable').required(),
        conditionNotes: Joi.string().trim().max(500),
        preferredMeetupLocations: Joi.array().items(Joi.string().trim().max(100)).max(5)
    }),

    update: Joi.object({
        finalPrice: Joi.number().min(0),
        isNegotiable: Joi.boolean(),
        condition: Joi.string().valid('Like New', 'Good', 'Fair', 'Acceptable'),
        conditionNotes: Joi.string().trim().max(500),
        preferredMeetupLocations: Joi.array().items(Joi.string().trim().max(100)).max(5),
        status: Joi.string().valid('available', 'reserved', 'sold', 'removed')
    }),

    filter: Joi.object({
        department: Joi.string(),
        semester: Joi.number().integer().min(1).max(12),
        subject: Joi.string(),
        condition: Joi.string().valid('Like New', 'Good', 'Fair', 'Acceptable'),
        minPrice: Joi.number().min(0),
        maxPrice: Joi.number().min(0),
        sortBy: Joi.string().valid('recent', 'price_low', 'price_high'),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(50).default(20)
    })
};

// Book request validation
const bookRequestSchemas = {
    create: Joi.object({
        title: Joi.string().trim().max(300).required(),
        author: Joi.string().trim().max(200),
        subjectCode: Joi.string().trim().uppercase().max(20).required(),
        subject: Joi.string().trim().max(100).required(),
        department: Joi.string().required(),
        semester: Joi.number().integer().min(1).max(12).required(),
        maxBudget: Joi.number().min(0).required(),
        notes: Joi.string().trim().max(500)
    })
};

// Vote validation
const voteSchemas = {
    create: Joi.object({
        noteId: Joi.string().required(),
        voteType: Joi.string().valid('upvote', 'downvote').required()
    })
};

// Report validation
const reportSchemas = {
    create: Joi.object({
        targetType: Joi.string().valid('Note', 'Book', 'User').required(),
        targetId: Joi.string().required(),
        reason: Joi.string().valid(
            'spam',
            'inappropriate_content',
            'copyright_violation',
            'fake_upload',
            'harassment',
            'scam',
            'duplicate',
            'other'
        ).required(),
        description: Joi.string().trim().max(1000).required()
    }),

    review: Joi.object({
        status: Joi.string().valid('resolved', 'dismissed').required(),
        moderatorNotes: Joi.string().trim().max(1000),
        actionTaken: Joi.string().valid(
            'none',
            'content_hidden',
            'content_removed',
            'user_warned',
            'user_blocked'
        ).required()
    })
};

// Message validation
const messageSchemas = {
    create: Joi.object({
        chatId: Joi.string().required(),
        content: Joi.string().trim().max(1000).required(),
        isTemplate: Joi.boolean().default(false),
        templateType: Joi.string().valid(
            'greeting',
            'interested',
            'price_inquiry',
            'meetup_request',
            'availability_check',
            'thank_you',
            'custom'
        ).default('custom')
    })
};

module.exports = {
    validate,
    userSchemas,
    noteSchemas,
    bookSchemas,
    bookRequestSchemas,
    voteSchemas,
    reportSchemas,
    messageSchemas
};
