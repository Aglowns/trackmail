# Fix: Auto-Tracking Not Working + Emails Not Being Detected

## Problems Identified

### Problem 1: Auto-Tracking Not Working for Pro Users
You're on the Pro plan, but auto-tracking isn't working when you open emails.

**Root Cause**: The subscription check in `Code.gs` line 38-40 is correct, but we need to verify the subscription status is being returned properly from the backend.

### Problem 2: Clear Rejection Emails Not Being Detected
The email saying "you have not been selected" should be recognized as a rejection, but it's being marked as "not a job application."

**Root Cause**: The AI detection might be too strict or the fallback pattern matching needs improvement.

---

## Solution: Three-Step Fix

### Step 1: Verify Subscription Status API

First, let's make sure the backend is returning the correct subscription data.

**Test this in your browser console** (while logged into JobMail frontend):

```javascript
fetch('https://trackmail-backend1.onrender.com/v1/subscription/status', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  }
}).then(r => r.json()).then(d => console.log(d))
```

**Expected response:**
```json
{
  "subscription": {
    "plan_name": "Pro",
    "status": "active"
  },
  "features": {
    "max_applications": null,
    "auto_tracking": true,
    "unlimited_applications": true,
    "advanced_analytics": true,
    "export_data": true
  },
  "usage": {
    "applications_count": 25,
    "applications_limit": null
  }
}
```

If `features.auto_tracking` is NOT `true`, the problem is in the database.

---

### Step 2: Fix Database (If Needed)

Run this SQL in Supabase to ensure auto_tracking is enabled:

```sql
-- Verify current subscription
SELECT 
    us.user_id,
    sp.name as plan_name,
    sp.features
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = '0a6623f5-24f3-4194-bf9b-8002da0571ea';
```

If `features` doesn't show `"auto_tracking": true`, run this:

```sql
-- Update Pro plan features to ensure auto_tracking is true
UPDATE subscription_plans
SET features = '{
    "max_applications": null,
    "auto_tracking": true,
    "unlimited_applications": true,
    "advanced_analytics": true,
    "export_data": true
}'::jsonb
WHERE name = 'pro';
```

---

### Step 3: Improve Email Detection (Gmail Add-on)

The fallback pattern matching in `JobStatusDetection.gs` is already comprehensive, but let's ensure it catches rejection emails better.

**Update needed in `gmail-addon/JobStatusDetection.gs`:**

Find the `rejected` patterns section (around line 285-297) and verify it includes:

```javascript
'rejected': {
  patterns: [
    'unfortunately', 'regret', 'not selected', 'selected another', 
    'unsuccessful', 'not moving forward', 'will not be',
    'pursue other candidates', 'other applicants',
    'not proceed', 'not advance', 'not selected for', 'not move forward',
    'not the right fit', 'not move to the next stage', 'not advance to',
    'not selected to continue', 'not selected for the next round',
    'we have decided to pursue another candidate', 'decided to pursue another',
    'pursue another candidate', 'another candidate',
    'not advance to the next stage',
    'better match the qualifications',
    'we have reviewed your resume and have carefully considered',
    'decided to pursue other candidates for this position',
    // ADD THESE NEW PATTERNS:
    'you have not been selected', 
    'not been selected',
    'have not been selected for',
    'will not be moving forward'
  ],
  confidence: 95
}
```

---

## Quick Fix Script (Run in Apps Script Editor)

Open Gmail Add-on → Apps Script Editor → Run this function:

```javascript
function debugCurrentSubscription() {
  console.log('=== DEBUGGING SUBSCRIPTION ===');
  
  // Check if authenticated
  const apiKey = getApiKey();
  console.log('Has API Key:', !!apiKey);
  
  if (!apiKey) {
    console.log('ERROR: Not authenticated!');
    return 'Not authenticated';
  }
  
  // Check subscription status
  const subscription = checkSubscriptionStatus();
  console.log('Subscription response:', JSON.stringify(subscription, null, 2));
  
  // Check auto-tracking specifically
  const autoTrackingEnabled = subscription && 
                              subscription.features && 
                              subscription.features.auto_tracking === true;
  
  console.log('Auto-tracking enabled:', autoTrackingEnabled);
  
  // Check plan name
  const planName = subscription && subscription.subscription && subscription.subscription.plan_name;
  console.log('Plan name:', planName);
  
  return {
    authenticated: !!apiKey,
    subscription: subscription,
    autoTrackingEnabled: autoTrackingEnabled,
    planName: planName
  };
}
```

**Expected output:**
```
Has API Key: true
Auto-tracking enabled: true
Plan name: Pro
```

If `Auto-tracking enabled: false`, then the backend isn't returning the right data.

---

## Step 4: Test Auto-Tracking

Once fixed, test with this function:

```javascript
function testAutoTrackingWithCurrentEmail() {
  // Get most recent email
  const threads = GmailApp.getInboxThreads(0, 1);
  if (threads.length === 0) return 'No emails found';
  
  const messages = threads[0].getMessages();
  if (messages.length === 0) return 'No messages in thread';
  
  const messageId = messages[0].getId();
  const accessToken = 'test';
  
  console.log('Testing auto-tracking with message:', messageId);
  
  // Simulate what happens when Pro user opens an email
  const autoTrackResult = attemptAutoTracking(messageId, accessToken);
  
  console.log('Auto-track result:', JSON.stringify(autoTrackResult, null, 2));
  
  return autoTrackResult;
}
```

---

## Summary Checklist

- [ ] Backend returns `features.auto_tracking: true` for Pro users
- [ ] Database has Pro plan with `auto_tracking: true` in features JSONB
- [ ] Gmail add-on recognizes Pro status correctly
- [ ] Rejection emails are detected (pattern matching includes "not been selected")
- [ ] Auto-tracking works when opening job emails
- [ ] Manual "Track This Application" still works as backup

---

## If Still Not Working

Send me:
1. Output of `debugCurrentSubscription()` function
2. Output of the subscription status SQL query
3. Screenshot of what you see when you open a job email in Gmail

I'll diagnose the exact issue and provide a targeted fix!

