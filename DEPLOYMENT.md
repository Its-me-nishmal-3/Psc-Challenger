# Deployment Guide - Daily Learning Quiz PWA

## Prerequisites
- Node.js v16+
- IoT or Cloud MongoDB Instance (Atlas recommended)
- Google Cloud Console Project (for OAuth)
- Gemini API Key

## Environment Variables
Create a `.env` file in the `backend` directory (and `frontend` if needed, though mostly handled by build).

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dailyquiz
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_secure_jwt_secret
ADMIN_EMAIL=admin@example.com
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=https://your-frontend-domain.com
```

## Local Development
1. Start Backend:
   ```bash
   cd backend
   npm install
   npm start
   ```
2. Start Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Production Deployment

### Option 1: Vercel (Frontend) + Render (Backend)

**Backend (Render/Railway/Heroku):**
1. Push `backend` folder to a git repo.
2. Connect to Render/Railway.
3. Set Build Command: `npm install`
4. Set Start Command: `node server.js`
5. Add Environment Variables.

**Frontend (Vercel/Netlify):**
1. Push `frontend` folder to a git repo.
2. Connect to Vercel.
3. Set Build Command: `npm run build`
4. Set Output Directory: `dist`
5. Add Environment Variables (if any needed for build).

### Option 2: VPS (Ubuntu/DigitalOcean)
1. Clone repo.
2. Install Nginx, Node, PM2.
3. Build Frontend: `cd frontend && npm run build`
4. Serve `frontend/dist` using Nginx.
5. Run Backend with PM2: `cd backend && pm2 start server.js`
6. Configure Nginx Proxy Pass for `/api` requests to `localhost:5000`.

## PWA Configuration
- The app is PWA-ready.
- Ensure `vite.config.js` has the correct `manifest` details.
- HTTPS is REQUIRED for Service Workers to register in production.

## Cron Job
- The internal Cron job runs at 9:00 PM IST.
- Ensure the Backend server is *always running* (not sleeping like on free Heroku/Render plans).
- Use a service like **Cron-job.org** to ping your API `/` endpoint every 10 mins to keep it awake, or upgrade to a paid plan.
