# 🚀 Deploy Auth Bridge to Render

Quick deployment guide for the TrackMail Auth Bridge service on Render.

## Prerequisites

- Render account (free tier available)
- GitHub repository with TrackMail code
- Supabase credentials

## Step 1: Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select the `trackmail` repository
5. **Important**: Set the root directory to `auth-bridge`

## Step 2: Configure Service

### Basic Settings
- **Name**: `trackmail-auth-bridge`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Instance Type**: `Free` (to start)

### Advanced Settings
Click "Advanced" and add these environment variables:

```bash
SUPABASE_URL=https://fvpggfqkmldgwjbanwyr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzY5MjIsImV4cCI6MjA3NTg1MjkyMn0.bqVIUz4t-s6Tc-tmglITDTm1KeY5panOfTKkFzzqTwQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI3NjkyMiwiZXhwIjoyMDc1ODUyOTIyfQ.IOS86Nz_skmn_xiv9-cEX_RM82duRkXo_Ro28_Ct_vk
PORT=8001
SESSION_TTL_SECONDS=3600
TOKEN_TTL_SECONDS=300
```

## Step 3: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete (2-3 minutes)
3. Note the generated URL (e.g., `https://trackmail-auth-bridge.onrender.com`)

## Step 4: Test Deployment

### Test Health Endpoint
```bash
curl https://trackmail-auth-bridge.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "active_sessions": 0,
  "supabase_configured": true
}
```

### Test Main Page
Visit: `https://trackmail-auth-bridge.onrender.com`

**Expected Result**: TrackMail sign-in page with:
- "📧 TrackMail" header
- Email and password input fields
- "Sign In" button

## Step 5: Update Gmail Add-on

Update the `AUTH_BRIDGE_URL` in your Gmail Add-on files:

```javascript
// In gmail-addon/Auth.gs
const AUTH_BRIDGE_URL = 'https://trackmail-auth-bridge.onrender.com';
```

## Troubleshooting

### Common Issues

**"Supabase not configured"**
- Check environment variables are set correctly
- Verify Supabase URL and keys are valid

**"Module not found"**
- Check `requirements.txt` includes all dependencies
- Render installs from this file automatically

**"Service not starting"**
- Check Render service logs
- Verify start command is correct

### Debug Commands

```bash
# Check if service is running
curl https://trackmail-auth-bridge.onrender.com/health

# Test session creation (requires Supabase auth)
curl -X POST https://trackmail-auth-bridge.onrender.com/session/start \
  -H "Content-Type: application/json" \
  -d '{"access_token":"...","refresh_token":"...","user_email":"test@example.com","user_id":"123"}'
```

## Production Considerations

### Security
- Sessions are stored in-memory (resets on restart)
- Rate limiting is built-in (20 requests/minute per session)
- CORS configured for Gmail Add-on

### Scaling
- Render auto-scales based on traffic
- Free tier includes 750 hours/month
- Upgrade for higher limits if needed

### Monitoring
- Check Render dashboard for logs
- Monitor `/health` endpoint
- Set up alerts for downtime

## Next Steps

1. ✅ Deploy Auth Bridge to Render
2. ✅ Test health endpoint
3. ✅ Update Gmail Add-on URLs
4. ✅ Deploy Gmail Add-on to Apps Script
5. ✅ Test complete authentication flow

---

**Your Auth Bridge is now live on Render!** 🚀

The Gmail Add-on can now authenticate users through this service.
