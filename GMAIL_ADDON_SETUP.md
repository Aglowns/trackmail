# Gmail Add-on Setup & Deployment Guide

Complete guide for setting up and deploying the TrackMail Gmail Add-on.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## Architecture Overview

The Gmail Add-on consists of three integrated components:

```
┌─────────────────┐
│  Gmail Add-on   │ (Apps Script - runs in Gmail sidebar)
│   - Code.gs     │
│   - Auth.gs     │
│   - API.gs      │
│   - UI.gs       │
└────────┬────────┘
         │
         │ 1. User signs in via browser
         │
         v
┌─────────────────┐
│  Auth Bridge    │ (FastAPI service - manages auth sessions)
│   - main.py     │
│   - signin.html │
└────────┬────────┘
         │
         │ 2. Returns session handle
         │ 3. Exchanges handle for JWT tokens
         │
         v
┌─────────────────┐
│  Backend API    │ (FastAPI service - main TrackMail backend)
│   - /ingest     │
│   - /apps       │
│   - /events     │
└─────────────────┘
```

### Authentication Flow

1. User clicks "Sign In" in Gmail Add-on
2. Browser window opens to Auth Bridge service
3. User authenticates with Supabase
4. Auth Bridge creates a session and returns a handle
5. User copies session handle and pastes into Gmail Add-on
6. Add-on stores session handle in user properties
7. Before each API call, add-on exchanges session handle for fresh JWT token
8. Add-on uses JWT as Bearer token for backend API calls

## Prerequisites

### Required Accounts & Services

- [ ] **Google Account** - For Apps Script development
- [ ] **Supabase Project** - For authentication and database
- [ ] **Backend Deployment** - TrackMail backend API running
- [ ] **Auth Bridge Deployment** - Auth Bridge service running

### Required Software (Local Development)

- Python 3.11+
- pip (Python package manager)
- Git
- Text editor or IDE

### Required Information

Before starting, gather these values:

- [ ] Supabase URL
- [ ] Supabase Anon Key
- [ ] Supabase Service Role Key
- [ ] Backend API URL (once deployed)
- [ ] Auth Bridge URL (once deployed)

## Local Development Setup

### Step 1: Deploy Auth Bridge Service

The Auth Bridge must be accessible via HTTPS for the Gmail Add-on to work.

#### Option A: Deploy to Railway (Recommended)

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Create new project**:
   ```bash
   cd auth-bridge
   railway login
   railway init
   ```

3. **Set environment variables**:
   ```bash
   railway variables set SUPABASE_URL=your-supabase-url
   railway variables set SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Get your URL**: Railway will provide a URL like `https://auth-bridge-production-xxxx.up.railway.app`

#### Option B: Deploy to Cloud Run

```bash
cd auth-bridge

gcloud run deploy auth-bridge \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=your-url,SUPABASE_ANON_KEY=your-key
```

#### Option C: Deploy to Heroku

```bash
cd auth-bridge

heroku create trackmail-auth-bridge
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_ANON_KEY=your-key

git init
git add .
git commit -m "Initial commit"
git push heroku main
```

### Step 2: Verify Auth Bridge

1. Open your Auth Bridge URL in a browser
2. You should see the sign-in page
3. Try signing in to verify Supabase integration works
4. You should receive a session handle after signing in

### Step 3: Deploy Backend API

Follow the main README.md for backend deployment instructions. Make sure:

- Database migrations are applied
- Supabase RLS policies are configured
- `/ingest/email` endpoint is working
- CORS is configured to allow Auth Bridge and Gmail Add-on origins

### Step 4: Create Apps Script Project

1. **Go to Apps Script**:
   - Visit [script.google.com](https://script.google.com)
   - Click **New Project**
   - Name it "TrackMail"

2. **Enable manifest file**:
   - Click **Project Settings** (gear icon)
   - Check "Show appsscript.json manifest file in editor"

3. **Add Gmail API service**:
   - Click **Services** (+ icon)
   - Find "Gmail API" and click **Add**

4. **Create files**:
   - Create new script files: Code.gs, Auth.gs, API.gs, UI.gs
   - Copy contents from `gmail-addon/` directory

5. **Update appsscript.json**:
   - Click on `appsscript.json` in editor
   - Replace with contents from `gmail-addon/appsscript.json`

### Step 5: Configure URLs

In `Auth.gs`, update these constants:

```javascript
const AUTH_BRIDGE_URL = 'https://your-auth-bridge.railway.app';
const BACKEND_API_URL = 'https://your-backend-api.com/v1';
```

### Step 6: Test Deployment

1. **Create test deployment**:
   - Click **Deploy > Test deployments**
   - Click **Install**

2. **Open Gmail**:
   - A new Gmail window opens with add-on installed
   - Open any email
   - Look for TrackMail in right sidebar

3. **Test authentication**:
   - Click "Sign In with TrackMail"
   - Complete sign-in in browser
   - Copy session handle
   - Paste in add-on
   - Verify it shows "Authentication successful"

4. **Test email tracking**:
   - Open a job application email
   - Click "Track This Application"
   - Verify success message
   - Check backend database for new application

## Production Deployment

### For Personal Use

1. Follow all local development steps above
2. Keep as a test deployment (no marketplace submission needed)
3. Share with up to 100 users via test deployment link

### For Public Marketplace

#### Step 1: Prepare OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Apps Script project
3. Go to **APIs & Services > OAuth consent screen**
4. Fill out:
   - App name: TrackMail
   - User support email
   - App logo (512x512 PNG)
   - App domain
   - Privacy policy URL
   - Terms of service URL

#### Step 2: Create Privacy Policy

Create a privacy policy that covers:
- What data you collect (email content, sender, subject)
- How you use it (tracking job applications)
- How you store it (Supabase with encryption)
- User rights (data deletion, export)
- Contact information

Host it publicly (e.g., GitHub Pages, your website)

#### Step 3: Prepare Marketplace Listing

1. **Create assets**:
   - App icon (512x512 PNG)
   - Screenshots (1280x800 PNG, at least 3)
   - Demo video (optional but recommended)

2. **Write descriptions**:
   - Short description (80 chars)
   - Long description (4000 chars)
   - Feature list

3. **Test thoroughly**:
   - Test with different email formats
   - Test error cases
   - Test on multiple accounts
   - Get beta testers

#### Step 4: Submit for Review

1. **Create deployment**:
   - Click **Deploy > New deployment**
   - Choose "Editor Add-on"
   - Version: "Production"

2. **Fill out listing**:
   - Upload all assets
   - Add descriptions
   - Select categories
   - Add privacy policy URL

3. **Submit**:
   - Click "Submit for review"
   - Respond to any questions from Google
   - Wait 2-4 weeks for approval

#### Step 5: Post-Approval

1. Monitor reviews and feedback
2. Respond to user issues
3. Keep add-on updated
4. Submit updates for review when needed

## Testing

### Manual Testing Checklist

#### Authentication
- [ ] Sign-in flow works
- [ ] Session handle is saved correctly
- [ ] Token refresh works automatically
- [ ] Sign-out clears session
- [ ] Expired session shows sign-in prompt

#### Email Tracking
- [ ] Email preview shows correct information
- [ ] Track button creates application
- [ ] Duplicate detection works
- [ ] Success message shows application ID
- [ ] Error messages are helpful

#### Parsing
- [ ] Test parsing extracts company/position
- [ ] Confidence score is reasonable
- [ ] Various email formats work
- [ ] Graceful failure for unparseable emails

#### Edge Cases
- [ ] No internet connection
- [ ] Backend API down
- [ ] Auth Bridge down
- [ ] Malformed emails
- [ ] Very long email subjects
- [ ] Emails with attachments
- [ ] HTML-only emails
- [ ] Plain text only emails

### Test Emails

Create test emails with these scenarios:

1. **Standard application confirmation**:
   ```
   From: jobs@acme.com
   Subject: Application Received - Software Engineer
   Body: Thank you for applying to Acme Corp...
   ```

2. **Interview invitation**:
   ```
   From: recruiter@techco.com
   Subject: Interview Invitation - Senior Developer
   Body: We'd like to invite you to interview...
   ```

3. **Rejection**:
   ```
   From: noreply@startup.com
   Subject: Re: Your Application
   Body: Thank you for your interest. Unfortunately...
   ```

4. **Offer**:
   ```
   From: hr@bigcorp.com
   Subject: Job Offer - Lead Engineer
   Body: We're pleased to extend an offer...
   ```

### Automated Testing

For automated testing of the backend API:

```bash
cd trackmail
pytest tests/test_ingest.py -v
```

## Troubleshooting

### Common Issues

#### "Authorization required" or "Access token not found"

**Cause**: Session expired or not set up correctly

**Solution**:
1. Click "Sign Out" in the add-on
2. Click "Sign In" again
3. Get a fresh session handle
4. Verify Auth Bridge is accessible

#### "Failed to fetch email data"

**Cause**: Gmail API permissions or access token issue

**Solution**:
1. Verify Gmail API is added as a service
2. Check OAuth scopes in appsscript.json
3. Try removing and re-installing the add-on
4. Check Apps Script execution logs

#### "API request failed"

**Cause**: Backend API issue or network problem

**Solution**:
1. Verify backend API is running and accessible
2. Check BACKEND_API_URL in Auth.gs is correct
3. Test API directly with curl or Postman
4. Check CORS configuration on backend

#### "Could not extract sufficient information"

**Cause**: Email doesn't match expected job application format

**Solution**:
1. Use "Test Parsing" to see what was extracted
2. Check if email is actually a job application
3. Consider improving parsing logic in backend
4. Manually add application via main app

#### Session handle not saving

**Cause**: Apps Script user properties issue

**Solution**:
1. Try signing out completely from Google
2. Clear browser cache
3. Try a different browser
4. Check Apps Script permissions

### Debugging Tips

1. **View Logs**:
   ```
   Apps Script Editor > View > Logs
   or
   Apps Script Editor > View > Executions
   ```

2. **Test Functions Individually**:
   - Select a function in the editor
   - Click **Run**
   - View results in logs

3. **Check Network Requests**:
   - Use `console.log()` before and after API calls
   - Log request URLs and payloads
   - Log response status and body

4. **Verify Environment**:
   ```javascript
   function debugEnvironment() {
     console.log('Auth Bridge URL:', AUTH_BRIDGE_URL);
     console.log('Backend API URL:', BACKEND_API_URL);
     console.log('Session Handle:', getSessionHandle());
     console.log('User Email:', getUserEmail());
   }
   ```

### Getting Help

1. **Check Logs**: Always check Apps Script execution logs first
2. **Test Endpoints**: Test Auth Bridge and Backend API directly
3. **Simplify**: Test with minimal example emails
4. **Search**: Check Google Apps Script and Gmail Add-on documentation
5. **Ask**: Create an issue on GitHub with logs and error messages

## Security Best Practices

1. **Never commit credentials**:
   - Don't hardcode API keys in code
   - Use environment variables in Auth Bridge and Backend
   - Session handles are user-specific and temporary

2. **Use HTTPS only**:
   - Auth Bridge must use HTTPS
   - Backend API must use HTTPS
   - Never expose services on HTTP in production

3. **Implement rate limiting**:
   - Auth Bridge has built-in rate limiting
   - Consider adding rate limiting to backend
   - Monitor for abuse

4. **Validate all inputs**:
   - Backend validates all API requests
   - Auth Bridge validates session handles
   - Never trust client data

5. **Keep sessions short-lived**:
   - Sessions expire after 1 hour
   - Tokens expire after 5 minutes
   - Users must re-authenticate periodically

6. **Monitor and log**:
   - Log authentication attempts
   - Monitor for unusual activity
   - Set up error alerting

## Maintenance

### Regular Tasks

- **Monitor logs**: Check for errors and warnings
- **Update dependencies**: Keep packages up to date
- **Backup data**: Regular database backups
- **Test after updates**: Verify add-on works after changes

### Version Updates

When updating the add-on:

1. Make changes in Apps Script editor
2. Test with test deployment
3. Create new version deployment
4. Update marketplace listing if needed
5. Notify users of new features

### User Support

Set up support channels:
- Email support address
- GitHub issues for bugs
- Documentation site
- FAQ section

## Next Steps

After successful deployment:

1. **Gather feedback** from users
2. **Improve parsing** based on real-world emails
3. **Add features** (e.g., browse applications from Gmail)
4. **Optimize performance** (caching, batch operations)
5. **Enhance UI** based on user feedback

## Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Gmail Add-ons Guide](https://developers.google.com/gmail/add-ons)
- [CardService Reference](https://developers.google.com/apps-script/reference/card-service)
- [Supabase Documentation](https://supabase.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)

---

**Need help?** Create an issue on GitHub or check the troubleshooting section above.

