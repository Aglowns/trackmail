# 🚀 TrackMail Gmail Add-on - Quick Setup

## ✅ **Correct Architecture**

```
Gmail Add-on (Apps Script) → Auth Bridge (Railway) → Backend API (Render) → Supabase
```

## 🎯 **What You Need to Deploy**

### 1. **Auth Bridge Service** (Railway)
- **Purpose**: Handles authentication between Gmail Add-on and your backend
- **Location**: `auth-bridge/` folder
- **Platform**: Railway (separate from your main backend)

### 2. **Gmail Add-on** (Apps Script)
- **Purpose**: Gmail sidebar interface for tracking emails
- **Location**: `gmail-addon/` folder  
- **Platform**: Google Apps Script

### 3. **Backend API** (Render) ✅ **Already Deployed**
- **Purpose**: Your main TrackMail backend
- **Status**: Already deployed on Render
- **URL**: `https://your-render-backend.onrender.com`

## 🚀 **Step 1: Deploy Auth Bridge to Railway**

### 1.1 Create Railway Project
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `trackmail` repository
4. **Important**: Set root directory to `auth-bridge`

### 1.2 Configure Environment Variables
In Railway dashboard, add these variables:

```bash
SUPABASE_URL=https://fvpggfqkmldgwjbanwyr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzY5MjIsImV4cCI6MjA3NTg1MjkyMn0.bqVIUz4t-s6Tc-tmglITDTm1KeY5panOfTKkFzzqTwQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI3NjkyMiwiZXhwIjoyMDc1ODUyOTIyfQ.IOS86Nz_skmn_xiv9-cEX_RM82duRkXo_Ro28_Ct_vk
PORT=8001
```

### 1.3 Get Auth Bridge URL
After deployment, Railway will give you a URL like:
`https://trackmail-auth-bridge-production.up.railway.app`

## 🚀 **Step 2: Update Gmail Add-on URLs**

### 2.1 Find Your Render Backend URL
Check your Render dashboard for your backend URL (should be like `https://trackmail-backend-xxxxx.onrender.com`)

### 2.2 Update Gmail Add-on Configuration
In `gmail-addon/Auth.gs`, update these lines:

```javascript
// Update these URLs:
const AUTH_BRIDGE_URL = 'https://your-auth-bridge-url.up.railway.app';
const BACKEND_API_URL = 'https://your-render-backend.onrender.com/v1';
```

## 🚀 **Step 3: Deploy Gmail Add-on**

### 3.1 Create Apps Script Project
1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Name it "TrackMail Gmail Add-on"

### 3.2 Upload Files
1. Delete default `Code.gs`
2. Create these files with content from `gmail-addon/`:
   - `Code.gs`
   - `Auth.gs` 
   - `API.gs`
   - `UI.gs`
   - `appsscript.json`

### 3.3 Enable Gmail API
1. In Apps Script, go to "Services"
2. Add "Gmail API" service

### 3.4 Deploy as Gmail Add-on
1. Click "Deploy" → "New deployment"
2. Choose "Add-on" type
3. Fill in details and deploy

## 🧪 **Step 4: Test Complete Flow**

### 4.1 Test Auth Bridge
```bash
curl https://your-auth-bridge-url.up.railway.app/health
```

### 4.2 Test Backend API
```bash
curl https://your-render-backend.onrender.com/health
```

### 4.3 Test Gmail Add-on
1. Open Gmail
2. Open any email
3. Look for TrackMail in sidebar
4. Sign in and test tracking

## 🎯 **Summary**

**What's Already Done:**
- ✅ Backend API deployed on Render
- ✅ Frontend deployed on Vercel
- ✅ Supabase configured

**What You Need to Do:**
1. Deploy Auth Bridge to Railway
2. Update Gmail Add-on URLs with your actual URLs
3. Deploy Gmail Add-on to Apps Script
4. Test the complete flow

**Final Architecture:**
```
Gmail Add-on (Apps Script) → Auth Bridge (Railway) → Backend API (Render) → Supabase
```

---

**Ready to deploy!** 🚀
