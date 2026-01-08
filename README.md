# PSC Challenger 🏆

**PSC Challenger** is a gamified learning platform designed to help users prepare for PSC exams through engaging quizzes, story modes, and daily challenges. It combines education with gaming elements to make learning fun and effective.

## ✨ Key Features

### 🎮 Gamified Learning
- **Story Mode**: Progress through levels, earn stars, and unlock new challenges.
- **Daily Quizzes**: Fresh set of questions every day to keep your knowledge sharp.
- **Practice Mode**: Revisit topics and improve your weak areas.
- **Leaderboard**: Compete with other learners and see where you stand globally.
- **Streaks & Scores**: Track your consistency and total points.

### 📱 Progressive Web App (PWA)
- **Installable**: Works like a native app on Android, iOS, and Windows.
- **Native Feel**: Optimized for touch, no overscroll, and full-screen experience.
- **Offline Support**: Access the app even with poor internet connectivity.
- **Smart Install Prompt**: Guided installation experience for all platforms.

### 🔐 Authentication & User Profile
- **Google Login**: One-tap secure sign-in with Google.
- **Profile Customization**: Set your preferred language (English/Malayalam) and update contact details.
- **Role-Based Access**: Separate dashboards for Users and Admins.

### 🛠️ Admin & Management
- **Admin Dashboard**: Manage questions, levels, and view user stats.
- **Multiple Admins**: Support for multiple administrators to manage the platform.
- **Push Notifications**: Send updates and reminders to users (VAPID support).

## 🚀 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: Passport.js (Google OAuth), JWT
- **PWA**: Vite PWA Plugin, Workbox

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/psc-challenger.git
   cd psc-challenger
   ```

2. **Install Dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:5173
   ADMIN_EMAILS=admin1@example.com,admin2@example.com
   PUBLIC_VAPID_KEY=your_public_key
   PRIVATE_VAPID_KEY=your_private_key
   ```

4. **Run Locally**
   ```bash
   # Run Backend (from backend dir)
   npm run dev

   # Run Frontend (from frontend dir)
   npm run dev
   ```

## 📱 Mobile Support
PSC Challenger is fully responsive and optimized for mobile devices. Add it to your home screen for the best experience!

## 📄 License
This project is licensed under the MIT License.
