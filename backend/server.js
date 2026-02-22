require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');



// Import routes
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const bookRoutes = require('./routes/books');
const chatRoutes = require('./routes/chat');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize MongoDB queries
app.use(mongoSanitize());

// Compression
app.use(compression());

// Logging (dev only)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate limiting for API routes
app.use('/api/', generalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Health check / Keep-alive endpoint (for free hosting)
app.get('/api/ping', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Batchmate API is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Batchmate Textbook Exchanger API',
        version: '1.0.0',
        documentation: '/api/docs'
    });
});

// Error Handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════════╗
  ║   🎓 Batchmate API Server                  ║
  ╠════════════════════════════════════════════╣
  ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(23)}   ║
  ║   Port: ${String(PORT).padEnd(30)}   ║
  ║   URL: http://localhost:${String(PORT).padEnd(18)}   ║
  ╚════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

module.exports = app;
