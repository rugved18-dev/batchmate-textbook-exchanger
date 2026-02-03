# 🎓 Batchmate - Complete Project Context

**Last Updated:** February 2, 2026  
**Project Status:** MVP Ready - Backend Complete (100%), Frontend Complete (100%)  
**Current Focus:** Google OAuth Registration Flow Implementation

---

## 📋 Executive Summary

Batchmate is a **full-stack campus marketplace platform** where college students can:
- **Share handwritten notes** with automatic handwriting verification
- **Buy/sell textbooks** with smart pricing suggestions (40-60% of MRP)
- **Chat safely** between buyers and sellers
- **Build reputation** through upvotes, verified transactions, and moderation

The platform uses **Google OAuth for authentication** (college email only: `.edu` and `.ac.in` domains), enforces role-based access control (User, Moderator, Admin), and includes comprehensive moderation and reporting systems.

---

## 🏗️ Architecture Overview

### **Tech Stack**

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | SPA with client-side routing, real-time updates |
| **Backend** | Node.js + Express.js | RESTful API, JWT auth, middleware stack |
| **Database** | MongoDB + Mongoose | Document-based storage with relational patterns |
| **Styling** | Tailwind CSS + Custom CSS | Dark theme, glassmorphism, responsive design |
| **Authentication** | Google OAuth 2.0 | College email verification, JWT tokens |
| **File Storage** | Cloudinary | Images and PDF storage with CDN |
| **Rate Limiting** | Express-rate-limit | Endpoint-specific rate limits |
| **Validation** | Joi | Request schema validation |

### **System Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER (React)                  │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │   Landing    │   Dashboard  │   Auth Flow  │             │
│  └──────────────┴──────────────┴──────────────┘             │
│           │                          │                      │
│           └──────────────┬───────────┘                      │
│                          │                                  │
│                   Google OAuth Dialog                       │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
         ┌─────────────────────────────────────┐
         │   Google OAuth Verification        │
         │   (College Email Validation)       │
         └─────────────────────────────────────┘
                           │
         ┌─────────────────────────────────────┐
         │   JWT Token Generation             │
         │   (Access + Refresh Tokens)        │
         └─────────────────────────────────────┘
                           │
         ┌─────────────────────────────────────┐
         │   Express API Server (Node.js)     │
         │   ┌─────────────────────────────┐  │
         │   │  Routes & Controllers       │  │
         │   │  - Auth, Notes, Books       │  │
         │   │  - Chat, Users, Reports     │  │
         │   └─────────────────────────────┘  │
         │   ┌─────────────────────────────┐  │
         │   │  Middleware Stack           │  │
         │   │  - Auth, RBAC, Validation   │  │
         │   │  - Rate Limiting, Errors    │  │
         │   └─────────────────────────────┘  │
         └─────────────────────────────────────┘
                           │
         ┌─────────────────────────────────────┐
         │   MongoDB (Document Database)      │
         │   ┌──────────────────────────────┐ │
         │   │ Users, Notes, Books, Chats   │ │
         │   │ Reports, Votes, Messages     │ │
         │   └──────────────────────────────┘ │
         └─────────────────────────────────────┘
                           │
         ┌─────────────────────────────────────┐
         │   Cloudinary (File Storage)         │
         │   - PDF Notes, Book Images         │
         └─────────────────────────────────────┘
```

---

## 📁 Project Structure (Detailed)

### **Frontend Structure**
```
frontend/
├── public/                      # Static assets
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Layout.jsx          # Main page wrapper with navbar
│   │   ├── Navbar.jsx          # Navigation + profile dropdown
│   │   ├── NoteCard.jsx        # Note preview card
│   │   ├── BookCard.jsx        # Book listing card
│   │   ├── FilterSidebar.jsx   # Department/semester filters
│   │   ├── EmptyState.jsx      # No data state
│   │   ├── LoadingSpinner.jsx  # Loading indicator
│   │   └── Chat/               # Chat components
│   │
│   ├── pages/                   # Full page components
│   │   ├── Landing.jsx         # Hero page
│   │   ├── Login.jsx           # Google OAuth login
│   │   ├── CompleteRegistration.jsx  # Post-OAuth form
│   │   ├── Dashboard.jsx       # Stats & overview
│   │   ├── Notes.jsx           # Notes list with filters
│   │   ├── NoteDetail.jsx      # Single note view
│   │   ├── UploadNote.jsx      # Note submission form
│   │   ├── Books.jsx           # Books list with filters
│   │   ├── BookDetail.jsx      # Single book view
│   │   ├── ListBook.jsx        # Book listing form
│   │   ├── Chat.jsx            # Messaging interface
│   │   ├── Profile.jsx         # User profile page
│   │   └── NotFound.jsx        # 404 page
│   │
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication state (login, logout, user info)
│   │
│   ├── utils/
│   │   ├── api.js              # Axios instance with auth headers & interceptors
│   │   └── helpers.js          # Constants (departments, semesters, conditions)
│   │
│   ├── styles/
│   │   └── index.css           # Global CSS + Tailwind
│   │
│   ├── App.jsx                 # Main router & protected routes
│   ├── main.jsx                # React entry point
│   └── index.html              # HTML template
│
├── package.json                # Frontend dependencies
├── vite.config.js              # Vite build config with API proxy
├── tailwind.config.js          # Tailwind customization
├── postcss.config.js           # PostCSS config
├── .env                        # Frontend environment (GOOGLE_CLIENT_ID)
├── .gitignore                  # Git ignore rules
└── README.md                   # Frontend-specific setup (if exists)
```

### **Backend Structure**
```
backend/
├── config/
│   └── database.js             # MongoDB Atlas connection setup
│
├── models/                      # Mongoose schemas
│   ├── User.js                 # Users (email, reputation, roles)
│   ├── Note.js                 # Notes (handwritten verification, votes, rewards)
│   ├── Book.js                 # Books (pricing, images, conditions)
│   ├── BookRequest.js          # Book requests (cold start)
│   ├── Vote.js                 # Note upvotes/downvotes (dedup)
│   ├── Report.js               # Reports (polymorphic: note/book/user)
│   ├── Chat.js                 # Chat conversations (2-person)
│   └── Message.js              # Messages (templates, read status)
│
├── controllers/                 # Business logic (request handlers)
│   ├── index.js                # Controller exports
│   ├── authController.js       # OAuth, registration, JWT refresh, logout
│   ├── noteController.js       # Upload, voting, rewards, delete, filters
│   ├── bookController.js       # Listing, pricing, images, requests, filters
│   ├── chatController.js       # Messages, templates, blocking, unread
│   ├── reportController.js     # Report creation & moderation
│   └── userController.js       # Profiles, reputation, leaderboard, admin
│
├── routes/                      # API route definitions
│   ├── index.js                # Route aggregator
│   ├── auth.js                 # Auth endpoints (google, complete-registration, refresh, me, logout)
│   ├── notes.js                # Note endpoints (CRUD, voting, download, filters)
│   ├── books.js                # Book endpoints (CRUD, requests, filters)
│   ├── chat.js                 # Chat endpoints (conversations, messages, blocking)
│   ├── reports.js              # Report endpoints (create, list, review, stats)
│   └── users.js                # User endpoints (profile, leaderboard, blocking)
│
├── middleware/                  # Express middleware
│   ├── auth.js                 # JWT verification & token validation
│   ├── rbac.js                 # Role-based access control (user/moderator/admin)
│   ├── rateLimiter.js          # Endpoint rate limiting
│   ├── validation.js           # Request validation (Joi schemas)
│   ├── errorHandler.js         # Global error handling wrapper
│   └── upload.js               # Multer file upload config for PDFs & images
│
├── utils/
│   ├── cloudinary.js           # Cloudinary SDK integration for uploads
│   └── jwt.js                  # JWT token generation/verification
│
├── scripts/
│   └── seed.js                 # Sample data for development/testing
│
├── server.js                   # Express server entry point
├── .env                        # Backend environment variables
├── package.json                # Backend dependencies
├── .gitignore                  # Git ignore rules
└── README.md                   # Backend-specific setup (if exists)
```

---

## 🔐 Authentication Flow (Frontend → Backend)

### **Google OAuth Registration Flow**

**Frontend Flow (Login.jsx → CompleteRegistration.jsx):**
```
1. User clicks "Sign in with Google" button
   ↓
2. Google OAuth Dialog opens
   - User selects college email (e.g., user@college.edu)
   ↓
3. Frontend receives googleIdToken from OAuth response
   ↓
4. Frontend sends POST /api/auth/google
   Payload: { credential: googleIdToken, campus: "..." }
   ↓
5. Backend verifies with Google, checks college email domain
   ↓
6. If NEW USER → Return HTTP 206 with requiresAdditionalInfo: true
   If EXISTING USER → Jump to step 10 (generate tokens)
   ↓
7. Frontend navigates to /complete-registration
   - Displays form: Department, Semester, Campus
   - Shows user info: name, email, picture
   ↓
8. User fills form and submits
   Frontend sends: POST /api/auth/complete-registration
   Payload: {
     credential: googleIdToken,
     department: "Computer Science",
     semester: 4,
     campus: "Main Campus"
   }
   ↓
9. Backend verifies token again, validates all fields
   ↓
10. Backend creates/updates User record in MongoDB
    - googleId, email, name, picture
    - department, semester, campus
    - role: 'user', reputation: 0, verified: true
    ↓
11. Generate JWT tokens
    - accessToken (7 days)
    - refreshToken (for renewal)
    ↓
12. Frontend stores tokens in localStorage
    - Sets AuthContext (login state)
    - Redirects to /dashboard
```

**Key Implementation Files:**
- **Frontend**: `src/pages/Login.jsx`, `src/pages/CompleteRegistration.jsx`, `src/context/AuthContext.jsx`
- **Backend**: `controllers/authController.js` (googleLogin, completeRegistration, refresh functions)
- **Middleware**: `middleware/auth.js` (JWT verification on protected routes)

---

## 🗄️ Database Schema (MongoDB Collections)

### **User Collection**
```javascript
{
  _id: ObjectId,
  googleId: String,              // Unique Google OAuth ID
  email: String,                 // College email (unique)
  name: String,                  // Full name from OAuth
  picture: String,               // Google profile picture URL
  department: String,            // CS, ECE, Mechanical, etc.
  semester: Number,              // 1-8
  campus: String,                // Campus name
  role: String,                  // 'user', 'moderator', 'admin' (default: 'user')
  reputation: Number,            // Karma points (default: 0)
  blockedUsers: [ObjectId],      // Users blocked by this user
  blockedByUsers: [ObjectId],    // Users who blocked this user
  verified: Boolean,             // Email verified (auto: true for Google OAuth)
  createdAt: Date,
  updatedAt: Date
}
```

### **Note Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  subject: String,
  uploader: ObjectId,            // References User._id
  fileUrl: String,               // Cloudinary PDF URL
  thumbnailUrl: String,          // Preview thumbnail URL
  department: String,            // Course department
  semester: Number,              // Course semester
  handwrittenVerified: Boolean,  // Manual moderation flag
  upvotes: Number,               // Total upvote count
  downvotes: Number,             // Total downvote count
  downloadCount: Number,         // Total downloads
  reward: Number,                // Points awarded (0 until threshold met)
  status: String,                // 'active', 'hidden' (hidden if score <= -5)
  reportCount: Number,           // Auto-hidden if >= 3
  createdAt: Date,
  updatedAt: Date
}
```

### **Book Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  author: String,
  mrp: Number,                   // Original price
  sellingPrice: Number,          // Auto-suggested: 40-60% of MRP
  isbn: String,
  condition: String,             // 'Like New', 'Good', 'Fair', 'Acceptable'
  images: [String],              // Cloudinary URLs (multiple)
  seller: ObjectId,              // References User._id
  department: String,            // Course department
  semester: Number,              // Course semester
  meetupLocations: [String],     // Preferred meeting spots
  isAvailable: Boolean,          // True if not sold
  status: String,                // 'active', 'sold', 'hidden'
  reportCount: Number,           // Auto-hidden if >= 3
  createdAt: Date,
  updatedAt: Date
}
```

### **Chat Collection**
```javascript
{
  _id: ObjectId,
  participants: [ObjectId, ObjectId],  // Exactly 2 users (buyer & seller)
  messages: [ObjectId],                 // References Message collection
  blockedBy: [ObjectId],                // Users who blocked in this chat
  lastMessage: {
    text: String,
    sender: ObjectId,
    timestamp: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **Message Collection**
```javascript
{
  _id: ObjectId,
  chat: ObjectId,                // References Chat._id
  sender: ObjectId,              // References User._id
  receiver: ObjectId,            // References User._id
  text: String,                  // Message content
  template: String,              // Pre-defined template (optional)
  readAt: Date,                  // Null if unread
  deletedFor: [ObjectId],        // Users who deleted message locally
  createdAt: Date
}
```

### **Vote Collection**
```javascript
{
  _id: ObjectId,
  note: ObjectId,                // References Note._id
  user: ObjectId,                // References User._id
  type: String,                  // 'upvote' or 'downvote'
  createdAt: Date
  // Compound index on (note, user, type) ensures one vote per user per note
}
```

### **Report Collection**
```javascript
{
  _id: ObjectId,
  reporter: ObjectId,            // References User._id (who reported)
  reportedItem: ObjectId,        // Can be Note, Book, or User ID
  itemType: String,              // 'Note', 'Book', or 'User'
  reason: String,                // Report category (Spam, Offensive, etc.)
  description: String,           // Detailed reason
  status: String,                // 'pending', 'reviewed', 'resolved', 'dismissed'
  action: String,                // Admin action taken
  createdAt: Date,
  updatedAt: Date
}
```

### **BookRequest Collection**
```javascript
{
  _id: ObjectId,
  requester: ObjectId,           // References User._id
  bookTitle: String,             // Book they're looking for
  author: String,                // Author (optional)
  department: String,            // Department
  semester: Number,              // Semester
  status: String,                // 'pending', 'fulfilled', 'cancelled'
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔗 Complete API Reference

### **Authentication Endpoints** (`/api/auth`)
```
POST /api/auth/google
  Purpose: Initial Google OAuth login
  Auth: ❌ Not required
  Payload: { credential: googleIdToken, campus: "..." }
  Response: 
    - NEW USER: HTTP 206 { requiresAdditionalInfo: true, userData: {...} }
    - EXISTING: HTTP 200 { user: {...}, tokens: { accessToken, refreshToken } }

POST /api/auth/complete-registration
  Purpose: Submit department/semester form after OAuth
  Auth: ❌ Not required
  Payload: {
    credential: googleIdToken,
    department: "Computer Science",
    semester: 4,
    campus: "Main Campus"
  }
  Response: HTTP 200 { user: {...}, tokens: { accessToken, refreshToken } }

POST /api/auth/refresh
  Purpose: Refresh expired access token
  Auth: ❌ Not required
  Payload: { refreshToken: "..." }
  Response: HTTP 200 { accessToken: "...", refreshToken: "..." }

GET /api/auth/me
  Purpose: Get current authenticated user
  Auth: ✅ Required (Bearer token)
  Response: HTTP 200 { user: {...} }

POST /api/auth/logout
  Purpose: Logout (invalidate refresh token)
  Auth: ✅ Required
  Response: HTTP 200 { message: "Logged out" }
```

### **Notes Endpoints** (`/api/notes`)
```
GET /api/notes
  Purpose: List all notes with filters
  Auth: ❌ Not required
  Query: ?department=CS&semester=4&sort=latest&page=1&limit=20
  Response: HTTP 200 { notes: [...], total: 150, pages: 8 }

GET /api/notes/:id
  Purpose: Get single note details
  Auth: ❌ Not required
  Response: HTTP 200 { note: {...}, uploader: {...} }

POST /api/notes
  Purpose: Upload new note
  Auth: ✅ Required
  Payload: FormData { title, description, subject, department, semester, file (PDF) }
  Response: HTTP 201 { note: {...}, fileUrl: "cloudinary.../pdf" }

PUT /api/notes/:id
  Purpose: Update note (uploader only)
  Auth: ✅ Required
  Payload: { title, description, subject, department, semester }
  Response: HTTP 200 { note: {...} }

DELETE /api/notes/:id
  Purpose: Delete note (uploader/moderator/admin)
  Auth: ✅ Required
  Response: HTTP 200 { message: "Note deleted" }

POST /api/notes/:id/upvote
  Purpose: Upvote note
  Auth: ✅ Required
  Response: HTTP 200 { upvotes: 15, downvotes: 2, userVote: 'upvote' }

POST /api/notes/:id/downvote
  Purpose: Downvote note
  Auth: ✅ Required
  Response: HTTP 200 { upvotes: 15, downvotes: 3, userVote: 'downvote' }

GET /api/notes/:id/download
  Purpose: Download PDF & increment counter
  Auth: ✅ Required
  Response: HTTP 200 Redirect to Cloudinary PDF URL
```

### **Books Endpoints** (`/api/books`)
```
GET /api/books
  Purpose: List all books with filters
  Auth: ❌ Not required
  Query: ?department=CS&semester=4&condition=Good&minPrice=100&maxPrice=500&sort=latest
  Response: HTTP 200 { books: [...], total: 250, pages: 13 }

GET /api/books/:id
  Purpose: Get book details & images
  Auth: ❌ Not required
  Response: HTTP 200 { book: {...}, seller: {...}, images: [...] }

POST /api/books
  Purpose: List book for sale
  Auth: ✅ Required
  Payload: FormData { title, author, mrp, condition, department, semester, meetupLocations, images[] }
  Response: HTTP 201 { book: {...}, sellingPrice: 250, images: [...] }

PUT /api/books/:id
  Purpose: Update book (seller only)
  Auth: ✅ Required
  Payload: { condition, sellingPrice, meetupLocations, images[] }
  Response: HTTP 200 { book: {...} }

DELETE /api/books/:id
  Purpose: Delete listing (seller/moderator/admin)
  Auth: ✅ Required
  Response: HTTP 200 { message: "Book listing deleted" }

POST /api/books/:id/request
  Purpose: Request book (cold start feature)
  Auth: ✅ Required
  Payload: { bookTitle, author, department, semester }
  Response: HTTP 201 { request: {...} }

GET /api/books/requests/pending
  Purpose: Get pending requests for user's books
  Auth: ✅ Required
  Response: HTTP 200 { requests: [...] }
```

### **Chat Endpoints** (`/api/chat`)
```
GET /api/chat
  Purpose: Get user's conversations
  Auth: ✅ Required
  Response: HTTP 200 { chats: [...] }

GET /api/chat/:id/messages
  Purpose: Get messages in conversation
  Auth: ✅ Required
  Query: ?skip=0&limit=50
  Response: HTTP 200 { messages: [...], total: 150 }

POST /api/chat/:id/messages
  Purpose: Send message (with optional template)
  Auth: ✅ Required
  Payload: { text: "...", template: "is_available" } OR { text: "..." }
  Response: HTTP 201 { message: {...}, readAt: null }

POST /api/chat/:id/block
  Purpose: Block user in chat
  Auth: ✅ Required
  Response: HTTP 200 { message: "User blocked" }

GET /api/chat/unread-count
  Purpose: Get total unread messages count
  Auth: ✅ Required
  Response: HTTP 200 { unreadCount: 5 }
```

### **Reports Endpoints** (`/api/reports`)
```
POST /api/reports
  Purpose: Create report (note/book/user)
  Auth: ✅ Required
  Payload: { reportedItem: "...", itemType: "Note|Book|User", reason: "...", description: "..." }
  Response: HTTP 201 { report: {...} }

GET /api/reports
  Purpose: List reports (moderator+ only)
  Auth: ✅ Required + Role check
  Query: ?status=pending&itemType=Note&sort=-createdAt
  Response: HTTP 200 { reports: [...], total: 45 }

PUT /api/reports/:id
  Purpose: Review report & take action (moderator+ only)
  Auth: ✅ Required + Role check
  Payload: { status: "resolved", action: "delete" OR "dismiss" OR "warn" }
  Response: HTTP 200 { report: {...} }

GET /api/reports/statistics
  Purpose: Report statistics (admin only)
  Auth: ✅ Required + Admin role
  Response: HTTP 200 { totalReports: 150, byType: {...}, byStatus: {...} }
```

### **Users Endpoints** (`/api/users`)
```
GET /api/users/:id
  Purpose: Get user profile & stats
  Auth: ❌ Not required
  Response: HTTP 200 { user: {...}, notesCount: 5, booksCount: 3, reputation: 45 }

PUT /api/users/profile
  Purpose: Update own profile
  Auth: ✅ Required
  Payload: { name, picture, department, semester, campus }
  Response: HTTP 200 { user: {...} }

GET /api/users/leaderboard
  Purpose: Top reputation users
  Auth: ❌ Not required
  Query: ?limit=100&page=1
  Response: HTTP 200 { users: [...], total: 500 }

POST /api/users/:id/block
  Purpose: Block user (prevent chat & messaging)
  Auth: ✅ Required
  Response: HTTP 200 { message: "User blocked" }

GET /api/users/:id/notes
  Purpose: Get user's uploaded notes
  Auth: ❌ Not required
  Query: ?page=1&limit=20
  Response: HTTP 200 { notes: [...], total: 8 }

GET /api/users/:id/books
  Purpose: Get user's books for sale
  Auth: ❌ Not required
  Query: ?page=1&limit=20
  Response: HTTP 200 { books: [...], total: 5 }
```

---

## 🎯 Key Frontend Components & Pages

### **Protected Route Wrapper**
- **Location**: `src/pages/Layout.jsx` or `src/App.jsx`
- **Purpose**: Wraps all authenticated pages, checks AuthContext
- **Behavior**: Redirects to Login if not authenticated

### **Navigation & Authentication**
- **Navbar.jsx**: User menu, logout button, navigation links
- **AuthContext.jsx**: Manages login state, tokens, user data
- **api.js**: Axios interceptor that:
  - Adds Authorization header to all requests
  - Catches 401 errors and refreshes token
  - Redirects to login if refresh fails

### **Notes Module (Frontend)**
- **Notes.jsx**: List with filters (department, semester, sort)
- **NoteDetail.jsx**: Single note view, voting buttons, PDF viewer
- **UploadNote.jsx**: Form to submit note with file upload

### **Books Module (Frontend)**
- **Books.jsx**: List with filters (price range, condition, semester)
- **BookDetail.jsx**: Book info, contact seller, request button
- **ListBook.jsx**: Form to sell book with multi-image upload

### **Chat Module (Frontend)**
- **Chat.jsx**: Conversation list, message thread, message input
- **Message templates**: "Is this still available?", "Can we meet today?" etc.

### **Profile Module (Frontend)**
- **Profile.jsx**: User info, notes tab, books tab, reputation display

---

## 🚀 Environment Configuration

### **Frontend (.env)**
```dotenv
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
# VITE_API_URL is optional, defaults to /api via Vite proxy
```

### **Backend (.env)**
```dotenv
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/batchmate?retryWrites=true&w=majority

JWT_SECRET=your_super_secret_key_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_change_in_production
JWT_EXPIRE=7d

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**⚠️ CRITICAL**: Frontend `VITE_GOOGLE_CLIENT_ID` MUST match backend `GOOGLE_CLIENT_ID`

---

## 🔄 Data Flow Examples

### **Upload Note Flow**
```
Frontend (UploadNote.jsx)
  ↓ FormData { title, description, file }
  ↓ POST /api/notes (with Bearer token)
  ↓
Backend (noteController.uploadNote)
  ↓ Validate input with Joi
  ↓ Upload file to Cloudinary
  ↓ Generate thumbnail
  ↓ Create Note document in MongoDB
  ↓ Set handwrittenVerified: false (pending moderator review)
  ↓
Frontend receives Note object
  ↓ Show success toast
  ↓ Redirect to Notes page
```

### **Vote on Note Flow**
```
Frontend (NoteDetail.jsx)
  ↓ User clicks upvote button
  ↓ POST /api/notes/:id/upvote (with Bearer token)
  ↓
Backend (noteController.upvoteNote)
  ↓ Check if user already voted (Vote collection)
  ↓ If yes → update vote type (or remove)
  ↓ If no → create new Vote document
  ↓ Recalculate Note.upvotes & Note.downvotes
  ↓ Check if reward threshold met (3 upvotes OR 1 download + 2 upvotes)
  ↓ If met → Award 5 reputation points, set reward flag
  ↓
Frontend receives updated vote counts
  ↓ Update UI in real-time
```

### **Send Message Flow**
```
Frontend (Chat.jsx)
  ↓ User types message & clicks send
  ↓ POST /api/chat/:chatId/messages (with Bearer token)
  ↓
Backend (chatController.sendMessage)
  ↓ Validate sender/receiver are chat participants
  ↓ Check if either user is blocked
  ↓ Check rate limiting (30 msgs/hour for new users)
  ↓ Create Message document in MongoDB
  ↓ Update Chat.lastMessage
  ↓ Emit WebSocket event (future: real-time update)
  ↓
Frontend receives Message object
  ↓ Add to messages list
  ↓ Scroll to bottom
  ↓ Clear input field
```

---

## 🛠️ Common Debugging Scenarios

### **Problem: "Invalid college email domain" error**
**Solution in PROJECT_CONTEXT:**
- Check backend `authController.js` googleLogin function
- Look for regex validation: `/(.edu|.ac.in)$/`
- Test with email ending in `.edu` or `.ac.in`
- Check error message in frontend toast notification

### **Problem: Registration form doesn't submit**
**Solution in PROJECT_CONTEXT:**
- Verify `CompleteRegistration.jsx` has all required fields
- Check `CompleteRegistration.jsx` validation before POST
- Ensure backend endpoint `/api/auth/complete-registration` exists
- Check browser console for API errors
- Verify JWT token is being passed correctly

### **Problem: Notes not uploading**
**Solution in PROJECT_CONTEXT:**
- Check `UploadNote.jsx` FormData construction
- Verify file is PDF type
- Check Cloudinary credentials in backend `.env`
- Look at `noteController.js` uploadNote function error handling
- Check file size limits in `backend/middleware/upload.js`

### **Problem: Can't see uploaded notes in Notes page**
**Solution in PROJECT_CONTEXT:**
- Check Notes.jsx fetch logic (GET /api/notes)
- Verify note status is 'active' (not 'hidden' or pending)
- Check MongoDB Note collection has documents
- Verify filters match uploaded note (department, semester)
- Check if note is hidden due to reports (reportCount >= 3)

### **Problem: Chat messages not sending**
**Solution in PROJECT_CONTEXT:**
- Verify both users are participants in Chat document
- Check if either user is blocked
- Look at rate limiting in `middleware/rateLimiter.js`
- Check Message.js model for required fields
- Verify WebSocket connection (if real-time enabled)

---

## 📋 Testing Checklist

**Authentication Flow:**
- ✅ Google login with college email works
- ✅ New user registration form displays correctly
- ✅ Department/semester dropdowns populate
- ✅ Existing user bypasses registration form
- ✅ Tokens stored in localStorage
- ✅ Token refresh works on 401 response

**Notes Module:**
- ✅ Upload PDF note successfully
- ✅ Note appears in Notes list
- ✅ Upvote/downvote buttons work
- ✅ Download increments counter
- ✅ Filters (dept, semester) work correctly
- ✅ Sorting (latest, most upvoted) works

**Books Module:**
- ✅ List book for sale with images
- ✅ Selling price calculated correctly (40-60% MRP)
- ✅ Book appears in Books list
- ✅ Request book feature works
- ✅ Condition dropdown shows all options
- ✅ Filters work correctly

**Chat Module:**
- ✅ Create chat between buyer & seller
- ✅ Send message successfully
- ✅ Message marked as read when opened
- ✅ Block user prevents messages
- ✅ Unread counter updates

**Moderation:**
- ✅ Report note/book/user
- ✅ Item auto-hides after 3 reports
- ✅ Moderator can review reports
- ✅ Reputation updates on actions

---

## 🎯 Quick Fix Reference

Use this PROJECT_CONTEXT with ChatGPT/Claude to fix common issues:

1. **Frontend Error** → Share `src/pages/` file path + error message
2. **Backend Error** → Share `controllers/` file path + error message + request payload
3. **Database Issue** → Share MongoDB error + model being used
4. **Authentication Error** → Share `.env` files (sanitize secrets) + error message
5. **API Endpoint Issue** → Share route file + controller function

---

**This file contains all frontend and backend details for debugging with AI tools.**  
**Last Updated:** February 2, 2026
