# 🚀 Batchmate Setup Guide

## Prerequisites

Before running the project, you need to set up the following services:

---

## 1. MongoDB Setup (Choose ONE option)

### Option A: Local MongoDB (Recommended for Development)

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Download for Windows
   - Install with default settings
   - MongoDB will run on `mongodb://localhost:27017`

2. **Verify Installation**
   ```bash
   mongod --version
   ```

3. **Your `.env` is already configured for local MongoDB**
   ```
   MONGODB_URI=mongodb://localhost:27017/batchmate
   ```

### Option B: MongoDB Atlas (Cloud - Free Tier)

1. **Create Account**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free

2. **Create Cluster**
   - Choose FREE tier (M0)
   - Select region closest to you
   - Click "Create Cluster"

3. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

4. **Update `.env`**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/batchmate?retryWrites=true&w=majority
   ```

---

## 2. Google OAuth Setup (REQUIRED)

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create New Project**
   - Click "Select a project" → "New Project"
   - Name: "Batchmate"
   - Click "Create"

### Step 2: Enable Google+ API

1. **Navigate to APIs & Services**
   - Left menu → "APIs & Services" → "Library"

2. **Enable Google+ API**
   - Search for "Google+ API"
   - Click on it → Click "Enable"

### Step 3: Create OAuth Credentials

1. **Configure OAuth Consent Screen**
   - Left menu → "OAuth consent screen"
   - Choose "External" → Click "Create"
   - Fill in:
     - App name: Batchmate
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Skip "Scopes" → Click "Save and Continue"
   - Add test users (your college email)
   - Click "Save and Continue"

2. **Create OAuth Client ID**
   - Left menu → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Batchmate Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000`
   - Click "Create"

3. **Copy Credentials**
   - You'll see a popup with:
     - **Client ID**: `123456789-abc.apps.googleusercontent.com`
     - **Client Secret**: `GOCSPX-xyz123`
   - Copy both values

### Step 4: Update Environment Files

1. **Backend `.env`** (d:\New folder (4)\Batchmate Textbook Exchanger\backend\.env)
   ```
   GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
   ```

2. **Frontend `.env`** (d:\New folder (4)\Batchmate Textbook Exchanger\frontend\.env)
   ```
   VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   ```

   ⚠️ **IMPORTANT**: Use the SAME Client ID in both files!

---

## 3. Cloudinary Setup (REQUIRED for file uploads)

### Step 1: Create Account

1. **Sign Up**
   - Visit: https://cloudinary.com/users/register/free
   - Create free account

### Step 2: Get Credentials

1. **Go to Dashboard**
   - After login, you'll see your dashboard
   - Find these values:
     - **Cloud Name**: `dxxxxxxxx`
     - **API Key**: `123456789012345`
     - **API Secret**: `abcdefghijklmnopqrstuvwxyz`

### Step 3: Update Backend `.env`

```
CLOUDINARY_CLOUD_NAME=dxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

---

## 4. Start the Application

### Terminal 1: Backend
```bash
cd "d:\New folder (4)\Batchmate Textbook Exchanger\backend"
npm run dev
```

**Expected Output:**
```
🎓 Batchmate API Server
Port: 5000
Environment: development
MongoDB: Connected
Server: http://localhost:5000
```

### Terminal 2: Frontend
```bash
cd "d:\New folder (4)\Batchmate Textbook Exchanger\frontend"
npm run dev
```

**Expected Output:**
```
VITE v5.4.21  ready in 1017 ms
➜  Local:   http://localhost:3000/
```

---

## 5. Test the Application

1. **Open Browser**
   - Navigate to: http://localhost:3000

2. **Click "Get Started"**
   - You should see the login page

3. **Click "Sign in with Google"**
   - Use your college email (ending in .edu or .ac.in)
   - Complete registration with department and semester

4. **Upload Notes or List Books**
   - Test the functionality!

---

## Troubleshooting

### Error: "MongoDB connection failed"
- **Solution**: Make sure MongoDB is running
  - Local: Start MongoDB service
  - Atlas: Check connection string and network access

### Error: "invalid_client" (OAuth)
- **Solution**: 
  - Verify Client ID matches in both `.env` files
  - Check authorized origins in Google Console
  - Make sure OAuth consent screen is configured

### Error: "Cloudinary upload failed"
- **Solution**: 
  - Verify all 3 Cloudinary credentials are correct
  - Check API key is not expired

### Port Already in Use
- **Solution**:
  - Backend: Change `PORT=5000` to `PORT=5001` in backend/.env
  - Frontend: Change port in vite.config.js

---

## Quick Reference

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Google Console | https://console.cloud.google.com/ |
| MongoDB Atlas | https://cloud.mongodb.com/ |
| Cloudinary | https://cloudinary.com/console |

---

## Next Steps

1. ✅ Install MongoDB
2. ✅ Create Google OAuth credentials
3. ✅ Create Cloudinary account
4. ✅ Update both `.env` files
5. ✅ Start backend and frontend
6. ✅ Test with your college email

**Need help?** Check the error messages in the terminal and refer to the troubleshooting section above.
