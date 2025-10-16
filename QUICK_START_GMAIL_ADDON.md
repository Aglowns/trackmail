# 🚀 Quick Start: Gmail Add-on

**Get up and running with the TrackMail Gmail Add-on in 15 minutes!**

## Prerequisites

- [ ] Google Account
- [ ] Supabase project (with URL and Anon Key)
- [ ] TrackMail backend running
- [ ] Railway or Cloud Run account (for Auth Bridge)

## Step 1: Deploy Auth Bridge (5 minutes)

### Option A: Railway (Recommended)

```bash
cd auth-bridge

# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Set environment variables
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_ANON_KEY=your-anon-key-here

# Deploy
railway up

# Get your URL
railway domain
```

Your Auth Bridge URL will be: `https://auth-bridge-production-xxxx.up.railway.app`

### Option B: Cloud Run

```bash
cd auth-bridge

gcloud run deploy auth-bridge \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=https://your-project.supabase.co,SUPABASE_ANON_KEY=your-anon-key
```

## Step 2: Create Gmail Add-on (5 minutes)

### A. Create Project

1. Go to: https://script.google.com
2. Click **New Project**
3. Name it: "TrackMail"

### B. Enable Manifest

1. Click ⚙️ **Project Settings**
2. Check ☑️ "Show appsscript.json manifest file in editor"

### C. Add Files

Create these files and copy contents from `gmail-addon/`:

1. **Code.gs** → Copy from `gmail-addon/Code.gs`
2. **Auth.gs** → Copy from `gmail-addon/Auth.gs`
3. **API.gs** → Copy from `gmail-addon/API.gs`
4. **UI.gs** → Copy from `gmail-addon/UI.gs`
5. **appsscript.json** → Copy from `gmail-addon/appsscript.json`

### D. Configure URLs

In `Auth.gs`, update these lines (around line 15-16):

```javascript
const AUTH_BRIDGE_URL = 'https://your-auth-bridge.railway.app'; // Your Railway URL
const BACKEND_API_URL = 'https://your-backend.com/v1';          // Your backend URL
```

### E. Enable Gmail API

1. Click ➕ **Services**
2. Find "Gmail API"
3. Click **Add**

## Step 3: Deploy Add-on (2 minutes)

1. Click **Deploy** → **Test deployments**
2. Click **Install**
3. New Gmail window opens with add-on installed ✅

## Step 4: Test It! (3 minutes)

### First Time Setup

1. Open Gmail (in the new window)
2. Open any email
3. Click 📧 TrackMail icon in right sidebar
4. Click **Sign In with TrackMail**
5. Browser opens → Sign in with your Supabase credentials
6. Copy the session handle shown
7. Go back to Gmail
8. Paste session handle in the input field
9. Click **Save Session**
10. See "Authentication successful!" ✅

### Track Your First Application

1. Open a job application email
2. TrackMail sidebar shows email preview
3. Click **📌 Track This Application**
4. See success message with application ID ✅
5. Check your backend dashboard → Application created! 🎉

## 🎉 You're Done!

You can now track job applications directly from Gmail!

## Common Commands

### View Logs (Apps Script)
```
In Apps Script Editor: View → Executions
```

### Test Auth Bridge Locally
```bash
cd auth-bridge
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
# Open: http://localhost:8001
```

### Test Backend Locally
```bash
cd trackmail
uvicorn app.main:app --reload --port 8000
# Open: http://localhost:8000/docs
```

## Troubleshooting

### "Authentication required"
→ Sign in again, session may have expired

### "Failed to fetch email data"
→ Check Gmail API is added as a service

### "API request failed"
→ Verify backend URL in Auth.gs is correct

### "Could not extract information"
→ Email may not be a job application email

## Next Steps

- 📖 Read full guide: `GMAIL_ADDON_SETUP.md`
- 🧪 Run tests: `TESTING_GUIDE.md`
- 📋 See complete docs: `GMAIL_ADDON_IMPLEMENTATION_SUMMARY.md`

## Quick Links

- **Apps Script Editor**: https://script.google.com
- **Gmail**: https://mail.google.com
- **Railway Dashboard**: https://railway.app/dashboard
- **Supabase Dashboard**: https://app.supabase.com

---

**Need help?** Check `GMAIL_ADDON_SETUP.md` for detailed troubleshooting.

**Questions?** See `GMAIL_ADDON_IMPLEMENTATION_SUMMARY.md` for architecture details.

