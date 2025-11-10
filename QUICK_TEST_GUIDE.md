# Quick Test Guide - Pro Features

## What We Just Fixed

1. ✅ Improved rejection email detection (added "not been selected" and similar patterns)
2. ✅ Ready to test auto-tracking for Pro users
3. ✅ Need to verify subscription status is correct

---

## Step 1: Push the Gmail Add-on Fix

```powershell
cd C:\Users\aglon\Desktop\CURSOR\trackmail
git add gmail-addon/JobStatusDetection.gs FIX_AUTO_TRACKING_AND_DETECTION.md QUICK_TEST_GUIDE.md
git commit -m "Improve rejection email detection patterns"
git push origin main
```

Then deploy the updated code to your Gmail add-on:
1. Open Apps Script Editor
2. Click "Deploy" → "Test deployments"
3. Or just reload the add-on in Gmail

---

## Step 2: Verify Your Pro Status

### Option A: Check in Supabase (SQL)

```sql
SELECT 
    us.user_id,
    us.status,
    sp.name as plan_name,
    sp.features
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = '0a6623f5-24f3-4194-bf9b-8002da0571ea';
```

**Expected**: `plan_name = 'pro'`, `status = 'active'`, `features` contains `"auto_tracking": true`

### Option B: Check via API

Open browser console on https://jobmail-frontend.vercel.app and run:

```javascript
fetch('https://trackmail-backend1.onrender.com/v1/subscription/status', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('sb-YOUR_PROJECT_supabase-auth-token')
  }
}).then(r => r.json()).then(d => console.log(d))
```

**Expected output:**
```json
{
  "subscription": {
    "plan_name": "Pro",
    "status": "active"
  },
  "features": {
    "auto_tracking": true,
    "unlimited_applications": true,
    "advanced_analytics": true
  }
}
```

---

## Step 3: Test Rejection Email Detection

1. **Open Gmail**
2. **Find the rejection email** ("Thank you for applying to IN FOCUS...")
3. **Open the JobMail add-on**
4. **Click "Test Parsing"**

**Expected result:**
- Type: `Rejection`
- Company: `Jane Street` 
- Position: `IN FOCUS - Software Engineering Track`
- Status: `rejected`

If it still says "Not a job application", send me the output and I'll debug further.

---

## Step 4: Test Auto-Tracking

1. **Open a different job application email** (any job email you haven't tracked yet)
2. **The add-on should automatically show:**
   - ✅ "Auto-tracked successfully!"
   - Company name
   - Position
   - Status detected

If it shows the normal "Track This Application" button instead, that means auto-tracking isn't working.

---

## Troubleshooting

### If Auto-Tracking Doesn't Work:

Run this in Apps Script Editor:

```javascript
function debugAutoTracking() {
  const apiKey = getApiKey();
  console.log('Has API Key:', !!apiKey);
  
  const subscription = checkSubscriptionStatus();
  console.log('Subscription:', JSON.stringify(subscription, null, 2));
  
  const autoTrackingEnabled = subscription && 
                              subscription.features && 
                              subscription.features.auto_tracking === true;
  
  console.log('Auto-tracking enabled:', autoTrackingEnabled);
  
  return {
    hasApiKey: !!apiKey,
    subscription: subscription,
    autoTrackingEnabled: autoTrackingEnabled
  };
}
```

Send me the output!

### If Rejection Email Still Not Detected:

The patterns are now very comprehensive. If it still fails, it might be an issue with the OpenAI API key or the AI detection being too strict.

Try this test:

```javascript
function testRejectionDetection() {
  const html = "Thank you for applying to Jane Street's IN FOCUS program in NYC. Unfortunately, you have not been selected for this year's Software Engineering track.";
  const subject = "Thank you for applying to IN FOCUS - Software Engineering Track";
  const sender = "nyc-programs@janestreet.com";
  
  const result = detectJobApplicationStatus(html, subject, sender, "Jane Street", "IN FOCUS");
  console.log('Detection result:', JSON.stringify(result, null, 2));
  
  return result;
}
```

**Expected output:**
```json
{
  "status": "rejected",
  "confidence": 95,
  "isJobRelated": true,
  "indicators": ["not been selected", "unfortunately"]
}
```

---

## Summary

Run these tests and tell me:
1. ✅ or ❌ Subscription shows Pro with auto_tracking: true
2. ✅ or ❌ Rejection email detected correctly
3. ✅ or ❌ Auto-tracking works when opening new job emails

If any are ❌, send me the debug output and I'll fix it immediately!

