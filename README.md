# 🎓 Batchmate — Campus Textbook & Notes Exchange

A modern full-stack platform for college students to exchange textbooks, share handwritten notes, and build a trusted campus community.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Node](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)
![Auth](https://img.shields.io/badge/Auth-Google%20OAuth-4285F4?logo=google)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-black?logo=socket.io)
![AI](https://img.shields.io/badge/AI-Gemini%20%2F%20Grok-blueviolet?logo=google)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🎯 Project Overview

**Batchmate** is a campus-restricted marketplace where students can:

- 📝 **Share Notes** — Upload handwritten class notes and earn reputation points
- 📚 **Exchange Books** — Buy/sell textbooks with AI-assisted smart pricing (40–60% of MRP)
- 💬 **Chat Safely** — Real-time direct messaging between buyers and sellers via Socket.io
- 🤖 **AI Summariser** — Get instant Gemini-powered summaries of any uploaded note PDF
- ⭐ **Badge System** — Earn Verified Seller, Top Contributor, and Pro Tutor badges
- 🌟 **Seller Reviews** — Rate sellers after a book transaction; reviews shown on their profile
- 🔍 **Smart Search** — Multi-layered search (MongoDB full-text → regex → fuzzy re-ranking)
- 🔔 **Real-time Notifications** — Live alerts via Socket.io for messages, votes, and sales
- 🏆 **Reputation Engine** — Earn karma through contributions and helpful reviews
- 👑 **Admin Dashboard** — Full platform management: users, notes, books, reports with live stats
- 🛡️ **Moderation** — Community-driven + admin-controlled content moderation

**Authentication**: Google OAuth — college email only (`.edu` or `.ac.in` domains)

---

## ✨ Feature Breakdown

### 📝 Notes Module
- Upload handwritten note PDFs (Cloudinary storage)
- Mandatory handwritten confirmation checkbox
- Upvote / Downvote system with one-vote-per-user enforcement
- Auto-hide after vote score ≤ −5
- Reputation reward: 5 pts after 3 upvotes OR 1 download
- Preview thumbnails generated on upload
- **🤖 AI Note Summariser** — Gemini API generates a structured summary of the PDF; cached for 24 hours

### 📚 Books Module
- List textbooks with up to 5 Cloudinary-hosted photos
- Smart price suggestion (40–60% of MRP based on condition)
- Condition grading: Like New / Good / Fair / Acceptable
- Preferred meetup location list
- Mark as Sold workflow
- **Book Request** feature for cold-start (no available copy yet)

### 💬 Real-time Chat
- Socket.io powered messaging (seen in real time)
- Chat restricted to buyer ↔ seller pairs
- Predefined message templates
- Rate limiting for new accounts
- Block & report from within chat
- Unread badge count synced across tabs via Socket.io

### 🔍 Smart Search (Notes)
Five-step search pipeline:
1. Find uploaders whose name matches the query
2. Build a regex OR clause for fallback
3. Attempt MongoDB `$text` index search (stemmed, diacritic-insensitive)
4. Fall back to regex if text search returns nothing
5. Union results with uploader-name matches
+ Client-side **Fuse.js** fuzzy re-ranking with search mode indicator

### ⭐ Badge System (computed on-the-fly)
| Badge | Trigger |
|---|---|
| ⭐ Verified Seller | 3+ books sold |
| 🥇 Top Contributor | 50+ reputation points |
| 💎 Pro Tutor | 10+ upvoted notes |
| 👑 Admin | role = admin |
| 🛡️ Moderator | role = moderator |

Badges show on **Profile** page and **BookDetail** seller card.

### 🌟 Seller Ratings & Reviews
- After a book is marked "sold", buyers see a ★★★★★ review form in BookDetail
- One review per transaction (idempotent upsert)
- Average seller rating shown as a badge chip everywhere badges appear
- Full review list on seller's **Profile → Reviews** tab
- Self-review blocked server-side

### 🔔 Notification System
- Real-time Socket.io notifications (new message, upvote, book interested, sale)
- Notification bell in navbar with unread count badge
- Mark as read individually or all-at-once

### 👑 Admin Dashboard (`/admin`)
Protected by `requireAdmin` middleware. Five tabs:

| Tab | Capabilities |
|---|---|
| Overview | 8 stat cards + 30-day signup bar chart |
| Users | Search, filter by role/blocked, block/unblock, promote/demote |
| Notes | Approve / hide / flag with thumbnail preview |
| Books | Search, filter by status, remove listings |
| Reports | Filter by status, resolve / dismiss |

Accessible only when `user.role === 'admin'`. Shows a 👑 button in the navbar.

---

## 📁 Project Structure

```
Batchmate Textbook Exchanger/
│
├── 📂 backend/
│   ├── config/
│   │   └── database.js             # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js       # Google OAuth login & registration
│   │   ├── noteController.js       # Notes CRUD + smart search + voting
│   │   ├── bookController.js       # Books CRUD + sold workflow
│   │   ├── chatController.js       # Conversations & messages
│   │   ├── userController.js       # Profile, leaderboard, blocking
│   │   ├── reportController.js     # Community reports
│   │   ├── notificationController.js
│   │   ├── notificationHelper.js   # Socket.io notification emitter
│   │   ├── aiController.js         # Gemini PDF summariser
│   │   ├── adminController.js      # Admin dashboard endpoints
│   │   └── reviewController.js     # Seller reviews & badge stats
│   ├── middleware/
│   │   ├── auth.js                 # JWT authenticate + optionalAuth
│   │   ├── adminAuth.js            # requireAdmin guard
│   │   ├── errorHandler.js         # AppError + asyncHandler
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Note.js
│   │   ├── Book.js
│   │   ├── BookRequest.js
│   │   ├── Vote.js
│   │   ├── Report.js
│   │   ├── Chat.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── SellerReview.js         # NEW — seller ratings
│   │   └── index.js                # Central re-export
│   ├── routes/
│   │   ├── auth.js
│   │   ├── notes.js
│   │   ├── books.js
│   │   ├── chat.js
│   │   ├── users.js
│   │   ├── reports.js
│   │   ├── notifications.js
│   │   ├── admin.js
│   │   └── reviews.js              # NEW — badges + reviews
│   ├── utils/
│   │   ├── cloudinary.js           # Upload helpers
│   │   ├── jwt.js                  # Token generation & verification
│   │   └── badges.js               # NEW — badge computation logic
│   ├── .env                        # Environment variables
│   └── server.js                   # Express + Socket.io entry point
│
├── 📂 frontend/src/
│   ├── components/
│   │   ├── Navbar.jsx              # With admin 👑 link & notification bell
│   │   ├── NoteCard.jsx
│   │   ├── BookCard.jsx
│   │   ├── FilterSidebar.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── EmptyState.jsx
│   │   ├── Layout.jsx
│   │   ├── NotificationBell.jsx    # Real-time bell with dropdown
│   │   └── BadgeReview.jsx         # NEW — BadgeChip, BadgeRow, ReviewForm, ReviewList
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── CompleteRegistration.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Notes.jsx               # Fuzzy search + Fuse.js re-ranking
│   │   ├── NoteDetail.jsx          # With AI Summary panel
│   │   ├── UploadNote.jsx
│   │   ├── Books.jsx
│   │   ├── BookDetail.jsx          # With BadgeRow + ReviewForm + ReviewList
│   │   ├── ListBook.jsx            # With smart price prediction band
│   │   ├── Chat.jsx
│   │   ├── Profile.jsx             # With BadgeRow + Reviews tab
│   │   ├── AdminDashboard.jsx      # Full 5-tab admin panel
│   │   └── NotFound.jsx
│   ├── context/
│   │   └── AuthContext.jsx         # Auth state + socket integration
│   └── utils/
│       ├── api.js                  # Axios client with JWT interceptors
│       ├── socket.js               # Socket.io client singleton
│       └── helpers.js              # Constants, formatters, BRANCHES, etc.
│
└── README.md
```

---

## 🌐 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/google` | ❌ | Google OAuth login (college email only) |
| POST | `/api/auth/complete-registration` | ❌ | Submit department/semester after first OAuth |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| GET | `/api/auth/me` | ✅ | Get current authenticated user |
| POST | `/api/auth/logout` | ✅ | Logout (clears client tokens) |

### Notes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notes` | ❌ | List notes with smart search & filters |
| GET | `/api/notes/:id` | ❌ | Get single note |
| POST | `/api/notes` | ✅ | Upload note (PDF + metadata) |
| POST | `/api/notes/:id/upvote` | ✅ | Upvote note |
| POST | `/api/notes/:id/downvote` | ✅ | Downvote note |
| GET | `/api/notes/:id/download` | ✅ | Download PDF & increment counter |
| DELETE | `/api/notes/:id` | ✅ | Delete note (owner / moderator) |
| POST | `/api/notes/:id/summarize` | ✅ | Generate / fetch AI summary (Gemini) |

### Books
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/books` | ❌ | List books with filters |
| GET | `/api/books/:id` | ❌ | Get book details |
| POST | `/api/books` | ✅ | Create listing |
| PUT | `/api/books/:id` | ✅ | Update listing (seller only) |
| DELETE | `/api/books/:id` | ✅ | Delete listing (seller / moderator) |
| POST | `/api/books/:id/sold` | ✅ | Mark book as sold |
| POST | `/api/books/:id/request` | ✅ | Request a book (cold-start feature) |

### Chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/chat` | ✅ | List conversations |
| POST | `/api/chat` | ✅ | Start conversation (buyer → seller) |
| GET | `/api/chat/:id/messages` | ✅ | Get messages |
| POST | `/api/chat/:id/messages` | ✅ | Send message |
| POST | `/api/chat/:id/block` | ✅ | Block user in this chat |
| GET | `/api/chat/unread-count` | ✅ | Badge count for navbar |

### Reviews & Badges
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews/badges/:userId` | ❌ | Get user badges + avg seller rating |
| GET | `/api/reviews/seller/:sellerId` | ❌ | List all reviews for a seller |
| GET | `/api/reviews/can-review/:bookId` | ✅ | Check if current user can review |
| POST | `/api/reviews` | ✅ | Submit / update a seller review |

### Admin (all require `role: "admin"`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform overview + 30-day signup chart |
| GET | `/api/admin/users` | Paginated user list with filters |
| PATCH | `/api/admin/users/:id/block` | Toggle block/unblock |
| PATCH | `/api/admin/users/:id/role` | Change role |
| GET | `/api/admin/notes` | Paginated notes |
| PATCH | `/api/admin/notes/:id/moderate` | approve / hide / flag |
| GET | `/api/admin/books` | Paginated book listings |
| DELETE | `/api/admin/books/:id` | Remove listing |
| GET | `/api/admin/reports` | Paginated reports |
| PATCH | `/api/admin/reports/:id/resolve` | resolve / dismiss |

---

## 🗄️ Data Models (10 Collections)

| Model | Key Fields |
|-------|-----------|
| **User** | googleId, email, name, department, semester, campus, reputationScore, role (user/moderator/admin), isBlocked |
| **Note** | title, subject, subjectCode, uploadedBy, fileUrl, thumbnailUrl, voteScore, downloadCount, aiSummary, status |
| **Book** | title, author, mrp, finalPrice, condition, images, listedBy, campus, status (available/reserved/sold/removed) |
| **BookRequest** | requester, bookTitle, department, semester, status |
| **Vote** | note, user, type (upvote/downvote) — unique index per note+user |
| **Report** | reporter, reportedItem, itemType, reason, status, action |
| **Chat** | participants[2], lastMessage, blockedBy |
| **Message** | chat, sender, receiver, text, template, readAt |
| **Notification** | recipient, type, message, relatedId, isRead |
| **SellerReview** | book, seller, reviewer, rating (1–5), comment — unique index per book+reviewer |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Google OAuth 2.0** credentials ([Cloud Console](https://console.cloud.google.com/))
- **Cloudinary** account (PDF & image uploads)
- *(Optional)* **Gemini API key** for AI note summaries
- *(Optional)* **Grok/xAI API key** if you want smart search AI features

### Step 1 — Clone
```bash
git clone https://github.com/yourusername/batchmate.git
cd "Batchmate Textbook Exchanger"
```

### Step 2 — Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend (new terminal)
cd frontend && npm install
```

### Step 3 — Configure Environment

**`backend/.env`**
```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/batchmate

# JWT (change in production!)
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI (optional)
GEMINI_API_KEY=your-gemini-key
GROK_API_KEY=your-grok-key
```

**`frontend/.env`**
```env
# Must match backend GOOGLE_CLIENT_ID exactly!
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

> ⚠️ **Critical**: Both `.env` files must use the **same** `GOOGLE_CLIENT_ID`.

### Step 4 — Run Locally

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** and sign in with a college email.

### Step 5 — Make Yourself Admin (optional)

Run this in MongoDB Atlas or Compass:
```js
db.users.updateOne(
  { email: "your-email@college.ac.in" },
  { $set: { role: "admin" } }
)
```
Log out and back in → the **👑 Admin** link appears in the navbar → go to `/admin`.

---

## 🔒 Security

- ✅ College email domain validation (`.edu` / `.ac.in`)
- ✅ Google token verified server-side via `google-auth-library`
- ✅ JWT access tokens (short-lived) + refresh tokens (7-day)
- ✅ Role-based access control (user / moderator / admin)
- ✅ Rate limiting: auth (5/min), uploads (10/hr), chat (30/hr)
- ✅ Joi schema validation on all inputs
- ✅ MongoDB query sanitization (`express-mongo-sanitize`)
- ✅ Helmet security headers
- ✅ CORS restricted to `FRONTEND_URL`
- ✅ Admin routes double-guarded (`authenticate` + `requireAdmin`)

---

## 📈 Reputation System

### Earning Points
| Action | Points |
|--------|--------|
| Upload a note (verified) | +5 |
| Note reaches 3 upvotes | +5 |
| Book sold successfully | +10 |

### Losing Points
| Action | Points |
|--------|--------|
| Note downvoted | −1 per vote |
| Content reported & confirmed | −5 |

### Auto Role Escalation
- **100+ reputation** → automatically becomes **Moderator**
- **Moderators** can review reports and hide content
- **Admins** are manually assigned via DB and have full dashboard access

---

## 🛠️ Tech Stack

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Build tool |
| TailwindCSS | 3 | Styling |
| React Router | 6 | Client routing |
| Axios | 1.6 | HTTP client with JWT interceptors |
| Socket.io-client | 4.8 | Real-time messaging & notifications |
| Recharts | 3.7 | Admin charts |
| Fuse.js | 7.1 | Client-side fuzzy search re-ranking |
| Lucide React | 0.344 | Icon set |
| React Hot Toast | 2.4 | Toast notifications |
| @react-oauth/google | 0.12 | Google OAuth button |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| Express | 4.18 | HTTP framework |
| Mongoose | 8 | MongoDB ODM |
| Socket.io | 4.8 | WebSocket server |
| jsonwebtoken | 9 | JWT signing & verification |
| google-auth-library | 9 | Google token verification |
| @google/generative-ai | 0.24 | Gemini AI summaries |
| openai | 6.22 | xAI / Grok API client |
| Cloudinary | 1.41 | File upload & storage |
| Multer | 1.4 | Multipart file handling |
| Joi | 17 | Request validation |
| Helmet | 7 | Security headers |
| express-rate-limit | 7 | API rate limiting |
| express-mongo-sanitize | 2.2 | Query injection prevention |

---

## 🐞 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid Google token" | Ensure `GOOGLE_CLIENT_ID` is identical in both `.env` files |
| College email rejected | Only `.edu` or `.ac.in` emails are accepted |
| MongoDB connection failed | Check `MONGODB_URI` and Atlas IP whitelist |
| CORS errors | Ensure `FRONTEND_URL=http://localhost:5173` in `backend/.env` |
| Badges not showing | Verify `/api/reviews/badges/:userId` returns 200 |
| Admin link not visible | Confirm `role: "admin"` in DB and re-login to refresh JWT |
| AI summary not working | Add `GEMINI_API_KEY` to `backend/.env` |
| Socket not connecting | Check that both servers share the same `FRONTEND_URL`/`PORT` |

---

## 🚀 Deployment (Vercel)

1. Push to GitHub
2. Import repository in [Vercel](https://vercel.com)
3. Add environment variables (all from `backend/.env` + `VITE_GOOGLE_CLIENT_ID`)
4. Vercel will auto-detect and build both frontend and server

---

## 🗺️ Roadmap

- ✅ Google OAuth registration (2-stage)
- ✅ Notes upload + voting + reputation
- ✅ Books marketplace + smart pricing
- ✅ Real-time chat (Socket.io)
- ✅ Real-time notifications
- ✅ AI note summariser (Gemini)
- ✅ Smart search (full-text + fuzzy)
- ✅ Badge system (on-the-fly computation)
- ✅ Seller reviews & ratings
- ✅ Admin dashboard (5-tab)
- ⏳ Mobile app (React Native)
- ⏳ Recommendation engine
- ⏳ Email notifications for critical admin actions

---

## 📄 License

MIT License — free to use for college projects and hackathons.

---

**Built with ❤️ for college students**  
*Last Updated: February 22, 2026*
