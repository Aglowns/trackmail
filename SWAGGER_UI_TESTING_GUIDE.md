# Testing Phase 2 with Swagger UI

## Step-by-Step Guide

### Step 1: Start Your Backend

Make sure your FastAPI server is running:

```bash
# If not already running, start it:
uvicorn app.main:app --reload

# Or if you have a main.py:
python main.py
```

The server should start on **http://localhost:8000**

### Step 2: Open Swagger UI

1. Open your browser and go to:
   ```
   http://localhost:8000/docs
   ```

2. You should see the Swagger UI interface with all available endpoints

### Step 3: Get Your JWT Token

Before testing, you need a JWT token. Here's how to get one:

**Option A: From Supabase Dashboard**
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Create a test user (or use existing)
4. Click on the user
5. Copy the **"Access Token"** (this is your JWT token)

**Option B: Sign in via Supabase Auth**
1. Use your frontend or auth bridge to sign in
2. Copy the JWT token from the response

### Step 4: Authorize in Swagger UI

1. In Swagger UI, look for the **🔒 Authorize** button (top right corner)
2. Click it
3. In the "Value" field, enter:
   ```
   Bearer YOUR_JWT_TOKEN_HERE
   ```
   (Replace `YOUR_JWT_TOKEN_HERE` with your actual token)
4. Click **"Authorize"**
5. Click **"Close"**

Now all your requests will include the authentication token!

### Step 5: Test Subscription Status

1. Find the **`GET /v1/subscription/status`** endpoint
2. Click on it to expand
3. Click **"Try it out"**
4. Click **"Execute"**
5. Check the response

**Expected Response (Free User):**
```json
{
  "subscription": {
    "plan_name": "Free",
    "plan_id": "00000000-0000-0000-0000-000000000001",
    "status": "active"
  },
  "features": {
    "max_applications": 25,
    "unlimited_applications": false,
    "auto_tracking": false,
    "resume_tailoring": false,
    "advanced_analytics": false,
    "export_data": false
  },
  "usage": {
    "applications_count": 0,
    "applications_limit": 25
  }
}
```

**Note:** Write down your current `applications_count` - you'll need it!

### Step 6: List Available Plans

1. Find **`GET /v1/subscription/plans`** endpoint
2. Click **"Try it out"** → **"Execute"**
3. This should show both Free and Pro plans

### Step 7: Create Test Applications

1. Find **`POST /v1/applications`** endpoint
2. Click on it to expand
3. Click **"Try it out"**
4. Fill in the request body:

```json
{
  "company": "Test Company 1",
  "position": "Software Engineer",
  "status": "applied",
  "location": "Remote",
  "source_url": "https://example.com/jobs/1",
  "notes": "Testing Phase 2 limits"
}
```

5. Click **"Execute"**
6. **Expected:** Should return `201 Created` with application data

**Repeat this step** to create multiple applications (up to 25 for free users).

**Tip:** After each creation, check your count:
- Go back to **`GET /v1/subscription/status`**
- Click **"Try it out"** → **"Execute"**
- See how `applications_count` increases

### Step 8: Test Limit Enforcement

Once you have 25 applications (or if you already have 25):

1. Go to **`POST /v1/applications`** again
2. Click **"Try it out"**
3. Create another application:

```json
{
  "company": "Test Company 26",
  "position": "Software Engineer",
  "status": "applied",
  "location": "Remote",
  "notes": "This should fail - limit exceeded"
}
```

4. Click **"Execute"**

**Expected Response (403 Forbidden):**
```json
{
  "detail": {
    "error": "limit_exceeded",
    "message": "You've reached your limit of 25 applications. Upgrade to Pro for unlimited applications and automatic tracking.",
    "upgrade_required": true,
    "current_count": 25,
    "limit": 25,
    "upgrade_url": "/subscription/upgrade"
  }
}
```

**Status Code:** Should be `403` (not `200` or `201`)

### Step 9: Verify the Error Response

Check that the error response includes:
- ✅ `"error": "limit_exceeded"`
- ✅ `"upgrade_required": true`
- ✅ `"current_count": 25` (or your actual count)
- ✅ `"limit": 25`
- ✅ `"upgrade_url": "/subscription/upgrade"`
- ✅ Helpful message explaining the limit

### Step 10: Test Email Ingestion (Optional)

The email ingestion endpoint should also respect limits:

1. Find **`POST /v1/ingest/email`** endpoint
2. Click **"Try it out"**
3. Use this test email:

```json
{
  "sender": "jobs@example.com",
  "subject": "Application Received - Software Engineer",
  "text_body": "Thank you for applying to Example Corp for the Software Engineer position. We have received your application and will review it shortly.",
  "html_body": "<p>Thank you for applying...</p>",
  "received_at": "2025-01-15T10:00:00Z"
}
```

4. Click **"Execute"**

**Expected:**
- If under 25 apps: Should create application successfully
- If at 25 apps: Should return `403` with limit exceeded error

## Testing Checklist

Use this checklist to verify everything works:

- [ ] Backend is running on http://localhost:8000
- [ ] Swagger UI loads at http://localhost:8000/docs
- [ ] Can authorize with JWT token
- [ ] `GET /v1/subscription/status` returns subscription info
- [ ] `GET /v1/subscription/plans` shows Free and Pro plans
- [ ] Can create applications successfully (first 25)
- [ ] `applications_count` increases with each creation
- [ ] 26th application creation returns `403 Forbidden`
- [ ] Error response includes `"limit_exceeded"` error
- [ ] Error response includes upgrade information
- [ ] Email ingestion also checks limits

## What to Look For

### ✅ Success Indicators:
- Subscription status shows correct plan
- Application count increases correctly
- Limit enforcement works (403 when exceeded)
- Error messages are helpful and include upgrade info

### ❌ Problems to Watch For:
- Applications created without limit checks
- 26th application succeeds (should fail)
- Error responses don't include upgrade info
- Status code is wrong (should be 403, not 500)

## Troubleshooting

### "401 Unauthorized"
- Your JWT token expired or is invalid
- Get a fresh token from Supabase Dashboard
- Re-authorize in Swagger UI

### "500 Internal Server Error"
- Check backend console for error messages
- Verify database migration ran (subscription tables exist)
- Check that free plan exists in database

### "Limit Not Working"
- Check backend logs for subscription service errors
- Verify you're testing with a free user (not pro)
- Check database has subscription_plans table populated

### "Can't See Endpoints"
- Make sure backend is running
- Check you're at http://localhost:8000/docs
- Refresh the page

## Next Steps

After testing:
1. ✅ Verify limit enforcement works correctly
2. ✅ Test error handling (should fail-secure)
3. ✅ Check that frontend can handle 403 responses
4. ✅ Test upgrade flow (when Phase 6 is implemented)

## Quick Reference

**Endpoints to Test:**
- `GET /v1/subscription/status` - Check current status and count
- `GET /v1/subscription/plans` - List available plans
- `POST /v1/applications` - Create application (test limit)
- `POST /v1/ingest/email` - Test email ingestion limit

**Expected Status Codes:**
- `200` - Success (GET requests)
- `201` - Created (POST when under limit)
- `403` - Forbidden (POST when limit exceeded)


