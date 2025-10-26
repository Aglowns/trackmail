# 🚀 TrackMail Gmail Add-on Deployment Guide

Complete step-by-step guide to deploy the TrackMail Gmail Add-on with your existing backend infrastructure.

## 📋 Prerequisites

- ✅ TrackMail Backend API deployed (Render)
- ✅ TrackMail Frontend deployed (Vercel)
- ✅ Supabase project configured
- ✅ Google Cloud Console access
- ✅ Gmail account for testing

## 🏗️ Architecture Overview

```
Gmail Add-on (Apps Script) → Auth Bridge (Render) → Backend API (Render) → Supabase
```

## 🚀 Step 1: Deploy Auth Bridge Service

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

In Render dashboard, add these environment variables:

```bash
SUPABASE_URL=https://fvpggfqkmldgwjbanwyr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzY5MjIsImV4cCI6MjA3NTg1MjkyMn0.bqVIUz4t-s6Tc-tmglITDTm1KeY5panOfTKkFzzqTwQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI3NjkyMiwiZXhwIjoyMDc1ODUyOTIyfQ.IOS86Nz_skmn_xiv9-cEX_RM82duRkXo_Ro28_Ct_vk
PORT=8001
SESSION_TTL_SECONDS=3600
TOKEN_TTL_SECONDS=300
```

### 1.4 Deploy ✅ **COMPLETED**

✅ **Auth Bridge Successfully Deployed!**
- **URL**: `https://trackmail-auth-bridge.onrender.com`
- **Status**: Live and running
- **Service ID**: `srv-d3qhdt56ubrc73fv9h6g`

## 🚀 Step 2: Update Gmail Add-on Configuration

### 2.1 Update URLs in Apps Script

The Gmail Add-on files are already configured with the correct URLs:

- **Auth Bridge**: `https://trackmail-auth-bridge.onrender.com` ✅ **LIVE**
- **Backend API**: `https://trackmail-backend1.onrender.com/v1` ✅ **LIVE**

### 2.2 Verify Configuration

Check these files have the correct URLs:
- `gmail-addon/Auth.gs` - Lines 16-17 ✅ **Already configured**
- `gmail-addon/API.gs` - Uses `getBackendApiUrl()` function ✅ **Already configured**

**Next Step**: ✅ **COMPLETED** - Backend URL updated in `gmail-addon/Auth.gs`

## 🚀 Step 3: Deploy Gmail Add-on

### 3.1 Create Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Name it "TrackMail Gmail Add-on"

### 3.2 Upload Files

1. **Delete** the default `Code.gs` file
2. Create new files for each component:

**File: `Code.gs`**
```javascript
// Copy content from gmail-addon/Code.gs
```

**File: `Auth.gs`**
```javascript
// Copy content from gmail-addon/Auth.gs
```

**File: `API.gs`**
```javascript
// Copy content from gmail-addon/API.gs
```

**File: `UI.gs`**
```javascript
// Copy content from gmail-addon/UI.gs
```

### 3.3 Configure Manifest

1. Click on `appsscript.json` in the file tree
2. Replace the content with the content from `gmail-addon/appsscript.json`

### 3.4 Enable Gmail API

1. In Apps Script, go to "Services" (left sidebar)
2. Click "Add a service"
3. Search for "Gmail API"
4. Click "Add"

### 3.5 Deploy as Gmail Add-on

1. Click "Deploy" → "New deployment"
2. Choose "Add-on" as the type
3. Fill in the details:
   - **Name**: TrackMail
   - **Description**: Track job applications from Gmail
   - **Logo**: Upload a 128x128 PNG logo
4. Click "Deploy"
5. **Important**: Copy the deployment ID for later use

## 🚀 Step 4: Configure Gmail Add-on

### 4.1 Enable in Gmail

1. Go to [Gmail](https://gmail.com)
2. Click the settings gear → "See all settings"
3. Go to "Add-ons" tab
4. Find "TrackMail" and click "Enable"

### 4.2 Test Authentication

1. Open any email in Gmail
2. Look for the TrackMail add-on in the right sidebar
3. Click "Sign In with TrackMail"
4. Complete the authentication flow
5. Paste the session handle when prompted

## 🧪 Step 5: Test the Complete Flow

### 5.0 Test Auth Bridge First

Before testing the Gmail Add-on, verify your auth bridge is working:

```bash
# Test auth bridge health
curl https://trackmail-auth-bridge.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "active_sessions": 0,
  "supabase_configured": true
}
```

### 5.1 Test Email Tracking

1. **Find a job application email** in your Gmail
2. **Open the email** (not compose)
3. **Look for TrackMail** in the right sidebar
4. **Click "Track This Application"**
5. **Verify success** - should show application created

### 5.2 Test Parsing

1. **Click "Test Parsing"** instead of tracking
2. **Review the results** - should show extracted company, position, status
3. **Verify confidence score** is reasonable

### 5.3 Verify in Backend

1. Go to your TrackMail frontend
2. Check that the application appears in your dashboard
3. Verify all fields are correctly populated

## 🔧 Troubleshooting

### Common Issues

**"Authentication required"**
- Solution: Sign out and sign in again in the Gmail Add-on

**"Failed to fetch email data"**
- Solution: Ensure Gmail API is enabled in Apps Script services

**"API request failed"**
- Solution: Check that your backend API is running and accessible

**"Could not extract sufficient information"**
- Solution: Email may not be a job application—try another email

### Debug Steps

1. **Check Apps Script logs**:
   - In Apps Script, go to "Executions"
   - Look for error messages in the logs

2. **Check Render logs**:
   - Go to your Render dashboard
   - Check logs for both Auth Bridge and Backend API

3. **Test endpoints manually**:
   ```bash
   # Test Auth Bridge
   curl https://trackmail-auth-bridge.onrender.com/health
   
   # Test Backend API
   curl https://trackmail-backend1.onrender.com/health
   ```

## 📊 Monitoring

### Health Checks

- **Auth Bridge**: `https://trackmail-auth-bridge.onrender.com/health`
- **Backend API**: `https://trackmail-backend1.onrender.com/health`

### Key Metrics

- Session creation rate
- Token request rate
- Email ingestion success rate
- Parsing confidence scores

## 🔐 Security Considerations

### Production Security

1. **Rate Limiting**: Auth Bridge has built-in rate limiting
2. **Session Expiry**: Sessions expire after 1 hour
3. **Token Expiry**: JWT tokens expire after 5 minutes
4. **CORS**: Properly configured for Gmail Add-on origins

### Environment Variables

Ensure these are set in production:

```bash
# Auth Bridge
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend API (already configured)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
```

## 🎯 Next Steps

### Immediate Actions

1. ✅ Deploy Auth Bridge to Railway
2. ✅ Update Gmail Add-on URLs
3. ✅ Deploy Gmail Add-on to Apps Script
4. ✅ Test complete flow
5. ✅ Monitor for issues

### Future Enhancements

- [ ] Add more email parsing patterns
- [ ] Implement batch email processing
- [ ] Add email templates
- [ ] Create analytics dashboard
- [ ] Add mobile app support

## 📞 Support

### Getting Help

1. **Check logs** in Apps Script and Railway
2. **Test endpoints** manually with curl
3. **Verify environment variables** are set correctly
4. **Check Supabase** for authentication issues

### Common Solutions

- **Session expired**: User needs to sign in again
- **Rate limited**: Wait a few minutes before retrying
- **Parsing failed**: Email may not be a job application
- **API errors**: Check backend API is running

---

## 🎉 Success!

Once deployed, users can:

1. **Open any email** in Gmail
2. **Click TrackMail** in the sidebar
3. **Track applications** with one click
4. **View results** in the TrackMail dashboard

**Your Gmail Add-on is now live!** 🚀

---

*Need help? Check the troubleshooting section or review the logs for specific error messages.*
