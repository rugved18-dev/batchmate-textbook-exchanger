require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
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
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');

// Initialize Express app
const app = express();

// Create HTTP server (required for Socket.io)
const server = http.createServer(app);

// Initialize Socket.io on the HTTP server
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000
});

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

// Expose Socket.io instance to all route handlers via req.io
// Usage in any controller: req.io  →  const { createNotification } = require('./notificationHelper'); createNotification(req.io, ...)
app.use((req, _res, next) => { req.io = io; next(); });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
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
        realtime: 'Socket.io enabled'
    });
});

// Error Handlers
app.use(notFound);
app.use(errorHandler);

// ─── Socket.io Real-Time Logic ───────────────────────────────────────────────

// Track online users: Map<userId, socketId>
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User comes online — join their personal room for DMs/notifications
    socket.on('setup', (userData) => {
        if (!userData?._id) return;
        socket.join(userData._id);
        onlineUsers.set(userData._id, socket.id);
        socket.emit('connected');
        // Broadcast online status
        socket.broadcast.emit('user_online', userData._id);
        console.log(`👤 User ${userData._id} is online`);
    });

    // User opens a specific chat conversation
    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`💬 Socket ${socket.id} joined chat: ${chatId}`);
    });

    // User leaves a chat room (navigates away)
    socket.on('leave_chat', (chatId) => {
        socket.leave(chatId);
        console.log(`🚶 Socket ${socket.id} left chat: ${chatId}`);
    });

    // New message — relay to all participants in the chat room
    socket.on('new_message', (messageData) => {
        const { chatId, message, participants } = messageData;
        if (!chatId || !message) return;

        // Emit to the chat room (all devices of all participants except sender)
        socket.to(chatId).emit('message_received', message);

        // Also emit to each participant's personal room for notification badge update
        if (Array.isArray(participants)) {
            participants.forEach((participantId) => {
                if (participantId !== message.sender?._id) {
                    socket.to(participantId).emit('unread_count_update', { chatId });
                }
            });
        }
    });

    // Typing indicator — forward to other users in the chat
    socket.on('typing', ({ chatId, userId, userName }) => {
        socket.to(chatId).emit('typing', { userId, userName });
    });

    socket.on('stop_typing', ({ chatId, userId }) => {
        socket.to(chatId).emit('stop_typing', { userId });
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
        // Remove from online users map
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                socket.broadcast.emit('user_offline', userId);
                console.log(`👤 User ${userId} went offline`);
                break;
            }
        }
        console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

// Start server (MUST use `server.listen`, not `app.listen`, for Socket.io)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════════╗
  ║   🎓 Batchmate API + WebSocket Server      ║
  ╠════════════════════════════════════════════╣
  ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(23)}   ║
  ║   Port: ${String(PORT).padEnd(30)}   ║
  ║   URL: http://localhost:${String(PORT).padEnd(18)}   ║
  ║   Socket.io: ✅ Enabled                    ║
  ╚════════════════════════════════════════════╝
  `);

    // ── Grok API key validation (fires once on startup, non-blocking) ─────────
    checkGrokApiKey();
});

/**
 * Sends a single-token "ping" to xAI Grok to verify the API key is valid.
 * Prints ✅ or ❌ to the terminal — never throws or crashes the server.
 */
async function checkGrokApiKey() {
    const apiKey = process.env.GROK_API_KEY;

    if (!apiKey || apiKey === 'your_grok_api_key_here') {
        console.log('  🤖 Grok API: ⚠️  GROK_API_KEY not set (add it to .env to enable Grok features)');
        return;
    }

    try {
        const OpenAI = require('openai');
        const client = new OpenAI({
            apiKey,
            baseURL: 'https://api.x.ai/v1',   // xAI's OpenAI-compatible endpoint
        });

        const response = await client.chat.completions.create({
            model: 'grok-2-1212',
            messages: [{ role: 'user', content: 'Reply with exactly the word PONG and nothing else.' }],
            max_tokens: 5,
        });

        const reply = response.choices[0]?.message?.content?.trim() || '';
        console.log(`  🤖 Grok API: ✅ Key is working! Model replied → "${reply}"`);
    } catch (err) {
        const hint = err?.status === 401
            ? 'Invalid API key — check GROK_API_KEY in .env'
            : err?.message || 'Unknown error';
        console.error(`  🤖 Grok API: ❌ Key check failed — ${hint}`);
    }
}

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