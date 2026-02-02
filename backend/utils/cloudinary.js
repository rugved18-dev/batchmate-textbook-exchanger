const cloudinary = require('cloudinary').v2;
const { AppError } = require('../middleware/errorHandler');

/**
 * Cloudinary Configuration and Utilities
 * Handles file uploads to Cloudinary (PDFs and images only)
 */

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload PDF note to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<object>} Upload result with URL and public ID
 */
const uploadNotePDF = async (filePath, folder = 'notes') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: `batchmate/${folder}`,
            resource_type: 'auto',
            format: 'pdf',
            // Generate thumbnail for preview
            eager: [
                {
                    width: 400,
                    height: 600,
                    crop: 'fill',
                    format: 'jpg',
                    page: 1 // First page thumbnail
                }
            ],
            eager_async: false
        });

        return {
            fileUrl: result.secure_url,
            filePublicId: result.public_id,
            thumbnailUrl: result.eager && result.eager[0] ? result.eager[0].secure_url : result.secure_url,
            fileSize: result.bytes,
            pageCount: result.pages || 1
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new AppError('Failed to upload file to cloud storage', 500);
    }
};

/**
 * Upload book image to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<object>} Upload result with URL and public ID
 */
const uploadBookImage = async (filePath, folder = 'books') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: `batchmate/${folder}`,
            resource_type: 'image',
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });

        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new AppError('Failed to upload image to cloud storage', 500);
    }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Resource type ('image', 'raw', 'video')
 * @returns {Promise<object>} Deletion result
 */
const deleteFile = async (publicId, resourceType = 'raw') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new AppError('Failed to delete file from cloud storage', 500);
    }
};

/**
 * Delete multiple files from Cloudinary
 * @param {string[]} publicIds - Array of Cloudinary public IDs
 * @param {string} resourceType - Resource type
 * @returns {Promise<object>} Deletion result
 */
const deleteMultipleFiles = async (publicIds, resourceType = 'image') => {
    try {
        const result = await cloudinary.api.delete_resources(publicIds, {
            resource_type: resourceType
        });

        return result;
    } catch (error) {
        console.error('Cloudinary delete multiple error:', error);
        throw new AppError('Failed to delete files from cloud storage', 500);
    }
};

/**
 * Validate PDF file
 * @param {object} file - Multer file object
 * @returns {boolean} True if valid
 */
const validatePDF = (file) => {
    const allowedMimeTypes = ['application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new AppError('Only PDF files are allowed', 400);
    }

    if (file.size > maxSize) {
        throw new AppError('File size must be less than 10MB', 400);
    }

    return true;
};

/**
 * Validate image file
 * @param {object} file - Multer file object
 * @returns {boolean} True if valid
 */
const validateImage = (file) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new AppError('Only JPEG, PNG, and WebP images are allowed', 400);
    }

    if (file.size > maxSize) {
        throw new AppError('Image size must be less than 5MB', 400);
    }

    return true;
};

/**
 * Get PDF page count (estimated from file size)
 * This is a rough estimate; actual page count comes from Cloudinary
 * @param {number} fileSize - File size in bytes
 * @returns {number} Estimated page count
 */
const estimatePageCount = (fileSize) => {
    // Rough estimate: 50KB per page
    const avgPageSize = 50 * 1024;
    return Math.max(1, Math.floor(fileSize / avgPageSize));
};

module.exports = {
    cloudinary,
    uploadNotePDF,
    uploadBookImage,
    deleteFile,
    deleteMultipleFiles,
    validatePDF,
    validateImage,
    estimatePageCount
};
