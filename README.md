# 🎓 Batchmate - Campus Textbook & Notes Exchange

A modern full-stack platform for college students to exchange textbooks and share handwritten notes with their campus community.

![Status](https://img.shields.io/badge/Status-MVP%20Ready-brightgreen)
![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Tech Stack](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![Tech Stack](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)
![Tech Stack](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)
![Auth](https://img.shields.io/badge/Auth-Google%20OAuth-4285F4?logo=google)
![Backend](https://img.shields.io/badge/Backend-100%25%20Complete-brightgreen)
![Frontend](https://img.shields.io/badge/Frontend-100%25%20Complete-brightgreen)

---

## 🎯 Project Overview

**Batchmate** is a campus-specific marketplace where students can:
- 📝 **Share Notes** - Upload handwritten class notes and earn reputation points
- 📚 **Exchange Books** - Buy/sell textbooks with smart pricing (40-60% of MRP)
- 💬 **Chat Safely** - Direct messaging between buyers and sellers
- 🏆 **Build Reputation** - Earn karma through contributions and helpful reviews
- 🛡️ **Moderate Together** - Community-driven content moderation

**Authentication**: Google OAuth (college email only - `.edu` or `.ac.in` domains)

---

## ✨ Key Features

### 📝 Notes Module
- Upload handwritten notes (PDF only)
- Mandatory handwritten confirmation
- Upvote/Downvote system
- Auto-hide notes with score <= -5
- Delayed reward points (3 upvotes OR 1 download = 5 pts)
- Preview thumbnails

### 📚 Book Exchange
- List textbooks with photos
- Automatic price suggestion (40-60% of MRP)
- Condition tracking (Like New, Good, Fair, Acceptable)
- Request a Book feature (cold start solution)
- Preferred meetup locations

### 💬 Safe Chat System
- Chat only between buyer & seller
- Predefined message templates
- Rate limiting for new users
- Block & report functionality

### 🛡️ Moderation
- Report notes, books, or users
- Auto-hide after 3 reports
- Community moderators (high reputation)
- Admin dashboard

### 🔐 Authentication & Registration
- **Google OAuth** - One-click sign-in with college email
- **Two-Stage Registration** - OAuth verification + Department/Semester form
- **JWT Sessions** - Access & refresh token system (7-day expiration)
- **Role-Based Access** - User, Moderator, Admin roles with escalating permissions
- **Same-Campus Community** - Connect with students in your college only

---

## 📁 Project Structure

```
Batchmate Textbook Exchanger/
├── backend/                 # Node.js + Express API
│   ├── config/              # Database configuration
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Auth, validation, rate limiting
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API endpoints
│   ├── scripts/             # Seed data
│   ├── utils/               # Cloudinary, JWT helpers
│   └── server.js            # Entry point
│
├── frontend/                # React + Tailwind CSS
│   ├── public/              # Static assets
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── context/         # Auth context
│       ├── pages/           # Page components
│       └── utils/           # API client, helpers
│
└── README.md
```

---

## � Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- [Google OAuth 2.0 Credentials](https://console.cloud.google.com/)
- [Cloudinary Account](https://cloudinary.com/) (for file storage)

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/batchmate.git
cd 'Batchmate Textbook Exchanger'
```

### Step 2: Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### Step 3: Configure Environment Variables

**Backend** (`backend/.env`):
```env
# Server
NODE_ENV=development
PORT=5000

# Database (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/batchmate?retryWrites=true&w=majority

# JWT Tokens (⚠️ Change these in production!)
JWT_SECRET=batchmate_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=batchmate_refresh_secret_key_change_in_production
JWT_EXPIRE=7d

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Cloudinary (for PDF & image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Frontend** (`frontend/.env`):
```env
# Must match backend GOOGLE_CLIENT_ID exactly!
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

⚠️ **CRITICAL**: Both `.env` files must have **identical** `GOOGLE_CLIENT_ID` values.

### Step 4: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
✅ Should show: `✅ MongoDB Connected` and `🎓 Batchmate API Server` on port 5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Should show: `VITE v5.x.x ready in XXX ms` on http://localhost:3000

### Step 5: Test the Application
1. Open http://localhost:3000 in your browser
2. Click "Sign in with Google"
3. Use a college email (ending in `.edu` or `.ac.in`)
4. Fill in Department, Semester, and Campus on the registration form
5. Should redirect to Dashboard ✅

---

## 📖 Authentication Flow (NEW)

### Google OAuth Registration Flow

```
Login Page
    ↓
User clicks "Sign in with Google"
    ↓
Google OAuth Dialog (college email selection)
    ↓
Backend verifies token & email domain (.edu or .ac.in)
    ↓
NEW USER? → Registration Form (Department, Semester, Campus)
    ↓
Submit Registration → Create User → JWT Tokens Generated
    ↓
Dashboard ✅
```

**Key Points:**
- ✅ College emails only (`.edu` or `.ac.in` domains)
- ✅ Two-stage registration for new users (OAuth + form)
- ✅ Auto-verified (no email confirmation needed)
- ✅ Immediate dashboard access after registration

**For Developers Sharing with AI:**  
See [PROJECT_CONTEXT_FOR_AI.md](PROJECT_CONTEXT_FOR_AI.md) for complete architecture details!

---

## 📁 Project Structure

```
Batchmate Textbook Exchanger/
│
├── 📂 backend/
│   ├── config/database.js           # MongoDB connection
│   ├── models/                      # Mongoose schemas (User, Note, Book, Chat, Report, etc)
│   ├── controllers/                 # Business logic (auth, notes, books, chat, users, reports)
│   ├── routes/                      # API endpoint definitions
│   ├── middleware/                  # Auth, RBAC, validation, rate limiting, error handling
│   ├── utils/cloudinary.js          # File upload integration
│   ├── .env                         # Environment configuration
│   ├── server.js                    # Entry point
│   └── package.json
│
├── 📂 frontend/
│   ├── src/
│   │   ├── components/              # Reusable UI components (Navbar, Cards, Sidebar, etc)
│   │   ├── pages/                   # Full pages (Login, Dashboard, Notes, Books, Chat, etc)
│   │   ├── context/AuthContext.jsx # Authentication state management
│   │   ├── utils/
│   │   │   ├── api.js              # Axios client with interceptors
│   │   │   └── helpers.js          # Constants & formatting functions
│   │   ├── App.jsx                 # Router & protected routes
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles + Tailwind
│   ├── public/                      # Static assets
│   ├── .env                         # Google Client ID configuration
│   ├── vite.config.js              # Vite build configuration
│   ├── tailwind.config.js          # Tailwind theme customization
│   └── package.json
│
├── 📄 README.md                     # This file
├── 📄 PROJECT_CONTEXT_FOR_AI.md    # **Complete project documentation for AI tools**
├── SETUP_GUIDE.md                  # Detailed setup instructions
├── IMPLEMENTATION_STATUS.md        # Feature completion checklist
└── GOOGLE_OAUTH_FIX.md            # OAuth troubleshooting guide
```

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/google` | ❌ | **NEW** - Google OAuth login |
| POST | `/api/auth/complete-registration` | ❌ | **NEW** - Submit department/semester form |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| GET | `/api/auth/me` | ✅ | Get current user info |
| POST | `/api/auth/logout` | ✅ | Logout user |

### Notes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notes` | ❌ | List notes with filters (department, semester, sort) |
| GET | `/api/notes/:id` | ❌ | Get single note details |
| POST | `/api/notes` | ✅ | Upload new note (PDF + metadata) |
| POST | `/api/notes/:id/upvote` | ✅ | Upvote note |
| POST | `/api/notes/:id/downvote` | ✅ | Downvote note |
| GET | `/api/notes/:id/download` | ✅ | Download PDF & increment counter |
| DELETE | `/api/notes/:id` | ✅ | Delete note (owner/moderator) |

### Books
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/books` | ❌ | List books with filters (price, condition, department) |
| GET | `/api/books/:id` | ❌ | Get book details & images |
| POST | `/api/books` | ✅ | List book for sale |
| PUT | `/api/books/:id` | ✅ | Update book details (seller only) |
| DELETE | `/api/books/:id` | ✅ | Delete listing (seller/moderator) |
| POST | `/api/books/:id/request` | ✅ | Request book (cold start feature) |
| GET | `/api/books/requests/pending` | ✅ | Get pending requests for user's books |

### Chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/chat` | ✅ | List user's conversations |
| GET | `/api/chat/:id/messages` | ✅ | Get messages in conversation |
| POST | `/api/chat/:id/messages` | ✅ | Send message (with optional template) |
| POST | `/api/chat/:id/block` | ✅ | Block user in chat |
| GET | `/api/chat/unread-count` | ✅ | Get total unread messages |

### Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reports` | ✅ | Report note/book/user |
| GET | `/api/reports` | ✅🔒 | List reports (moderator+) |
| PUT | `/api/reports/:id` | ✅🔒 | Review report & take action |
| GET | `/api/reports/stats` | ✅🔒 | Report statistics (admin) |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/:id` | ❌ | Get user profile & stats |
| PUT | `/api/users/profile` | ✅ | Update own profile |
| GET | `/api/users/leaderboard` | ❌ | Top reputation users |
| POST | `/api/users/:id/block` | ✅ | Block user |
| GET | `/api/users/:id/notes` | ❌ | User's uploaded notes |
| GET | `/api/users/:id/books` | ❌ | User's books for sale |

---

## 🎨 Frontend Pages & Components

### Pages (13 total)
- **Landing.jsx** - Hero page with features showcase
- **Login.jsx** - Google OAuth sign-in interface ⭐ NEW
- **CompleteRegistration.jsx** - Department/Semester form ⭐ NEW (Feb 2, 2026)
- **Dashboard.jsx** - Stats, popular notes, recent books overview
- **Notes.jsx** - Browse & filter notes
- **NoteDetail.jsx** - View single note, vote, download
- **UploadNote.jsx** - Submit new note
- **Books.jsx** - Browse & filter books
- **BookDetail.jsx** - View book, contact seller, request
- **ListBook.jsx** - Sell a textbook
- **Chat.jsx** - Messaging interface
- **Profile.jsx** - User profile & stats
- **NotFound.jsx** - 404 error page

### Reusable Components
- **Navbar** - Navigation + profile dropdown
- **NoteCard** - Note preview with stats
- **BookCard** - Book listing with discount badge
- **FilterSidebar** - Department, semester, price filters
- **LoadingSpinner** - Loading states
- **EmptyState** - No data states
- **Layout** - Main page wrapper

---

## 🗄️ Database Models (8 Collections)

### User
```javascript
{
  googleId: String,         // Unique OAuth ID
  email: String,            // College email (unique)
  name: String,             // Full name
  department: String,       // CS, ECE, Mechanical, etc
  semester: Number,         // 1-8
  campus: String,           // Campus name
  reputation: Number,       // Karma points
  role: String,             // user | moderator | admin
  blockedUsers: [ObjectId], // Users blocked by this user
  verified: Boolean,        // Auto-true for OAuth
  createdAt: Date
}
```

### Note
```javascript
{
  title: String,            // Note title
  uploader: ObjectId,       // References User
  fileUrl: String,          // Cloudinary PDF URL
  thumbnailUrl: String,     // Preview image
  department: String,       // Course department
  semester: Number,         // Course semester
  handwrittenVerified: Boolean,  // Moderation flag
  upvotes: Number,          // Upvote count
  downvotes: Number,        // Downvote count
  downloadCount: Number,    // Download counter
  reward: Number,           // Points awarded (5 pts after threshold)
  status: String,           // active | hidden
  reportCount: Number,      // Auto-hide at 3 reports
  createdAt: Date
}
```

### Book
```javascript
{
  title: String,            // Book title
  author: String,           // Author name
  mrp: Number,              // Original price
  sellingPrice: Number,     // 40-60% of MRP
  isbn: String,             // ISBN identifier
  condition: String,        // Like New | Good | Fair | Acceptable
  images: [String],         // Cloudinary URLs
  seller: ObjectId,         // References User
  department: String,       // Department
  semester: Number,         // Semester
  meetupLocations: [String],// Meeting spots
  isAvailable: Boolean,     // Not sold
  status: String,           // active | sold | hidden
  reportCount: Number,      // Auto-hide at 3 reports
  createdAt: Date
}
```

### Chat
```javascript
{
  participants: [ObjectId], // Buyer & Seller (2 users)
  lastMessage: {
    text: String,
    sender: ObjectId,
    timestamp: Date
  },
  blockedBy: [ObjectId],    // Users who blocked
  createdAt: Date,
  messages: [ObjectId]      // References Message collection
}
```

### Message
```javascript
{
  chat: ObjectId,           // References Chat
  sender: ObjectId,         // References User
  receiver: ObjectId,       // References User
  text: String,             // Message content
  template: String,         // Pre-defined template (optional)
  readAt: Date,             // Null if unread
  deletedFor: [ObjectId],   // Users who deleted locally
  createdAt: Date
}
```

### Vote
```javascript
{
  note: ObjectId,           // References Note
  user: ObjectId,           // References User
  type: String,             // upvote | downvote
  createdAt: Date           // Ensures one vote per user per note
}
```

### Report
```javascript
{
  reporter: ObjectId,       // References User (who reported)
  reportedItem: ObjectId,   // Note, Book, or User ID
  itemType: String,         // Note | Book | User
  reason: String,           // Report category
  description: String,      // Detailed reason
  status: String,           // pending | reviewed | resolved | dismissed
  action: String,           // Admin action taken
  createdAt: Date,
  updatedAt: Date
}
```

### BookRequest
```javascript
{
  requester: ObjectId,      // References User (wants book)
  bookTitle: String,        // Book they're looking for
  author: String,           // Author (optional)
  department: String,       // Department
  semester: Number,         // Semester
  status: String,           // pending | fulfilled | cancelled
  createdAt: Date
}
```

---

## 🎨 Design System

The frontend uses a custom design system with:
- **Color Palette**: Primary (Sky Blue - `#0EA5E9`), Accent (Pink/Purple - `#EC4899`)
- **Theme**: Dark mode by default with glassmorphism cards
- **Typography**: Inter font family, hierarchical heading sizes
- **Animations**: Float, glow, slide-up, fade-in custom animations
- **Spacing**: Tailwind default scale with dark-100 through dark-300 backgrounds
- **Components**: Glass cards with border opacity, gradient buttons, badge system

---

## 🔒 Security Features

- ✅ College email domain verification (regex: `.edu` or `.ac.in`)
- ✅ JWT with refresh tokens (7-day expiration)
- ✅ Rate limiting per endpoint (auth: 5/min, uploads: 10/hour, chat: 30/hour)
- ✅ Input validation with Joi schemas
- ✅ MongoDB query sanitization
- ✅ Helmet security headers
- ✅ CORS properly configured
- ✅ User blocking & chat blocking
- ✅ Two-stage OAuth verification

---

## 📈 Reputation & Moderation System

### Earning Reputation
| Action | Points |
|--------|--------|
| Note uploaded & verified | +5 |
| Note receives 3 upvotes | +5 |
| Book sold successfully | +10 |
| Helpful review received | +2 |

### Losing Reputation
| Action | Points Lost |
|--------|------------|
| Content reported (confirmed) | -5 |
| Per downvote on note | -1 |
| Repeated violations | -10 |

### Automatic Role Escalation
- **Reputation 100+** → Automatically becomes **Moderator**
- **Moderators** can: Review reports, hide content, warnings
- **Admins** (manually assigned) → Full system access

### Content Moderation
- Users can report notes, books, or users
- **Auto-hide** after 3 reports (pending review)
- Moderators review and take action
- Community-driven moderation system

---

## 🛠️ Tech Stack Details

**Frontend (React 18 + Vite):**
- ⚛️ React 18 with Hooks
- 🚀 Vite for fast builds
- 🎨 Tailwind CSS 3 + custom CSS
- 🔀 React Router 6
- 📡 Axios with interceptors
- 🔔 React Hot Toast notifications
- 🎭 Lucide Icons
- 🔐 @react-oauth/google

**Backend (Node.js + Express):**
- 🟢 Node.js + Express.js
- 🗄️ MongoDB + Mongoose ODM
- 🔐 JWT Authentication
- 📤 Cloudinary CDN + File Upload
- ✔️ Joi Schema Validation
- 📁 Multer File Handling
- ⏱️ Express Rate Limiter
- 🛡️ Helmet Security Headers
- 🌐 CORS & Compression

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **README.md** | This file - Quick start & overview |
| **PROJECT_CONTEXT_FOR_AI.md** | Complete architecture for AI tools & debugging |

**👉 Share `PROJECT_CONTEXT_FOR_AI.md` with ChatGPT or Claude for solving issues and debugging!**

---

## 🚀 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid Google token" | Check GOOGLE_CLIENT_ID matches in both `.env` files |
| Frontend shows blank page | Restart dev server (Ctrl+C, `npm run dev`) |
| MongoDB connection failed | Verify MONGODB_URI in `.env` and network access |
| CORS errors | Ensure Vite proxy is configured in `vite.config.js` |
| Vite not loading .env changes | Restart dev server with `npm run dev` |
| College email rejected | Use email ending in `.edu` or `.ac.in` only |

---

## 🚀 Deployment (Vercel)

The project is configured for easy deployment on **Vercel** as a unified full-stack application.

### 1. Requirements
- A **MongoDB Atlas** database (get the URI).
- **Google Cloud Console** credentials (OAuth Client ID & Secret).
- **Cloudinary** account (for image/PDF storage).

### 2. Steps to Deploy
1.  **Push** this project to a GitHub repository.
2.  **Import** the repository into Vercel.
3.  Vercel will detect the `vercel.json` and set up the builds.
4.  **Add Environment Variables** in Vercel settings:
    - `MONGODB_URI`
    - `GOOGLE_CLIENT_ID` (Required for both Frontend & Backend)
    - `GOOGLE_CLIENT_SECRET` (Backend only)
    - `JWT_SECRET`
    - `JWT_REFRESH_SECRET`
    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`
    - `NODE_ENV` = `production`
5.  **Deploy!** Vercel will build the React frontend and deploy the Node.js backend as serverless functions.

---

## 📞 Support & Debugging

- **Frontend/Backend Issues?** Check `PROJECT_CONTEXT_FOR_AI.md` for complete architecture
- **Debugging?** Share `PROJECT_CONTEXT_FOR_AI.md` with ChatGPT or Claude
- **Use the project context file** to solve small errors efficiently using console/tools

---

## 📄 License

MIT License - Feel free to use for your college projects!

---

## 🙏 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🎯 Roadmap

- ✅ MVP Backend (100%)
- ✅ MVP Frontend (100%)
- ✅ Google OAuth Registration (Feb 2, 2026)
- 🔄 Dashboard Analytics (In Progress)
- ⏳ Chat System (WebSocket integration)
- ⏳ Advanced Moderation Panel
- ⏳ Mobile App (React Native)
- ⏳ Recommendation Engine

---

**Built with ❤️ for college students**  
*Last Updated: February 2, 2026*
