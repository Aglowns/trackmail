# Testing Guide for Gmail Add-on

Comprehensive testing guide for the TrackMail Gmail Add-on implementation.

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Test Cases](#test-cases)
6. [Performance Testing](#performance-testing)

## Test Environment Setup

### Local Test Environment

1. **Backend API** (Port 8000):
   ```bash
   cd trackmail
   uvicorn app.main:app --reload --port 8000
   ```

2. **Auth Bridge** (Port 8001):
   ```bash
   cd auth-bridge
   uvicorn main:app --reload --port 8001
   ```

3. **Supabase Local** (Optional):
   ```bash
   supabase start
   ```

### Test Data Setup

Create test users and sample emails:

```sql
-- Test user
INSERT INTO auth.users (email, encrypted_password)
VALUES ('test@example.com', crypt('testpassword', gen_salt('bf')));

-- Sample application
INSERT INTO applications (user_id, company, position, status)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'test@example.com'),
  'Test Company',
  'Software Engineer',
  'applied'
);
```

## Unit Testing

### Backend API Tests

Run existing backend tests:

```bash
cd trackmail
pytest tests/ -v --cov=app
```

### Test EmailIngest Schema

```python
# tests/test_schemas.py
from app.schemas import EmailIngest
from datetime import datetime

def test_email_ingest_with_gmail_fields():
    """Test EmailIngest schema with Gmail-specific fields"""
    data = {
        "sender": "jobs@acme.com",
        "subject": "Application Received",
        "text_body": "Thank you for applying",
        "html_body": "<html>Thank you</html>",
        "message_id": "msg123",
        "thread_id": "thread456",
        "received_at": datetime.now().isoformat()
    }
    
    email = EmailIngest(**data)
    assert email.message_id == "msg123"
    assert email.thread_id == "thread456"
    assert email.sender == "jobs@acme.com"

def test_email_ingest_without_gmail_fields():
    """Test EmailIngest schema without Gmail fields (backward compatibility)"""
    data = {
        "sender": "jobs@acme.com",
        "subject": "Application Received",
        "text_body": "Thank you"
    }
    
    email = EmailIngest(**data)
    assert email.message_id is None
    assert email.thread_id is None
    assert email.sender == "jobs@acme.com"
```

Run this test:

```bash
pytest tests/test_schemas.py -v
```

### Auth Bridge Tests

Create `auth-bridge/test_main.py`:

```python
from fastapi.testclient import TestClient
from main import app
import time

client = TestClient(app)

def test_landing_page():
    """Test landing page loads"""
    response = client.get("/")
    assert response.status_code == 200
    assert b"TrackMail" in response.content

def test_start_session():
    """Test session creation"""
    data = {
        "access_token": "test_token",
        "refresh_token": "test_refresh",
        "user_email": "test@example.com",
        "user_id": "test-user-id"
    }
    
    response = client.post("/session/start", json=data)
    assert response.status_code == 200
    
    result = response.json()
    assert "session_handle" in result
    assert "expires_at" in result

def test_get_token():
    """Test token retrieval"""
    # First create a session
    session_data = {
        "access_token": "test_token",
        "refresh_token": "test_refresh",
        "user_email": "test@example.com",
        "user_id": "test-user-id"
    }
    
    session_response = client.post("/session/start", json=session_data)
    session_handle = session_response.json()["session_handle"]
    
    # Now get token
    response = client.get(f"/token?handle={session_handle}")
    assert response.status_code == 200
    
    result = response.json()
    assert result["access_token"] == "test_token"
    assert result["user_email"] == "test@example.com"

def test_invalid_session():
    """Test with invalid session handle"""
    response = client.get("/token?handle=invalid")
    assert response.status_code == 401

def test_rate_limiting():
    """Test rate limiting on token endpoint"""
    # Create session
    session_data = {
        "access_token": "test_token",
        "refresh_token": "test_refresh",
        "user_email": "test@example.com",
        "user_id": "test-user-id"
    }
    
    session_response = client.post("/session/start", json=session_data)
    session_handle = session_response.json()["session_handle"]
    
    # Make many requests
    for _ in range(25):
        response = client.get(f"/token?handle={session_handle}")
    
    # Should be rate limited
    assert response.status_code == 429
```

Run tests:

```bash
cd auth-bridge
pytest test_main.py -v
```

## Integration Testing

### Test Auth Flow

```python
# tests/test_auth_integration.py
import requests
from time import sleep

AUTH_BRIDGE_URL = "http://localhost:8001"
BACKEND_URL = "http://localhost:8000/v1"

def test_complete_auth_flow():
    """Test complete authentication flow"""
    
    # 1. Create session (simulating user sign-in)
    session_data = {
        "access_token": "real_supabase_token",  # Replace with real token
        "refresh_token": "real_refresh_token",
        "user_email": "test@example.com",
        "user_id": "real-user-id"
    }
    
    response = requests.post(
        f"{AUTH_BRIDGE_URL}/session/start",
        json=session_data
    )
    assert response.status_code == 200
    session_handle = response.json()["session_handle"]
    
    # 2. Get access token
    response = requests.get(
        f"{AUTH_BRIDGE_URL}/token",
        params={"handle": session_handle}
    )
    assert response.status_code == 200
    access_token = response.json()["access_token"]
    
    # 3. Use token to call backend
    response = requests.get(
        f"{BACKEND_URL}/applications",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    
    # 4. End session
    response = requests.delete(
        f"{AUTH_BRIDGE_URL}/session",
        params={"handle": session_handle}
    )
    assert response.status_code == 200
```

### Test Email Ingestion

```python
# tests/test_email_ingestion.py
import requests

def test_ingest_email_with_gmail_fields():
    """Test email ingestion with Gmail-specific fields"""
    
    email_data = {
        "sender": "jobs@testcompany.com",
        "subject": "Application Received - Software Engineer",
        "text_body": "Thank you for applying to Test Company for the Software Engineer position.",
        "message_id": "test-msg-123",
        "thread_id": "test-thread-456"
    }
    
    # Get auth token first
    token = get_test_auth_token()  # Helper function
    
    response = requests.post(
        f"{BACKEND_URL}/ingest/email",
        json=email_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    result = response.json()
    
    assert result["success"] is True
    assert result["application_id"] is not None
    assert result["duplicate"] is False

def test_duplicate_detection():
    """Test duplicate email detection"""
    
    email_data = {
        "sender": "jobs@testcompany.com",
        "subject": "Application Received",
        "text_body": "Thank you",
        "received_at": "2025-10-13T10:00:00Z"
    }
    
    token = get_test_auth_token()
    
    # Send once
    response1 = requests.post(
        f"{BACKEND_URL}/ingest/email",
        json=email_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    app_id_1 = response1.json()["application_id"]
    
    # Send again (duplicate)
    response2 = requests.post(
        f"{BACKEND_URL}/ingest/email",
        json=email_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    result2 = response2.json()
    
    assert result2["duplicate"] is True
    assert result2["application_id"] == app_id_1
```

## End-to-End Testing

### Manual E2E Test Script

1. **Setup**:
   - Backend running on port 8000
   - Auth Bridge running on port 8001
   - Gmail Add-on deployed as test

2. **Test Steps**:

   ```
   ✅ Open Gmail
   ✅ Open any email
   ✅ Click TrackMail icon in sidebar
   ✅ Verify sign-in card appears
   ✅ Click "Sign In with TrackMail"
   ✅ Verify browser opens Auth Bridge
   ✅ Enter email/password and sign in
   ✅ Verify session handle appears
   ✅ Copy session handle
   ✅ Return to Gmail
   ✅ Paste session handle in add-on
   ✅ Click "Save Session"
   ✅ Verify authentication success message
   ✅ Verify tracking card appears
   ✅ Verify email preview shows correct info
   ✅ Click "Test Parsing"
   ✅ Verify test results appear
   ✅ Click "Back"
   ✅ Click "Track This Application"
   ✅ Verify success message with application ID
   ✅ Open backend dashboard
   ✅ Verify application was created
   ✅ Return to Gmail, track same email again
   ✅ Verify duplicate detection message
   ✅ Click "Sign Out"
   ✅ Verify sign-in card appears again
   ```

3. **Expected Results**: All steps pass without errors

### Automated E2E Test (Apps Script)

Create a test function in your Apps Script project:

```javascript
// Test.gs
function runE2ETests() {
  const results = [];
  
  // Test 1: Authentication
  try {
    clearSessionHandle();
    const handle = 'test-session-handle';
    saveSessionHandle(handle);
    const retrieved = getSessionHandle();
    
    results.push({
      test: 'Session Handle Storage',
      passed: retrieved === handle
    });
  } catch (e) {
    results.push({
      test: 'Session Handle Storage',
      passed: false,
      error: e.message
    });
  }
  
  // Test 2: Token Fetching
  try {
    const token = getAccessToken();
    results.push({
      test: 'Token Fetching',
      passed: token !== null && token.length > 0
    });
  } catch (e) {
    results.push({
      test: 'Token Fetching',
      passed: false,
      error: e.message
    });
  }
  
  // Test 3: Backend Health
  try {
    const health = checkBackendHealth();
    results.push({
      test: 'Backend Health',
      passed: health.status === 'healthy'
    });
  } catch (e) {
    results.push({
      test: 'Backend Health',
      passed: false,
      error: e.message
    });
  }
  
  // Print results
  console.log('=== E2E Test Results ===');
  results.forEach(r => {
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${r.test}`);
    if (r.error) {
      console.log(`  Error: ${r.error}`);
    }
  });
  
  return results;
}
```

Run from Apps Script editor: Select `runE2ETests` and click **Run**.

## Test Cases

### Authentication Test Cases

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-AUTH-01 | First-time sign-in | User can complete auth flow |
| TC-AUTH-02 | Session persistence | Session survives page reload |
| TC-AUTH-03 | Token refresh | Token automatically refreshes |
| TC-AUTH-04 | Session expiry | Expired session prompts sign-in |
| TC-AUTH-05 | Invalid session | Invalid handle shows error |
| TC-AUTH-06 | Sign out | Session cleared on sign out |
| TC-AUTH-07 | Rate limiting | Too many requests blocked |

### Email Tracking Test Cases

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-TRACK-01 | Track standard email | Application created |
| TC-TRACK-02 | Track duplicate email | Duplicate detected |
| TC-TRACK-03 | Track HTML email | HTML parsed correctly |
| TC-TRACK-04 | Track plain text email | Text parsed correctly |
| TC-TRACK-05 | Track multipart email | Both parts extracted |
| TC-TRACK-06 | Track without body | Graceful failure |
| TC-TRACK-07 | Track long subject | Subject truncated properly |

### Parsing Test Cases

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-PARSE-01 | Parse application confirmation | Company and position extracted |
| TC-PARSE-02 | Parse interview invitation | Status = 'interviewing' |
| TC-PARSE-03 | Parse rejection | Status = 'rejected' |
| TC-PARSE-04 | Parse offer | Status = 'offer' |
| TC-PARSE-05 | Parse ambiguous email | Low confidence score |
| TC-PARSE-06 | Parse non-job email | Parsing fails gracefully |

### Error Handling Test Cases

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-ERR-01 | Backend offline | Helpful error message |
| TC-ERR-02 | Auth Bridge offline | Helpful error message |
| TC-ERR-03 | Network timeout | Retry or error message |
| TC-ERR-04 | Invalid JWT | Re-authentication prompted |
| TC-ERR-05 | Gmail API error | Error caught and logged |
| TC-ERR-06 | Malformed response | Error message shown |

## Performance Testing

### Load Testing Auth Bridge

Use [Apache Bench](https://httpd.apache.org/docs/2.4/programs/ab.html):

```bash
# Test session creation
ab -n 100 -c 10 -p session_data.json -T application/json \
  http://localhost:8001/session/start

# Test token retrieval
ab -n 1000 -c 50 \
  http://localhost:8001/token?handle=test-handle
```

### Load Testing Backend

```bash
# Test email ingestion
ab -n 100 -c 10 -p email_data.json -T application/json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/v1/ingest/email

# Test application listing
ab -n 500 -c 25 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/v1/applications
```

### Performance Metrics

Target metrics:

- **Auth Bridge**:
  - Session creation: < 200ms
  - Token retrieval: < 50ms
  - Rate limit: 20 req/min per session

- **Backend API**:
  - Email ingestion: < 500ms
  - Application list: < 200ms
  - Application create: < 300ms

- **Gmail Add-on**:
  - Card render: < 1s
  - Track action: < 3s (including API calls)
  - Test parsing: < 2s

## Continuous Testing

### Pre-deployment Checklist

Before deploying updates:

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual E2E test completed
- [ ] No console errors in Apps Script
- [ ] Backend health check passes
- [ ] Auth Bridge health check passes
- [ ] Test with production URLs
- [ ] Test on multiple Gmail accounts
- [ ] Test on mobile Gmail app (if applicable)

### Monitoring in Production

Set up monitoring for:

1. **Error rates**: Track 4xx and 5xx errors
2. **Response times**: Alert if > target metrics
3. **Authentication failures**: Unusual spike in failures
4. **Rate limit hits**: Track rate limit errors
5. **Parse failures**: Track parsing confidence scores

### Regression Testing

After any update, re-run:

- [ ] Full E2E test
- [ ] All test cases (TC-*-*)
- [ ] Performance benchmarks
- [ ] Check logs for new errors

## Test Data

### Sample Emails

Create these test emails for comprehensive testing:

**1. Standard Application Confirmation**:
```
From: jobs@acmecorp.com
Subject: Application Received - Senior Software Engineer
Body: Thank you for applying to Acme Corp for the Senior Software Engineer position. We have received your application and will review it shortly.
```

**2. Interview Invitation**:
```
From: recruiter@techstartup.io
Subject: Interview Invitation - Full Stack Developer
Body: We were impressed with your application for the Full Stack Developer role at Tech Startup. We'd like to invite you for an interview next week.
```

**3. Rejection**:
```
From: noreply@megacorp.com
Subject: Re: Your Application
Body: Thank you for your interest in the Software Engineer position at MegaCorp. Unfortunately, we have decided to move forward with other candidates.
```

**4. Offer**:
```
From: hr@awesomecompany.com
Subject: Job Offer - Lead Developer Position
Body: We're pleased to extend an offer for the Lead Developer position at Awesome Company. Please review the attached offer letter.
```

**5. Edge Case - No Clear Job Info**:
```
From: info@company.com
Subject: Thanks!
Body: Thanks for reaching out. We'll be in touch.
```

### Test Accounts

Create these test accounts:

1. **Admin User**: For testing all features
2. **New User**: For testing first-time sign-in
3. **Power User**: With many applications (for performance testing)

## Reporting Bugs

When filing bug reports, include:

1. **Environment**:
   - Browser version
   - Gmail app (web/mobile)
   - Account type (personal/workspace)

2. **Steps to Reproduce**:
   - Detailed step-by-step instructions
   - Expected vs actual behavior

3. **Logs**:
   - Apps Script execution logs
   - Backend API logs
   - Auth Bridge logs
   - Browser console errors

4. **Screenshots/Videos**:
   - Screenshot of error
   - Screen recording of issue

---

**Happy Testing!** 🧪

For questions or issues, check the [Troubleshooting Guide](./GMAIL_ADDON_SETUP.md#troubleshooting).

