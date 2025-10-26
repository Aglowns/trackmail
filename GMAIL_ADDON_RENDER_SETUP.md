# 🚀 TrackMail Gmail Add-on - Render Setup

## ✅ **Updated Architecture (All on Render)**

```
Gmail Add-on (Apps Script) → Auth Bridge (Render) → Backend API (Render) → Supabase
```

## 🎯 **What You Need to Deploy**

### 1. **Auth Bridge Service** (Render) - **NEW**
- **Purpose**: Handles authentication between Gmail Add-on and your backend
- **Location**: `auth-bridge/` folder
- **Platform**: Render (separate service)

### 2. **Gmail Add-on** (Apps Script)
- **Purpose**: Gmail sidebar interface for tracking emails
- **Location**: `gmail-addon/` folder  
- **Platform**: Google Apps Script

### 3. **Backend API** (Render) ✅ **Already Deployed**
- **Purpose**: Your main TrackMail backend
- **Status**: Already deployed on Render
- **URL**: `https://your-render-backend.onrender.com`

## 🚀 **Step 1: Deploy Auth Bridge to Render**

### 1.1 Create Render Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select the `trackmail` repository
5. **Important**: Set the root directory to `auth-bridge`

### 1.2 Configure Service
- **Name**: `trackmail-auth-bridge`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Instance Type**: `Free` (to start)

### 1.3 Configure Environment Variables
In Render dashboard, add these variables:

```bash
SUPABASE_URL=https://fvpggfqkmldgwjbanwyr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzY5MjIsImV4cCI6MjA3NTg1MjkyMn0.bqVIUz4t-s6Tc-tmglITDTm1KeY5panOfTKkFzzqTwQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI3NjkyMiwiZXhwIjoyMDc1ODUyOTIyfQ.IOS86Nz_skmn_xiv9-cEX_RM82duRkXo_Ro28_Ct_vk
PORT=8001
SESSION_TTL_SECONDS=3600
TOKEN_TTL_SECONDS=300
```

### 1.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete (2-3 minutes)
3. Note the generated URL: `https://trackmail-auth-bridge.onrender.com`

## 🚀 **Step 2: Update Gmail Add-on URLs**

### 2.1 Find Your Backend URL
Check your Render dashboard for your backend URL (should be like `https://trackmail-backend-xxxxx.onrender.com`)

### 2.2 Update Gmail Add-on Configuration
The Gmail Add-on is already configured with the correct Render URLs:

```javascript
// In gmail-addon/Auth.gs (already updated)
const AUTH_BRIDGE_URL = 'https://trackmail-auth-bridge.onrender.com';
const BACKEND_API_URL = 'https://your-render-backend.onrender.com/v1';
```

**You just need to replace `your-render-backend` with your actual backend URL!**

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
- ✅ Auth Bridge code ready
- ✅ Gmail Add-on code ready

**What You Need to Do:**
1. Deploy Auth Bridge to Render (new service)
2. Update Gmail Add-on with your actual backend URL
3. Deploy Gmail Add-on to Apps Script
4. Test the complete flow

**Final Architecture:**
```
Gmail Add-on (Apps Script) → Auth Bridge (Render) → Backend API (Render) → Supabase
```

---

**Everything is now configured for Render!** 🚀

Both your backend and auth bridge will be on Render, keeping everything consistent and in one place.
