# 🧪 TrackMail Gmail Add-on Testing Guide

Comprehensive testing guide to ensure your Gmail Add-on works perfectly.

## 🎯 Testing Checklist

### Pre-Testing Setup

- [ ] Auth Bridge deployed and accessible
- [ ] Backend API deployed and accessible  
- [ ] Gmail Add-on deployed to Apps Script
- [ ] Gmail Add-on enabled in Gmail
- [ ] Test Gmail account with job application emails

## 🔧 Component Testing

### 1. Auth Bridge Testing

#### 1.1 Health Check
```bash
curl https://trackmail-auth-bridge-production.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "active_sessions": 0,
  "supabase_configured": true
}
```

#### 1.2 Authentication Flow
1. Open Auth Bridge URL in browser
2. Sign in with your TrackMail account
3. Verify session handle is generated
4. Copy session handle for Gmail Add-on testing

### 2. Backend API Testing

#### 2.1 Health Check
```bash
curl https://trackmail-backend-production.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "supabase": "connected"
}
```

#### 2.2 Authentication Test
```bash
# Get a JWT token from Auth Bridge first
curl -X GET "https://trackmail-auth-bridge-production.up.railway.app/token?handle=YOUR_SESSION_HANDLE"
```

**Expected Response:**
```json
{
  "access_token": "eyJ...",
  "expires_in": 300,
  "user_email": "your-email@example.com"
}
```

### 3. Gmail Add-on Testing

#### 3.1 Basic Functionality

**Test 1: Add-on Appears**
1. Open Gmail
2. Open any email
3. Look for TrackMail in right sidebar
4. ✅ Should show sign-in card if not authenticated

**Test 2: Authentication**
1. Click "Sign In with TrackMail"
2. Complete authentication in browser window
3. Copy session handle
4. Paste in Gmail Add-on
5. ✅ Should show "Authentication Successful"

**Test 3: Email Preview**
1. Open a job application email
2. Gmail Add-on should show email preview
3. ✅ Should display sender, subject, date

#### 3.2 Email Processing

**Test 4: Test Parsing**
1. Click "Test Parsing" button
2. ✅ Should show extracted company, position, status
3. ✅ Should show confidence score
4. ✅ Should indicate if duplicate

**Test 5: Track Application**
1. Click "Track This Application" button
2. ✅ Should show success message
3. ✅ Should display application ID
4. ✅ Should indicate if duplicate

**Test 6: Duplicate Detection**
1. Try to track the same email again
2. ✅ Should detect duplicate
3. ✅ Should show existing application ID

## 📧 Email Test Cases

### Test Email Types

#### 1. Application Confirmation
```
From: jobs@acme.com
Subject: Application Received - Software Engineer
Body: Thank you for applying to Acme Corp for the Software Engineer position...
```

**Expected Parsing:**
- Company: "Acme Corp"
- Position: "Software Engineer"  
- Status: "applied"
- Confidence: > 0.7

#### 2. Interview Invitation
```
From: hr@techcorp.com
Subject: Interview Invitation - Data Scientist
Body: We'd like to invite you for an interview for the Data Scientist role...
```

**Expected Parsing:**
- Company: "TechCorp"
- Position: "Data Scientist"
- Status: "interviewing"
- Confidence: > 0.8

#### 3. Rejection Email
```
From: noreply@startup.io
Subject: Application Update
Body: Thank you for your interest in the Product Manager position at Startup.io...
```

**Expected Parsing:**
- Company: "Startup.io"
- Position: "Product Manager"
- Status: "rejected"
- Confidence: > 0.6

#### 4. Non-Job Email
```
From: newsletter@company.com
Subject: Weekly Newsletter
Body: Check out our latest updates...
```

**Expected Result:**
- Should fail parsing
- Should show "Could not extract sufficient information"
- Should not create application

## 🔍 Debugging Tests

### 1. Apps Script Logs

1. Go to [script.google.com](https://script.google.com)
2. Open your TrackMail project
3. Go to "Executions" in left sidebar
4. Look for recent executions
5. Check for error messages

**Common Errors:**
- `Authentication required`: Session expired
- `Failed to fetch email data`: Gmail API issue
- `API request failed`: Backend connectivity issue

### 2. Network Testing

**Test Auth Bridge Connectivity:**
```bash
curl -v https://trackmail-auth-bridge-production.up.railway.app/health
```

**Test Backend API Connectivity:**
```bash
curl -v https://trackmail-backend-production.up.railway.app/health
```

**Test with Authentication:**
```bash
# Get token from Auth Bridge
TOKEN=$(curl -s "https://trackmail-auth-bridge-production.up.railway.app/token?handle=YOUR_HANDLE" | jq -r .access_token)

# Test backend with token
curl -H "Authorization: Bearer $TOKEN" https://trackmail-backend-production.up.railway.app/v1/applications
```

### 3. Railway Logs

1. Go to Railway dashboard
2. Select your Auth Bridge project
3. Go to "Deployments" tab
4. Click on latest deployment
5. Check logs for errors

**Common Issues:**
- Environment variables not set
- Supabase connection failed
- Port binding errors

## 🚨 Error Scenarios

### Authentication Errors

**"Session expired"**
- Solution: Sign out and sign in again
- Check session TTL in Auth Bridge

**"Rate limit exceeded"**
- Solution: Wait 1 minute before retrying
- Check rate limiting configuration

**"Invalid session handle"**
- Solution: Get new session handle from Auth Bridge
- Verify session handle is correct

### API Errors

**"Backend service unavailable"**
- Solution: Check Railway deployment status
- Verify backend API is running

**"Could not extract sufficient information"**
- Solution: Email may not be a job application
- Try with a different email
- Check parsing logic

**"Duplicate email detected"**
- Solution: This is expected behavior
- Check if existing application is correct

### Gmail Add-on Errors

**"Add-on not appearing"**
- Solution: Check Apps Script deployment
- Verify Gmail Add-on is enabled
- Check manifest configuration

**"Failed to fetch email data"**
- Solution: Enable Gmail API in Apps Script
- Check Gmail API permissions

## 📊 Performance Testing

### Response Time Targets

- **Card Render**: < 1 second
- **Authentication**: < 3 seconds
- **Email Parsing**: < 2 seconds
- **Application Creation**: < 3 seconds

### Load Testing

**Test Multiple Sessions:**
1. Create multiple test accounts
2. Sign in simultaneously
3. Track applications concurrently
4. Monitor for rate limiting

**Test Session Management:**
1. Create session
2. Wait for expiry (1 hour)
3. Try to use expired session
4. Verify proper error handling

## ✅ Success Criteria

### Functional Requirements

- [ ] User can authenticate via Auth Bridge
- [ ] Email data is extracted correctly
- [ ] Applications are created in backend
- [ ] Duplicates are detected
- [ ] Error handling works properly

### Performance Requirements

- [ ] Add-on loads in < 1 second
- [ ] Authentication completes in < 3 seconds
- [ ] Email parsing completes in < 2 seconds
- [ ] No memory leaks in Apps Script

### Security Requirements

- [ ] Sessions expire after 1 hour
- [ ] Tokens expire after 5 minutes
- [ ] Rate limiting prevents abuse
- [ ] User data is isolated

## 🎯 Final Validation

### End-to-End Test

1. **Open Gmail** with job application email
2. **Click TrackMail** in sidebar
3. **Sign in** if not authenticated
4. **Click "Track This Application"**
5. **Verify success** message
6. **Check TrackMail dashboard** for new application
7. **Verify all fields** are populated correctly

### Regression Test

1. **Test with different email types**
2. **Test duplicate detection**
3. **Test error scenarios**
4. **Test session expiry**
5. **Test rate limiting**

---

## 🎉 Testing Complete!

If all tests pass, your Gmail Add-on is ready for production use!

**Next Steps:**
1. Share with beta users
2. Monitor for issues
3. Collect feedback
4. Iterate and improve

---

*Need help with testing? Check the debugging section or review the logs for specific error messages.*
