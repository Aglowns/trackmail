# Testing Phase 2 - Application Limit Enforcement

## Prerequisites

1. **Backend running:** Make sure your FastAPI server is running
   ```bash
   # If using uvicorn directly
   uvicorn app.main:app --reload
   
   # Or however you normally start it
   ```

2. **Get a JWT Token:**
   
   You need a JWT token from Supabase to test. Here are options:

   **Option A: Supabase Dashboard**
   - Go to Supabase Dashboard → Authentication → Users
   - Create a test user or use existing
   - Click on user → Copy "Access Token" (this is your JWT)

   **Option B: JavaScript/Node.js**
   ```javascript
   const { createClient } = require('@supabase/supabase-js');
   
   const supabase = createClient(
     'YOUR_SUPABASE_URL',
     'YOUR_SUPABASE_ANON_KEY'
   );
   
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'test@example.com',
     password: 'your-password'
   });
   
   console.log('JWT Token:', data.session.access_token);
   ```

   **Option C: Use Swagger UI**
   - Go to http://localhost:8000/docs
   - Click "Authorize" button (top right)
   - Enter: `Bearer YOUR_JWT_TOKEN`
   - Click "Authorize"

## Test Scenarios

### Test 1: Check Subscription Status

First, verify your user's subscription status:

```bash
curl -X GET "http://localhost:8000/v1/subscription/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

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
    "auto_tracking": false
  },
  "usage": {
    "applications_count": 0,
    "applications_limit": 25
  }
}
```

### Test 2: Create Applications (Up to Limit)

Create multiple applications to test the limit enforcement:

```bash
# Replace YOUR_JWT_TOKEN with your actual token
TOKEN="YOUR_JWT_TOKEN"
BASE_URL="http://localhost:8000/v1"

# Create 25 applications (should all succeed)
for i in {1..25}; do
  echo "Creating application $i..."
  curl -X POST "$BASE_URL/applications" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"company\": \"Test Company $i\",
      \"position\": \"Software Engineer $i\",
      \"status\": \"applied\",
      \"location\": \"Remote\",
      \"notes\": \"Test application $i\"
    }"
  echo ""
  echo "---"
done
```

**Expected:** All 25 should return `201 Created` with application data.

### Test 3: Try to Exceed Limit (Should Fail)

Now try to create the 26th application:

```bash
curl -X POST "http://localhost:8000/v1/applications" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Test Company 26",
    "position": "Software Engineer 26",
    "status": "applied",
    "location": "Remote",
    "notes": "This should fail - limit exceeded"
  }'
```

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

**Status Code:** `403 Forbidden`

### Test 4: Check Current Count

Verify the application count:

```bash
curl -X GET "http://localhost:8000/v1/subscription/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected:** `applications_count` should be 25, `applications_limit` should be 25.

### Test 5: Test Error Handling (Fail-Secure)

To test that errors don't bypass limits, you can temporarily break the subscription service (don't do this in production!):

The system should now:
- Return `403 Forbidden` with error message if subscription check fails
- NOT allow unlimited applications on errors
- Provide helpful error messages

### Test 6: Test via Swagger UI

1. Go to http://localhost:8000/docs
2. Click "Authorize" and enter your JWT token
3. Try `POST /v1/applications` endpoint
4. Create applications and watch the count
5. When you hit 25, the next one should show 403 error

### Test 7: Test Email Ingestion (Also Checks Limits)

The email ingestion endpoint also checks limits:

```bash
curl -X POST "http://localhost:8000/v1/ingest/email" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "jobs@example.com",
    "subject": "Application Received - Software Engineer",
    "text_body": "Thank you for applying to Example Corp for the Software Engineer position...",
    "html_body": "<p>Thank you for applying...</p>",
    "received_at": "2025-01-15T10:00:00Z"
  }'
```

**Expected:** If you have 25+ applications, this should also return 403 with limit exceeded error.

## Quick Test Script

Save this as `test_phase2.sh`:

```bash
#!/bin/bash

# Configuration
TOKEN="${JWT_TOKEN:-YOUR_JWT_TOKEN_HERE}"
BASE_URL="${BASE_URL:-http://localhost:8000/v1}"

if [ "$TOKEN" = "YOUR_JWT_TOKEN_HERE" ]; then
  echo "❌ Error: Set JWT_TOKEN environment variable"
  echo "   export JWT_TOKEN='your-token-here'"
  exit 1
fi

echo "🧪 Testing Phase 2 - Application Limit Enforcement"
echo "=================================================="
echo ""

# Test 1: Check subscription status
echo "1️⃣ Checking subscription status..."
STATUS=$(curl -s -X GET "$BASE_URL/subscription/status" \
  -H "Authorization: Bearer $TOKEN")
echo "$STATUS" | jq '.'
echo ""

# Test 2: Get current count
CURRENT_COUNT=$(echo "$STATUS" | jq -r '.usage.applications_count')
LIMIT=$(echo "$STATUS" | jq -r '.usage.applications_limit')
echo "📊 Current: $CURRENT_COUNT / $LIMIT applications"
echo ""

# Test 3: Try to create an application
echo "2️⃣ Creating test application..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/applications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Test Company",
    "position": "Test Position",
    "status": "applied",
    "location": "Remote",
    "notes": "Phase 2 test"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Application created successfully!"
  echo "$BODY" | jq '.'
elif [ "$HTTP_CODE" = "403" ]; then
  echo "⛔ Limit exceeded (expected if at 25+)"
  echo "$BODY" | jq '.detail'
else
  echo "❌ Unexpected response: HTTP $HTTP_CODE"
  echo "$BODY"
fi

echo ""
echo "✅ Test complete!"
```

**Usage:**
```bash
chmod +x test_phase2.sh
export JWT_TOKEN="your-token-here"
./test_phase2.sh
```

## Python Test Script

Save this as `test_phase2.py`:

```python
#!/usr/bin/env python3
"""Test Phase 2 - Application Limit Enforcement"""

import os
import sys
import requests
import json

# Configuration
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000/v1")
JWT_TOKEN = os.getenv("JWT_TOKEN")

if not JWT_TOKEN:
    print("❌ Error: Set JWT_TOKEN environment variable")
    print("   export JWT_TOKEN='your-token-here'")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

print("🧪 Testing Phase 2 - Application Limit Enforcement")
print("=" * 50)

# Test 1: Check subscription status
print("\n1️⃣ Checking subscription status...")
response = requests.get(f"{BASE_URL}/subscription/status", headers=headers)
if response.status_code == 200:
    status = response.json()
    print(json.dumps(status, indent=2))
    current = status["usage"]["applications_count"]
    limit = status["usage"]["applications_limit"]
    print(f"\n📊 Current: {current} / {limit} applications")
else:
    print(f"❌ Failed to get status: {response.status_code}")
    print(response.text)
    sys.exit(1)

# Test 2: Try to create an application
print("\n2️⃣ Creating test application...")
app_data = {
    "company": "Test Company",
    "position": "Test Position",
    "status": "applied",
    "location": "Remote",
    "notes": "Phase 2 test"
}

response = requests.post(
    f"{BASE_URL}/applications",
    headers=headers,
    json=app_data
)

if response.status_code == 201:
    print("✅ Application created successfully!")
    print(json.dumps(response.json(), indent=2))
elif response.status_code == 403:
    print("⛔ Limit exceeded (expected if at 25+)")
    detail = response.json().get("detail", {})
    print(f"   Error: {detail.get('error')}")
    print(f"   Message: {detail.get('message')}")
    print(f"   Current: {detail.get('current_count')} / {detail.get('limit')}")
else:
    print(f"❌ Unexpected response: HTTP {response.status_code}")
    print(response.text)

print("\n✅ Test complete!")
```

**Usage:**
```bash
pip install requests
export JWT_TOKEN="your-token-here"
python test_phase2.py
```

## Expected Results Summary

| Test | Expected Result |
|------|----------------|
| Check status (free user) | Returns plan with `max_applications: 25` |
| Create 1-25 apps | All succeed with `201 Created` |
| Create 26th app | Fails with `403 Forbidden` + limit message |
| Error handling | Fails securely (denies on errors) |
| Email ingestion | Also checks limits, returns 403 if exceeded |

## Troubleshooting

### "401 Unauthorized"
- Your JWT token is invalid or expired
- Get a fresh token from Supabase

### "500 Internal Server Error"
- Check backend logs for errors
- Verify database migration ran (subscription tables exist)
- Check that free plan exists in database

### "Limit not enforced"
- Check that subscription service is being called
- Verify database has subscription data
- Check backend logs for subscription check errors

### "Always returns 403"
- Check subscription service error handling
- Verify database connection
- Check that free plan exists in `subscription_plans` table

## Next Steps After Testing

1. ✅ Verify limit enforcement works correctly
2. ✅ Test error handling (fail-secure behavior)
3. ✅ Test email ingestion also respects limits
4. ✅ Verify upgrade prompts work in frontend
5. ✅ Test with Pro user (should have unlimited)


