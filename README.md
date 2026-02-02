# 🎓 Batchmate - Campus Textbook & Notes Exchange

A modern full-stack platform for college students to exchange textbooks and share handwritten notes with their campus community.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Tech Stack](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![Tech Stack](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)
![Tech Stack](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)

---

## ✨ Features

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

### 🔐 Authentication
- Google OAuth (college email only)
- JWT-based sessions
- Role-based access (user, moderator, admin)

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google OAuth credentials
- Cloudinary account

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/batchmate

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

ALLOWED_EMAIL_DOMAINS=edu,ac.in
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### 4. Seed Sample Data (Optional)

```bash
cd backend
npm run seed
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/complete-registration` | Complete registration |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List notes (with filters) |
| GET | `/api/notes/popular` | Get popular notes |
| GET | `/api/notes/:id` | Get note details |
| POST | `/api/notes` | Upload note |
| POST | `/api/notes/:id/vote` | Vote on note |
| GET | `/api/notes/:id/download` | Download note |
| DELETE | `/api/notes/:id` | Delete note |

### Books
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | List books (with filters) |
| GET | `/api/books/:id` | Get book details |
| POST | `/api/books` | List a book |
| PUT | `/api/books/:id` | Update book |
| DELETE | `/api/books/:id` | Delete book |
| POST | `/api/books/:id/sold` | Mark as sold |
| POST | `/api/books/request` | Request a book |
| GET | `/api/books/requests` | Get book requests |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat` | Get user's chats |
| POST | `/api/chat` | Create/get chat |
| GET | `/api/chat/:id/messages` | Get messages |
| POST | `/api/chat/:id/messages` | Send message |
| PUT | `/api/chat/:id/read` | Mark as read |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get own profile |
| PUT | `/api/users/profile` | Update profile |
| GET | `/api/users/:id` | Get user profile |
| POST | `/api/users/block/:id` | Block user |
| GET | `/api/users/leaderboard` | Campus leaderboard |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Create report |
| GET | `/api/reports` | Get reports (moderator) |
| PUT | `/api/reports/:id` | Review report (moderator) |

---

## 🎨 Design System

The frontend uses a custom design system with:
- **Color palette**: Primary (sky blue), Accent (pink/purple)
- **Dark mode**: Default dark theme with glassmorphism
- **Typography**: Inter font family
- **Animations**: Float, glow, slide-up, fade-in
- **Components**: Glass cards, gradient buttons, badges

---

## 🔒 Security Features

- ✅ College email domain verification
- ✅ JWT with refresh tokens
- ✅ Rate limiting (auth, uploads, chat, votes)
- ✅ MongoDB query sanitization
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Input validation (Joi)
- ✅ Same-campus enforcement

---

## 📈 Reputation System

| Action | Points |
|--------|--------|
| Note gets 3 upvotes | +5 |
| Note gets 1 download | +5 |
| Complete book exchange | +10 |
| Report confirmed | +2 |
| Content reported (confirmed) | -5 |

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS 3
- React Router 6
- Axios
- React Hot Toast
- Lucide Icons
- Google OAuth React

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- Cloudinary
- Joi validation
- Multer (file upload)
- Helmet, CORS, compression

---

## 📄 License

MIT License - Feel free to use for your college projects!

---

## 🙏 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Built with ❤️ for college students**
