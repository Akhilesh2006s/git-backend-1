# Railway Environment Variables

Set these environment variables in your Railway dashboard:

## Required Environment Variables:

```
MONGODB_URI=mongodb://mongo:27017/exportease
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
GEMINI_API_KEY=your-gemini-api-key-here
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## How to set them in Railway:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add each variable with its value
5. Redeploy your service

## Important Notes:

- Replace `your-super-secret-jwt-key-here` with a strong, random secret key
- Replace `your-gemini-api-key-here` with your actual Gemini API key
- Replace `https://your-frontend-domain.com` with your actual frontend URL
- The MONGODB_URI should be automatically provided by Railway if you're using their MongoDB service
