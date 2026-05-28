const requiredEnv = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FRONTEND_URL'
];

const validateEnv = () => {
    const missing = requiredEnv.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:', missing.join(', '));
        process.exit(1);
    }

    const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
    process.env.NODE_ENV = ['development', 'production', 'test'].includes(nodeEnv) ? nodeEnv : 'development';

    process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d';
    process.env.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

    return {
        nodeEnv: process.env.NODE_ENV,
        port: Number(process.env.PORT),
        mongoUri: process.env.MONGODB_URI,
        frontendUrl: process.env.FRONTEND_URL,
        googleClientId: process.env.GOOGLE_CLIENT_ID
    };
};

module.exports = validateEnv;
