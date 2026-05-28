# Batchmate Textbook Exchanger - Complete Project Documentation

## Project Summary

**Batchmate** is a campus-first textbook and notes exchange platform built as a full-stack web application. It enables college students to share handwritten notes, buy and sell textbooks, chat in real time, build reputation, and moderate the community.

The repository contains two main applications:
- `backend/` — Node.js + Express API with MongoDB, Cloudinary, Google OAuth, and Socket.io.
- `frontend/` — React + Vite SPA with JWT auth, real-time notifications, and responsive Tailwind UI.

The application is intentionally designed for verified college communities: only `.edu` and `.ac.in` email addresses can authenticate.

---

## Audience & Prerequisites

**Target Audience:** Full-stack developers, technical leads, and maintainers who need a complete project reference for Batchmate.

**Prerequisites:**
- Node.js 18+ (recommended)
- npm
- MongoDB Atlas or MongoDB connection string
- Cloudinary account
- Google Cloud OAuth client credentials
- Familiarity with React, Express, MongoDB, and Socket.io

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` using the required variables from the environment section below.

Start the backend in development mode:

```bash
npm run dev
```

The backend runs at:

- `http://batchmate-backend.onrender.com`

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env` with frontend-specific settings.

Start the frontend development server:

```bash
npm run dev
```

The frontend runs at:

- `http://localhost:3000`

---

## Architecture

### System Overview

The Batchmate architecture is separated into frontend and backend applications:

- The **frontend** is a React SPA that handles authentication, navigation, rendering, and real-time socket updates.
- The **backend** is an Express REST API that handles business logic, data persistence, authentication, file uploads, and real-time events through Socket.io.
- **MongoDB** stores users, notes, books, chats, notifications, reports, and reviews.
- **Cloudinary** stores note PDFs and book images.
- **Google OAuth** handles secure college email login.
- **Socket.io** powers chat, presence, and notification events in real time.

### Frontend

- React 18 + Vite
- Tailwind CSS styling
- React Router DOM for routing
- Axios for REST API requests
- Socket.io client for chat and notifications
- Google OAuth via `@react-oauth/google`
- JWT management in `localStorage`
- Lazy-loaded routes and suspense fallbacks for performance

### Backend

- Node.js + Express REST API
- MongoDB + Mongoose data models
- JWT access + refresh tokens
- Google OAuth token verification
- Cloudinary file upload management
- Socket.io for real-time chat and notifications
- Joi request validation
- Express-rate-limit for abuse protection
- Global error handler and fallback route handling
- Environment validation at startup

---

## Folder Structure

### Root

- `README.md` — project overview and quick description
- `SETUP_GUIDE.md` — step-by-step setup
- `FULL_PROJECT_DOCUMENTATION.md` — this complete documentation reference
- `backend/` — backend API code
- `frontend/` — frontend application code

### Backend Structure

```
backend/
├── config/
│   ├── database.js
│   └── env.js
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
│   ├── notifications.js
│   ├── notes.js
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

### Frontend Structure

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
│   │   ├── NotificationBell.jsx
│   │   ├── PageLoader.jsx
│   │   └── ErrorBoundary.jsx
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
│   │   └── NoteDetail.jsx
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

---

## Core Features

### Notes

- Upload handwritten note PDFs to Cloudinary.
- Vote on notes with one vote per user.
- Hide low-rated notes automatically.
- Reputation rewards for popular notes.
- AI note summarization with Gemini/Grok integration.
- Download note PDFs via secure endpoint.

### Books

- List textbooks with condition, price, campus, and images.
- Suggest price ranges based on MRP and condition.
- Mark books as sold.
- Submit book requests when a copy is unavailable.
- Buyer-seller workflow with interest requests.

### Chat

- Real-time chat powered by Socket.io.
- Message history stored in MongoDB.
- Block/unblock users from chat.
- Unread chat counts updated in real time.
- Message templates supported for quick replies.

### Authentication

- Google OAuth with college email validation.
- JWT access tokens with refresh token support.
- `AuthContext` handles token storage and refresh flows.
- Protected routes and API endpoints for authenticated users.

### Notifications

- Real-time notifications for messages, votes, and sales.
- Notification bell with unread count.
- Persisted notification records in MongoDB.
- Mark notifications as read individually or all at once.

### Admin

- Admin dashboard with user, note, book, and report moderation.
- Role-based access control for admin users.
- Data analytics and moderation tools.
- Block/unblock users and review flagged content.

---

## Environment Variables

### Backend (`backend/.env`)

Required variables:

- `NODE_ENV` — `development` or `production`
- `PORT` — backend port, usually `5000`
- `MONGODB_URI` — MongoDB Atlas connection string
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `JWT_SECRET` — JWT access token secret
- `JWT_REFRESH_SECRET` — JWT refresh token secret
- `JWT_EXPIRE` — access token expiry, e.g. `7d`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_URL` — frontend origin, e.g. `http://localhost:3000`
- `RATE_LIMIT_WINDOW_MS` — rate-limit window in ms
- `RATE_LIMIT_MAX_REQUESTS` — max requests per window
- `MAX_FILE_SIZE` — file upload limit bytes
- `MAX_IMAGE_SIZE` — image upload limit bytes

Optional / AI variables:

- `GEMINI_API_KEY` — Google Gemini API key
- `GROK_API_KEY` — xAI Grok API key

### Frontend (`frontend/.env`)

Required variables:

- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID
- `VITE_API_URL` — optional backend base URL, defaults to `/api`

---

## Render Deployment Requirements

### Backend Service on Render
- Use Node.js 18+.
- Set the start command to `npm start`.
- Render provides the `PORT` environment variable automatically; the backend uses `process.env.PORT || 5000`.
- Set `NODE_ENV=production`.
- Configure these required backend env vars on Render:
  - `MONGODB_URI`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `FRONTEND_URL` (deployed frontend origin)
  - `RATE_LIMIT_WINDOW_MS`
  - `RATE_LIMIT_MAX_REQUESTS`
  - `MAX_FILE_SIZE`
  - `MAX_IMAGE_SIZE`
- Use `npm run start` or `node server.js` as the Render service command.
- The backend is already configured to support reverse-proxy deployment with `trust proxy` enabled in production.

### Frontend Static Site on Render
- Set the build command to `npm install && npm run build`.
- Set the publish directory to `dist`.
- Configure these frontend environment variables on Render:
  - `VITE_GOOGLE_CLIENT_ID`
  - `VITE_API_URL=https://<your-backend-service>.onrender.com/api`
- Ensure the backend URL matches the deployed backend service URL.

### Render Notes
- Deploy frontend as a static site and backend as a web service for a clean production setup.
- `FRONTEND_URL` should be the deployed frontend origin used by backend CORS and Socket.io settings.
- Optionally use a `render.yaml` file for multi-service deployment.

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/google` | No | Login with Google OAuth |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current authenticated user |
| POST | `/api/auth/logout` | Yes | Logout user |

### Notes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notes` | No | List notes with filters and pagination |
| GET | `/api/notes/:id` | No | Get note details |
| POST | `/api/notes` | Yes | Create a new note upload |
| POST | `/api/notes/:id/upvote` | Yes | Upvote a note |
| POST | `/api/notes/:id/downvote` | Yes | Downvote a note |
| GET | `/api/notes/:id/download` | Yes | Download note asset |
| DELETE | `/api/notes/:id` | Yes | Delete a note |
| POST | `/api/notes/:id/summarize` | Yes | Generate AI summary |

### Books

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/books` | No | List books with filters |
| GET | `/api/books/:id` | No | Get book details |
| POST | `/api/books` | Yes | Create a book listing |
| PUT | `/api/books/:id` | Yes | Update a book listing |
| DELETE | `/api/books/:id` | Yes | Delete a listing |
| POST | `/api/books/:id/sold` | Yes | Mark a book as sold |
| POST | `/api/books/:id/request` | Yes | Request an unavailable book |

### Chat

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/chat` | Yes | List user conversations |
| POST | `/api/chat` | Yes | Create or fetch a chat room |
| GET | `/api/chat/:id/messages` | Yes | Get chat messages |
| POST | `/api/chat/:id/messages` | Yes | Send a message |
| PUT | `/api/chat/:id/read` | Yes | Mark chat as read |
| GET | `/api/chat/unread` | Yes | Get unread chat count |
| GET | `/api/chat/templates` | Yes | Get message templates |
| GET | `/api/chat/blocked` | Yes | Get blocked users |
| POST | `/api/chat/block/:userId` | Yes | Block a user |
| DELETE | `/api/chat/block/:userId` | Yes | Unblock a user |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Yes | List notifications |
| POST | `/api/notifications/read-all` | Yes | Mark all notifications read |
| POST | `/api/notifications/:id/read` | Yes | Mark a notification read |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | Yes | Platform overview stats |
| GET | `/api/admin/users` | Yes | List users with filters |
| PATCH | `/api/admin/users/:id/block` | Yes | Block or unblock a user |
| PATCH | `/api/admin/users/:id/role` | Yes | Change user role |
| GET | `/api/admin/notes` | Yes | List notes for moderation |
| GET | `/api/admin/books` | Yes | List books for moderation |
| GET | `/api/admin/reports` | Yes | List reports for moderation |

---

## Important Files

### Backend
- `backend/server.js` — app entrypoint, middleware, route wiring, Socket.io setup.
- `backend/config/env.js` — required environment validation and normalization.
- `backend/config/database.js` — MongoDB connection.
- `backend/middleware/auth.js` — JWT authentication middleware.
- `backend/middleware/validation.js` — Joi request validation.
- `backend/middleware/errorHandler.js` — global error handling.
- `backend/models/` — Mongoose schema definitions.
- `backend/routes/` — API route definitions.
- `backend/controllers/` — business logic for each resource.

### Frontend
- `frontend/src/App.jsx` — app routing and lazy route setup.
- `frontend/src/context/AuthContext.jsx` — authentication state and socket lifecycle.
- `frontend/src/utils/api.js` — Axios API client and token refresh logic.
- `frontend/src/utils/socket.js` — Socket.io client integration.
- `frontend/src/components/Layout.jsx` — page shell and navigation.
- `frontend/src/components/ErrorBoundary.jsx` — UI error fallback.
- `frontend/src/components/PageLoader.jsx` — route loading fallback.
- `frontend/src/pages/` — route page components.

---

## Production Readiness Notes

- Backend startup validates required environment variables and fails fast if missing.
- API supports versioning via `/api/*` and compatibility aliasing for `/api/v1/*`.
- `trust proxy` behavior is conditional: false in development, `1` in production.
- Auth token refresh is handled centrally in `frontend/src/utils/api.js`.
- Socket.io lifecycle is managed in `frontend/src/context/AuthContext.jsx`.
- Frontend build is validated successfully with Vite.

---

## Recommended Next Steps

- Add a complete API filter and query parameter reference.
- Add CI checks for linting and build validation.
- Add a production health endpoint and monitoring docs.
- Add a Docker compose deployment guide.
- Add stronger frontend input validation and accessible forms.

---

## Common Commands

### Backend
```bash
cd backend
npm install
npm run dev
npm run start
npm run seed
```

### Frontend
```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

---

## Debugging Guide

### Common issues
- Missing or invalid environment variables
- Backend failing to connect to MongoDB
- Frontend API base URL mismatch
- JWT expiration or invalid token
- Cloudinary upload failures
- Socket.io connection errors
- Validation errors from Joi

### Troubleshooting steps
1. Reproduce the issue and note the URL, action, and error.
2. Check browser console for frontend errors.
3. Check backend terminal logs for error details.
4. Verify the request path in Network tab.
5. Compare frontend expected response shape with actual backend response.
6. Search code for the route in `frontend/src/pages/` and backend `routes/`.

---

_Last updated: May 28, 2026_
