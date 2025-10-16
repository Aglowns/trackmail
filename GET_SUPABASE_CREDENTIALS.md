# 🔑 How to Get Your Supabase Credentials

## Quick Steps

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Sign in to your account

2. **Select Your Project**
   - Click on your TrackMail project
   - (If you don't have one, create a new project first)

3. **Navigate to API Settings**
   - Click on ⚙️ **Settings** in the left sidebar
   - Click on **API** in the settings menu

4. **Copy Your Credentials**

   You'll see two sections:

   ### Project URL
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   📋 This is your `SUPABASE_URL`

   ### Project API Keys
   
   Under "Project API keys" you'll see:
   
   - **anon / public** (Click the eye icon to reveal)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   📋 This is your `SUPABASE_ANON_KEY`

## What to Do Next

Once you have both values:

### Option 1: Using Railway CLI (Recommended)

```powershell
# Make sure you're in the auth-bridge directory
cd auth-bridge

# Set SUPABASE_URL (replace with your actual URL)
railway variables set SUPABASE_URL=https://your-project.supabase.co

# Set SUPABASE_ANON_KEY (replace with your actual key)
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Deploy!
railway up
```

### Option 2: Using Railway Dashboard

1. Go to: https://railway.app/dashboard
2. Select your "trackmail" project
3. Create a new service called "auth-bridge"
4. Click **Variables** tab
5. Add variables:
   - Name: `SUPABASE_URL`, Value: (your URL)
   - Name: `SUPABASE_ANON_KEY`, Value: (your key)
6. Click **Deployments** tab
7. Click **Deploy**

## Verification

After setting variables, verify they're set:

```powershell
railway variables
```

You should see:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

## Security Note

⚠️ **IMPORTANT**: These are sensitive credentials!

- ✅ DO: Use environment variables (never hardcode)
- ✅ DO: Keep them secret
- ❌ DON'T: Commit them to git
- ❌ DON'T: Share them publicly

The `.env` file is already in `.gitignore` to protect your credentials.

## Next Command

Once variables are set, deploy with:

```powershell
railway up
```

This will:
1. Package your code
2. Upload to Railway
3. Build Docker container
4. Deploy and start service
5. Give you a URL

Expected output:
```
✓ Build completed
✓ Deployment live
🎉 Service URL: https://auth-bridge-production-xxxx.up.railway.app
```

## Need Help?

If you don't have a Supabase project yet:
1. Visit: https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - Name: trackmail
   - Database Password: (create a strong password)
   - Region: (closest to you)
4. Wait for project creation (~2 minutes)
5. Follow the steps above to get credentials

## Already Have the Backend Running?

If you already deployed the TrackMail backend, you should already have these credentials! Check:

- Your `.env` file in the main `trackmail` directory
- Your Railway/Cloud Run environment variables for the backend
- The `SUPABASE_SETUP.md` file

---

**Ready to deploy?** Once you have your credentials, run the commands above! 🚀

