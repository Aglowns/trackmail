# Railway Deployment Instructions

## Current Status
✅ Railway CLI installed
✅ Logged in to Railway
✅ Project "trackmail" created

## Next Steps

### 1. Set Environment Variables

You need to set your Supabase credentials. Replace the values below with your actual credentials:

```bash
# Set Supabase URL
railway variables set SUPABASE_URL=https://your-project.supabase.co

# Set Supabase Anon Key
railway variables set SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Deploy the Service

```bash
railway up
```

This will:
- Package your code
- Upload to Railway
- Build the Docker container
- Deploy the service
- Provide you with a URL

### 3. Get Your Deployment URL

```bash
# Check deployment status
railway status

# Get the URL (or check Railway dashboard)
railway domain
```

### 4. Test Your Deployment

Once deployed, open the URL in your browser. You should see the TrackMail sign-in page.

## Finding Your Supabase Credentials

1. Go to: https://app.supabase.com
2. Select your project
3. Click on **Settings** (gear icon) in the left sidebar
4. Click **API**
5. You'll find:
   - **Project URL**: This is your `SUPABASE_URL`
   - **anon/public key**: This is your `SUPABASE_ANON_KEY`

## Troubleshooting

### "Project not found"
Run: `railway init` and select your project

### "Not logged in"
Run: `railway login` and authenticate in browser

### "Build failed"
Check Railway dashboard for build logs

### Need to see logs
Run: `railway logs`

## Alternative: Using Railway Dashboard

1. Go to: https://railway.app/dashboard
2. Select your "trackmail" project
3. Click "New Service" → "Empty Service"
4. Name it: "auth-bridge"
5. In the service:
   - Click "Variables" tab
   - Add: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Click "Settings" tab
   - Connect to GitHub (or use CLI deployment)

## What's Next After Deployment?

Once deployed, you'll receive a URL like:
`https://auth-bridge-production-xxxx.up.railway.app`

Save this URL! You'll need it for the Gmail Add-on configuration.

Then proceed to **Step 2** in the main deployment guide: Creating the Gmail Add-on.

