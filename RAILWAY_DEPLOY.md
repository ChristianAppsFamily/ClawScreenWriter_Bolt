# Railway Deployment Guide

## Environment Variables Required

Set these in your Railway project dashboard:

### Required Variables

```
VITE_SUPABASE_URL=https://ywrapqcoucviwvzolmrp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyYXBxcWNvdWN2aXd2em9sbXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MzIwMDAsImV4cCI6MjA1MjQwODAwMH0.example
VITE_API_URL=https://clawscreenwriter-production.up.railway.app/api
```

**Note:** Get the actual `VITE_SUPABASE_ANON_KEY` from your Supabase dashboard:
1. Go to https://supabase.com/dashboard
2. Select project: ywrapqcoucviwvzolmrp
3. Project Settings → API
4. Copy "anon public" key

### Build Settings

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npx serve dist -s -l 8080`
- **Healthcheck Path:** `/`

## Backend CORS Configuration

Add this to your Railway backend to allow frontend requests:

```javascript
// CORS middleware for Express
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://clawscreenwriter-frontend-production.up.railway.app',
    'http://localhost:5173',
    'http://localhost:8080'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

Or if using the `cors` package:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://clawscreenwriter-frontend-production.up.railway.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

## Deployment Steps

1. **Create Railway Project**
   - Go to railway.app
   - New Project → Deploy from GitHub repo
   - Select: ChristianAppsFamily/ClawScreenWriter_Bolt

2. **Set Environment Variables**
   - Go to Variables tab
   - Add all variables listed above
   - Use actual Supabase anon key from dashboard

3. **Deploy**
   - Railway will auto-deploy on push
   - Or trigger manual deploy

4. **Verify**
   - Check deployment logs
   - Test health endpoint: `https://your-frontend-url.railway.app/`
   - Test API connection

## Troubleshooting

- **Build fails:** Check that all env vars are set before first deploy
- **CORS errors:** Update backend CORS config with actual frontend URL
- **API 404s:** Verify `VITE_API_URL` ends with `/api` not `/api/`
