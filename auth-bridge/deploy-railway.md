# 🚀 Deploy Auth Bridge to Railway

Quick deployment guide for the TrackMail Auth Bridge service.

## Prerequisites

- Railway account (free tier available)
- GitHub repository with TrackMail code
- Supabase credentials

## Step 1: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `trackmail` repository
5. **Important**: Set the root directory to `auth-bridge`

## Step 2: Configure Environment Variables

In the Railway dashboard, go to your project → Variables tab and add:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=8001
SESSION_TTL_SECONDS=3600
TOKEN_TTL_SECONDS=300
```

## Step 3: Deploy

Railway will automatically:
- Install Python dependencies from `requirements.txt`
- Start the FastAPI application
- Generate a public URL

## Step 4: Test Deployment

Visit your Railway URL + `/health`:
```
https://your-project.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "active_sessions": 0,
  "supabase_configured": true
}
```

## Step 5: Update Gmail Add-on

Update the `AUTH_BRIDGE_URL` in your Gmail Add-on files:

```javascript
// In gmail-addon/Auth.gs
const AUTH_BRIDGE_URL = 'https://your-project.up.railway.app';
```

## Troubleshooting

### Common Issues

**"Supabase not configured"**
- Check environment variables are set correctly
- Verify Supabase URL and keys are valid

**"Port binding error"**
- Railway automatically sets PORT environment variable
- Don't override it manually

**"Module not found"**
- Check `requirements.txt` includes all dependencies
- Railway installs from this file automatically

### Debug Commands

```bash
# Check if service is running
curl https://your-project.up.railway.app/health

# Test session creation (requires Supabase auth)
curl -X POST https://your-project.up.railway.app/session/start \
  -H "Content-Type: application/json" \
  -d '{"access_token":"...","refresh_token":"...","user_email":"test@example.com","user_id":"123"}'
```

## Production Considerations

### Security
- Sessions are stored in-memory (resets on restart)
- For production, consider Redis for session storage
- Rate limiting is built-in (20 requests/minute per session)

### Scaling
- Railway auto-scales based on traffic
- Free tier includes 500 hours/month
- Upgrade for higher limits if needed

### Monitoring
- Check Railway dashboard for logs
- Monitor `/health` endpoint
- Set up alerts for downtime

## Next Steps

1. ✅ Deploy Auth Bridge to Railway
2. ✅ Test health endpoint
3. ✅ Update Gmail Add-on URLs
4. ✅ Deploy Gmail Add-on to Apps Script
5. ✅ Test complete authentication flow

---

**Your Auth Bridge is now live!** 🚀

The Gmail Add-on can now authenticate users through this service.