# Batchmate Textbook Exchanger - Full Project Documentation

## 1. Project Summary

Batchmate is a campus-focused textbook and notes exchange platform built as a full-stack web application.
It provides students with a safe community environment to:
- upload and download handwritten notes,
- list and buy/sell textbooks,
- chat in real time with buyers and sellers,
- publish reviews and earn reputation badges,
- moderate content with an admin dashboard.

The project consists of two main applications:
- `backend/` — Node.js + Express API with MongoDB and Socket.io.
- `frontend/` — React + Vite single-page application.

The system is designed for college campus communities, enforced by college email login and campus-specific restrictions.

## 2. High-Level Architecture

### Frontend
- React 18 + Vite
- Tailwind CSS styling
- React Router for page navigation
- Axios for HTTP requests
- Socket.io client for realtime notifications + chat
- JWT-based authentication stored in `localStorage`

### Backend
- Node.js + Express
- MongoDB + Mongoose models
- JWT authentication middleware
- Google OAuth login flow for college email users
- Cloudinary for file storage (PDFs, photos)
- Socket.io for chat and live notifications
- Joi validation in request middleware
- Rate limiting for sensitive endpoints
- Global error handling

### Data flow
1. User logs in with Google.
2. Frontend receives an OAuth token.
3. Backend verifies token and issues JWTs.
4. Frontend requests API data with `Authorization: Bearer <token>`.
5. Backend returns JSON and optionally emits Socket.io events.
6. Frontend renders pages and updates in real time.

## 3. Folder Structure

### Root
- `README.md` — project overview and badges.
- `FULL_PROJECT_DOCUMENTATION.md` — this file.
- `SETUP_GUIDE.md` — step-by-step setup instructions.
- `PROJECT_CONTEXT_FOR_AI.md` — project context and summary.
- `backend/` — backend application.
- `frontend/` — frontend application.

### Backend structure

```
backend/
├── config/
│   └── database.js
├── controllers/
│   ├── adminController.js
│   ├── aiController.js
│   ├── authController.js
│   ├── bookController.js
│   ├── chatController.js
│   ├── notificationController.js
│   ├── noteController.js
│   ├── reportController.js
│   ├── reviewController.js
│   ├── userController.js
│   └── notificationHelper.js
├── middleware/
│   ├── adminAuth.js
│   ├── auth.js
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   ├── rbac.js
│   ├── upload.js
│   └── validation.js
├── models/
│   ├── Book.js
│   ├── BookRequest.js
│   ├── Chat.js
│   ├── Message.js
│   ├── Notification.js
│   ├── Notifications.js
│   ├── Note.js
│   ├── Report.js
│   ├── SellerReview.js
│   ├── User.js
│   ├── Vote.js
│   └── index.js
├── routes/
│   ├── admin.js
│   ├── auth.js
│   ├── books.js
│   ├── chat.js
│   ├── index.js
│   ├── notes.js
│   ├── notifications.js
│   ├── reports.js
│   ├── reviews.js
│   └── users.js
├── scripts/
│   └── seedData.js
├── utils/
│   ├── badges.js
│   ├── cloudinary.js
│   └── jwt.js
├── server.js
└── package.json
```

### Frontend structure

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── BadgeReview.jsx
│   │   ├── BookCard.jsx
│   │   ├── EmptyState.jsx
│   │   ├── FilterSidebar.jsx
│   │   ├── Layout.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Navbar.jsx
│   │   ├── NoteCard.jsx
│   │   └── NotificationBell.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── BookDetail.jsx
│   │   ├── Books.jsx
│   │   ├── Chat.jsx
│   │   ├── CompleteRegistration.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Landing.jsx
│   │   ├── ListBook.jsx
│   │   ├── Login.jsx
│   │   ├── NoteDetail.jsx
│   │   ├── Notes.jsx
│   │   ├── NotFound.jsx
│   │   ├── Profile.jsx
│   │   ├── UploadNote.jsx
│   │   └── ...
│   ├── utils/
│   │   ├── api.js
│   │   ├── helpers.js
│   │   └── socket.js
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── vite.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

## 4. Main Features & Logic

### Notes
- Notes are stored in the `Note` model.
- Each note can be uploaded as a PDF and stored in Cloudinary.
- Notes support search, sorting, filtering, upvotes/downvotes, downloads, and AI summarization.
- The backend smart search can use text search, uploader matches, and regex fallback.
- The frontend page `/notes` loads note cards and shows search metadata.
- `NoteDetail.jsx` loads `/api/notes/:id` and displays the note, votes, download, and AI summary.

### Books
- Books are stored in the `Book` model.
- Listings include images, price, condition, and seller details.
- A seller can mark a book as sold.
- Users can request a book if none is available.
- Reviews and ratings appear after sale completion.

### Chat
- Chat uses Socket.io and stores conversations in `Chat` and `Message` models.
- Users can join chat rooms, send messages, and see typing indicators.
- Notifications update in real time when a message arrives.

### User & Auth
- Authentication is handled by Google OAuth and JWTs.
- `AuthContext.jsx` manages login state and refresh logic.
- `api.js` adds the access token to requests and refreshes it when expired.
- User roles: `user`, `moderator`, `admin`.
- Admin users have access to `/admin`.

### Notifications
- Notifications are stored in `Notification` and delivered via Socket.io.
- Notification bell shows unread count and recent items.
- Users can mark notifications as read.

### Admin
- Admin endpoints are protected by admin middleware.
- Admin dashboard includes stats, note moderation, book moderation, user management, and report handling.

## 5. Key Models

### User
- `name`, `email`, `googleId`, `profilePicture`
- `department`, `semester`, `campus`
- `role` (`user`, `moderator`, `admin`)
- `reputationScore`, `badges`, `blocked`

### Note
- `title`, `description`, `subject`, `semester`, `branch`, `department`
- `filePublicId`, `fileUrl`, `thumbnailUrl`
- `uploadedBy`, `viewCount`, `downloadCount`
- `upvotes` / `downvotes`
- `isHidden`, `isApproved`
- `summary` cached by AI summarizer

### Book
- `title`, `author`, `mrp`, `askingPrice`, `condition`
- `images`, `description`, `location`, `campus`
- `seller`, `isSold`, `interestedUsers`

### Chat
- `participants` array
- `messages` array of `Message` refs
- `lastMessage`, `unreadCount`

### Message
- `chat`, `sender`, `content`, `type`, `createdAt`
- `read` status

### Notification
- `user`, `type`, `title`, `message`, `data`
- `read`, `createdAt`

### SellerReview
- `book`, `seller`, `buyer`, `rating`, `comment`
- `createdAt`

### Vote
- `user`, `note`, `voteType`
- Ensures a user can only vote once per note.

## 6. Important Backend Files

### `backend/server.js`
- Creates `app` and `server`.
- Configures middleware: CORS, Helmet, compression, logging, body parsing, sanitation.
- Connects to MongoDB.
- Mounts API routes.
- Attaches `req.io` so controllers can emit socket events.
- Sets up Socket.io events for real-time chat and notifications.
- Starts the server with `server.listen()`.

### `backend/config/database.js`
- Connects to MongoDB using `process.env.MONGODB_URI`.
- Logs a success or throws an error.

### `backend/middleware/auth.js`
- Verifies JWT tokens.
- Implements `authenticate` middleware for protected routes.
- Implements `optionalAuth` for routes that accept anonymous users.

### `backend/middleware/validation.js`
- Uses Joi schemas to validate request bodies and query parameters.
- Returns `400 Bad Request` on validation failure.

### `backend/middleware/errorHandler.js`
- Catches thrown errors and sends formatted JSON responses.
- Handles not found routes.

### `backend/routes/notes.js`
- Defines note-related endpoints: list, get, create, download, vote, delete, summarize.

### `backend/controllers/noteController.js`
- Implements note search and CRUD logic.
- Returns payloads like `{ success: true, note, userVote }`.

## 7. Important Frontend Files

### `frontend/src/utils/api.js`
- Creates Axios instance with base URL `VITE_API_URL || '/api'`.
- Adds `Authorization` header when access token exists.
- Refreshes token automatically on `401` responses.

### `frontend/src/context/AuthContext.jsx`
- Provides `user`, `isAuthenticated`, and `loading` states.
- Handles login, logout, and token storage.

### `frontend/src/App.jsx`
- Defines public and protected routes.
- Wraps main app inside `Layout` and `ProtectedRoute`.

### `frontend/src/pages/Notes.jsx`
- Loads notes from `/api/notes` with filter params.
- Uses `Fuse.js` on the client for fuzzy search ranking.

### `frontend/src/pages/NoteDetail.jsx`
- Loads detail from `/api/notes/:id`.
- Shows AI summary panel and vote buttons.
- Handles downloads and note deletion.

### `frontend/src/components/NoteCard.jsx`
- Renders a note preview card.
- Navigates to `/notes/:id`.

## 8. Environment Variables

### Backend (`backend/.env`)
- `PORT=5000`
- `MONGODB_URI=` MongoDB connection string
- `GOOGLE_CLIENT_ID=` Google OAuth client ID
- `GOOGLE_CLIENT_SECRET=` Google OAuth client secret
- `CLOUDINARY_CLOUD_NAME=` Cloudinary account name
- `CLOUDINARY_API_KEY=` Cloudinary API key
- `CLOUDINARY_API_SECRET=` Cloudinary API secret
- `JWT_SECRET=` JWT signing secret
- `JWT_EXPIRES_IN=` access token lifetime
- `REFRESH_TOKEN_SECRET=` refresh token secret
- `REFRESH_TOKEN_EXPIRES_IN=` refresh token lifetime
- `FRONTEND_URL=http://localhost:3000`
- `GROK_API_KEY=` optional; used for AI features

### Frontend (`frontend/.env`)
- `VITE_GOOGLE_CLIENT_ID=` Google OAuth client ID
- `VITE_API_URL=` optional backend base URL

## 9. Setup & Run Instructions

### 9.1 Backend
1. Open `backend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` with correct values.
4. Start server:
   ```bash
   npm run dev
   ```
5. API runs at `http://localhost:5000` by default.

### 9.2 Frontend
1. Open `frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` with `VITE_GOOGLE_CLIENT_ID`.
4. Start frontend:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in browser.

### 9.3 Common Commands
- Backend dev: `cd backend && npm run dev`
- Frontend dev: `cd frontend && npm run dev`
- Frontend build: `cd frontend && npm run build`
- Backend install: `cd backend && npm install`
- Frontend install: `cd frontend && npm install`

## 10. Debugging Guide

### Common bug sources
- Invalid environment variables
- Backend failing to connect to MongoDB
- Frontend routing or API base URL mismatch
- Token expiration or missing JWT
- Cloudinary upload failures
- Socket.io connection issues
- Invalid request validation (Joi errors)

### How to debug errors
1. Reproduce the bug and note the exact URL, action, and error text.
2. Check the browser console for frontend errors.
3. Check the backend terminal for error logs.
4. Confirm the request path in network inspector.
5. Verify the endpoint response shape matches frontend expectations.
6. Search for the route in `frontend/src/pages/*` and backend route file.
7. Confirm the model field names in `backend/models/`.
8. If the bug is a data mismatch, compare the backend response keys with frontend state usage.

### Specific example: note details page
- Frontend expected: `response.data.data`
- Backend returned: `response.data.note`
- Fix: change frontend to use `response.data.note`

### When you ask ChatGPT for help
Provide:
- your exact command or page URL
- the full error message or stack trace
- the file path(s) involved
- what you expected to happen
- what currently happens instead

Example:
> `NoteDetail.jsx` is calling `/api/notes/:id`. The backend returns `{ note }`, but the frontend is using `response.data.data`. The page shows a loading spinner and then redirects.

This document is intentionally self-contained so ChatGPT can use it to understand the architecture without opening multiple files.

## 11. Key API Endpoints

### Auth
- `POST /api/auth/google` — login with Google
- `POST /api/auth/complete-registration` — finish signup
- `POST /api/auth/refresh` — refresh JWT
- `GET /api/auth/me` — get current user
- `POST /api/auth/logout` — logout user

### Notes
- `GET /api/notes` — list notes
- `GET /api/notes/:id` — note details
- `POST /api/notes` — upload note
- `GET /api/notes/:id/download` — download note PDF
- `POST /api/notes/:id/vote` — vote on note
- `DELETE /api/notes/:id` — delete note
- `POST /api/notes/:id/summarize` — AI summary

### Books
- `GET /api/books` — list books
- `GET /api/books/:id` — book details
- `POST /api/books` — list a book
- `PUT /api/books/:id` — update a listing
- `DELETE /api/books/:id` — delete a listing
- `POST /api/books/:id/sold` — mark sold

### Chat
- `GET /api/chat` — get conversations
- `POST /api/chat` — start conversation
- `POST /api/chat/:chatId/message` — send message

### Users
- `GET /api/users/me` — current profile
- `GET /api/users/:id` — user profile
- `GET /api/users/leaderboard` — leaderboard

### Admin
- `GET /api/admin/notes` — list notes for moderation
- `PATCH /api/admin/notes/:id/moderate` — change note status

## 12. Best Practices for Future Edits

- Keep backend response shapes stable. If you return `{ note }`, frontend should use `note`, not `data`.
- Use `optionalAuth` when a route can be public but still provide user-specific info.
- Validate every request payload in `middleware/validation.js`.
- Keep Socket.io event names consistent between client and server.
- Store only JWT tokens in local storage; never store user passwords.
- Log both success and failure cases clearly in controllers.

## 13. Notes for ChatGPT Debugging

This file is your single source of truth. Use it to:
- understand the structure and where code lives,
- locate the API and route names quickly,
- validate expected request/response shapes,
- identify common environment issues,
- accelerate root-cause analysis for broken pages.

If you want to debug faster, paste the relevant section of this file with the error details.

---

_Last updated: May 28, 2026_
