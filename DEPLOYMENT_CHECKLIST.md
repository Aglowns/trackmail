# 📋 Deployment Checklist for Gmail Add-on

Use this checklist to track your deployment progress.

## Prerequisites ✅

- [ ] **Google Account** - For Apps Script and Gmail
- [ ] **Supabase Project** - Get your credentials ready
  - [ ] Supabase URL: `https://xxxxx.supabase.co`
  - [ ] Supabase Anon Key: `eyJxxx...`
  - [ ] Database migrations applied
  - [ ] RLS policies configured
- [ ] **Backend API Running** - Main TrackMail backend
  - [ ] Deployed and accessible
  - [ ] URL: `https://your-backend.com`
  - [ ] Health check passes: `/health`

## Step 1: Deploy Auth Bridge (⏱️ 5 minutes)

### Option A: Railway (Recommended)

- [ ] **Install Railway CLI**
  ```bash
  npm install -g @railway/cli
  ```

- [ ] **Login to Railway**
  ```bash
  cd auth-bridge
  railway login
  ```

- [ ] **Initialize Project**
  ```bash
  railway init
  # Select "Create new project"
  # Name: trackmail-auth-bridge
  ```

- [ ] **Set Environment Variables**
  ```bash
  railway variables set SUPABASE_URL=https://your-project.supabase.co
  railway variables set SUPABASE_ANON_KEY=your-anon-key-here
  ```

- [ ] **Deploy**
  ```bash
  railway up
  ```

- [ ] **Get Deployment URL**
  ```bash
  railway domain
  # Or check Railway dashboard
  ```

- [ ] **Test Auth Bridge**
  - [ ] Open URL in browser
  - [ ] See sign-in page
  - [ ] Try signing in
  - [ ] Verify session handle appears

- [ ] **Save Auth Bridge URL**: `_____________________________`

### Option B: Cloud Run

- [ ] **Deploy to Cloud Run**
  ```bash
  cd auth-bridge
  gcloud run deploy auth-bridge \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars SUPABASE_URL=your-url,SUPABASE_ANON_KEY=your-key
  ```

- [ ] **Save Service URL**: `_____________________________`

- [ ] **Test deployment** (open URL in browser)

### Option C: Local Testing (Development Only)

- [ ] **Update .env file** in `auth-bridge/` directory
  ```bash
  # Edit auth-bridge/.env with your Supabase credentials
  ```

- [ ] **Install dependencies**
  ```bash
  cd auth-bridge
  pip install -r requirements.txt
  ```

- [ ] **Run locally**
  ```bash
  uvicorn main:app --reload --port 8001
  ```

- [ ] **Test**: Open http://localhost:8001

- [ ] **Expose with ngrok** (for Gmail Add-on to access)
  ```bash
  ngrok http 8001
  ```

- [ ] **Save ngrok URL**: `_____________________________`

## Step 2: Create Gmail Add-on (⏱️ 5 minutes)

### A. Create Apps Script Project

- [ ] **Go to**: https://script.google.com
- [ ] **Click**: "New Project"
- [ ] **Name**: "TrackMail"
- [ ] **Save Project ID**: `_____________________________`

### B. Enable Manifest File

- [ ] Click ⚙️ **Project Settings**
- [ ] Check ☑️ "Show appsscript.json manifest file in editor"
- [ ] Go back to **Editor**

### C. Create Files

Create each file and copy contents from `gmail-addon/`:

- [ ] **Code.gs**
  - [ ] Create file: Click ➕ > Script
  - [ ] Name: "Code"
  - [ ] Copy from: `gmail-addon/Code.gs`
  - [ ] Paste and save

- [ ] **Auth.gs**
  - [ ] Create file: Click ➕ > Script
  - [ ] Name: "Auth"
  - [ ] Copy from: `gmail-addon/Auth.gs`
  - [ ] Paste and save

- [ ] **API.gs**
  - [ ] Create file: Click ➕ > Script
  - [ ] Name: "API"
  - [ ] Copy from: `gmail-addon/API.gs`
  - [ ] Paste and save

- [ ] **UI.gs**
  - [ ] Create file: Click ➕ > Script
  - [ ] Name: "UI"
  - [ ] Copy from: `gmail-addon/UI.gs`
  - [ ] Paste and save

- [ ] **appsscript.json**
  - [ ] Click on existing `appsscript.json` in file list
  - [ ] Replace all content with: `gmail-addon/appsscript.json`
  - [ ] Save

### D. Configure URLs

- [ ] **Open Auth.gs**
- [ ] **Find lines 15-16** (around there)
- [ ] **Update AUTH_BRIDGE_URL**:
  ```javascript
  const AUTH_BRIDGE_URL = 'YOUR_AUTH_BRIDGE_URL_HERE';
  ```
- [ ] **Update BACKEND_API_URL**:
  ```javascript
  const BACKEND_API_URL = 'YOUR_BACKEND_URL_HERE/v1';
  ```
- [ ] **Save** (Ctrl+S or Cmd+S)

### E. Enable Gmail API

- [ ] Click ➕ next to **Services**
- [ ] Find "Gmail API" in the list
- [ ] Click **Add**
- [ ] Verify "Gmail" appears under Services

## Step 3: Deploy Add-on (⏱️ 2 minutes)

### A. Create Test Deployment

- [ ] Click **Deploy** (top right)
- [ ] Select **Test deployments**
- [ ] Click **Install**
- [ ] **Authorize** when prompted
  - [ ] Choose your Google account
  - [ ] Review permissions
  - [ ] Click "Allow"
- [ ] New Gmail window opens

### B. Verify Installation

- [ ] Gmail opens in new window/tab
- [ ] Open any email
- [ ] Look for TrackMail icon in right sidebar
- [ ] Click the icon
- [ ] Verify add-on loads (shows sign-in card)

## Step 4: Test End-to-End (⏱️ 3 minutes)

### A. First-Time Authentication

- [ ] **Open Gmail** (with add-on installed)
- [ ] **Open any email**
- [ ] **Click TrackMail icon** in sidebar
- [ ] **Click "Sign In with TrackMail"** button
- [ ] **Browser opens** to Auth Bridge
- [ ] **Sign in** with email/password
- [ ] **See session handle** displayed
- [ ] **Copy session handle** (click button or select text)
- [ ] **Return to Gmail**
- [ ] **Paste session handle** in input field
- [ ] **Click "Save Session"**
- [ ] **Verify success**: "Authentication successful!" message
- [ ] **Note**: Email shown in sidebar header

### B. Track First Application

- [ ] **Find a job application email** (or any email to test)
- [ ] **Open the email**
- [ ] **TrackMail sidebar** shows email preview
  - [ ] From: (sender)
  - [ ] Subject: (subject line)
  - [ ] Date: (date)
- [ ] **Click "📌 Track This Application"**
- [ ] **Wait for processing** (~2-3 seconds)
- [ ] **See success message**:
  - [ ] "Application tracked successfully!"
  - [ ] Application ID shown
- [ ] **Open backend dashboard** (or database)
- [ ] **Verify application created** ✅

### C. Test Additional Features

- [ ] **Test Parsing**:
  - [ ] Open another email
  - [ ] Click "🔍 Test Parsing"
  - [ ] See parsing results (company, position, status)
  - [ ] Confidence score shown
  - [ ] Click "Back"

- [ ] **Duplicate Detection**:
  - [ ] Track the same email again
  - [ ] See "This email was already tracked" message
  - [ ] Same application ID returned

- [ ] **Sign Out**:
  - [ ] Click "Sign Out" button
  - [ ] Sign-in card appears again
  - [ ] Session cleared ✅

## Step 5: Final Verification (⏱️ 2 minutes)

### Health Checks

- [ ] **Auth Bridge Health**
  - [ ] Visit: `YOUR_AUTH_BRIDGE_URL/health`
  - [ ] Status: "healthy"
  - [ ] Active sessions count shown

- [ ] **Backend Health**
  - [ ] Visit: `YOUR_BACKEND_URL/health`
  - [ ] Status: "healthy"
  - [ ] Database connected

### Functionality Tests

- [ ] **Can sign in** ✅
- [ ] **Can track emails** ✅
- [ ] **Can test parsing** ✅
- [ ] **Duplicate detection works** ✅
- [ ] **Can sign out** ✅
- [ ] **Applications appear in database** ✅
- [ ] **No console errors** ✅

## Troubleshooting

### Common Issues Encountered

- [ ] **Issue**: _________________________________
- [ ] **Solution**: _________________________________

- [ ] **Issue**: _________________________________
- [ ] **Solution**: _________________________________

### Logs & Debugging

- [ ] **Apps Script Logs**:
  - Location: Apps Script Editor > View > Executions
  - Issues found: _________________________________

- [ ] **Auth Bridge Logs**:
  - Railway: `railway logs`
  - Cloud Run: Check Cloud Console
  - Issues found: _________________________________

- [ ] **Backend Logs**:
  - Issues found: _________________________________

## Deployment Information

### URLs & Credentials

| Service | URL | Status |
|---------|-----|--------|
| Auth Bridge | `_____________________` | ⚪ |
| Backend API | `_____________________` | ⚪ |
| Gmail Add-on | Apps Script Project | ⚪ |

### Environment Variables Configured

- [ ] Auth Bridge:
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SESSION_TTL_SECONDS (optional)
  - [ ] TOKEN_TTL_SECONDS (optional)

- [ ] Backend API:
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] DATABASE_URL
  - [ ] JWT_ISSUER

## Next Steps After Deployment

### For Personal Use
- [ ] Start tracking your job applications
- [ ] Monitor application statuses
- [ ] Set up email filters (optional)

### For Team/Public Use
- [ ] Create privacy policy
- [ ] Set up user documentation
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring/alerting
- [ ] Plan for marketplace submission (optional)

### Monitoring & Maintenance
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure uptime monitoring
- [ ] Schedule regular backups
- [ ] Plan for updates and improvements

## 🎉 Deployment Complete!

**Congratulations!** Your Gmail Add-on is now live and ready to use.

### Quick Stats
- **Deployment Date**: `____________________`
- **Total Time**: `______ minutes`
- **Components Deployed**: 3/3 ✅

### Share Your Success
- Take a screenshot of your first tracked application
- Share feedback or improvements
- Star the GitHub repo ⭐

---

**Need Help?**
- 📖 Full Setup Guide: `GMAIL_ADDON_SETUP.md`
- 🧪 Testing Guide: `TESTING_GUIDE.md`
- 🐛 Troubleshooting: `GMAIL_ADDON_SETUP.md#troubleshooting`

