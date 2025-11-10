# Debug: Payment Went Through But Account Didn't Upgrade

## Problem
You successfully paid $2.99 on Stripe, but your JobMail account is still showing "Free" plan with the 25-application limit.

## Root Cause
The webhook from Stripe → Backend is either:
1. **Not being sent** (webhook endpoint not configured correctly)
2. **Not being received** (URL wrong or server unreachable)
3. **Being rejected** (signature verification failing)
4. **Being processed with errors** (user_id or plan_id missing/incorrect)

---

## Step 1: Check Stripe Webhook Status

### 1.1 Go to Stripe Dashboard
- https://dashboard.stripe.com
- Ensure you're in **Live mode** (top-left toggle)
- Go to: **Developers → Webhooks**

### 1.2 Find Your Live Webhook Endpoint
You should see:
```
Endpoint URL: https://jobmail-api.onrender.com/v1/subscription/webhook
Status: Enabled
Events: checkout.session.completed, customer.subscription.*
```

### 1.3 Check Recent Webhook Attempts
- Click on the webhook endpoint
- Look for **"Recent deliveries"** or **"Logs"**
- Find the `checkout.session.completed` event from your payment
- Check the **Response**:
  - ✅ **200 OK** = Webhook was received and processed successfully
  - ❌ **4xx/5xx** = Webhook failed (see error details)
  - ⏱️ **Timeout** = Your backend didn't respond in time
  - 🚫 **No attempt** = Webhook wasn't sent (endpoint not configured)

---

## Step 2: Check Render Backend Logs

### 2.1 Open Render Dashboard
- https://dashboard.render.com
- Click on your backend service (`jobmail-api` or similar)

### 2.2 Go to Logs Tab
- Click **"Logs"** in the left sidebar
- Look for recent entries (around the time you made the payment)

### 2.3 What to Look For

#### ✅ Success Messages (What You SHOULD See):
```
INFO:     127.0.0.1:xxxxx - "POST /v1/subscription/webhook HTTP/1.1" 200 OK
Processing Stripe webhook event: checkout.session.completed
Successfully processed Stripe webhook: checkout.session.completed
```

#### ❌ Error Messages (What Might Be Wrong):

**Missing User ID:**
```
Missing user_id or plan_id in checkout session: cs_test_...
```
**Fix:** The checkout session metadata is missing. Need to ensure `user_id` is passed correctly.

**Missing Webhook Secret:**
```
WARNING: Stripe webhook secret not configured
```
**Fix:** `STRIPE_WEBHOOK_SECRET` not set in Render environment variables.

**Signature Verification Failed:**
```
Invalid Stripe signature: ...
```
**Fix:** Wrong webhook secret or Stripe is using a different endpoint.

**No Logs at All:**
```
(nothing)
```
**Fix:** Webhook is not reaching your backend. Check URL and firewall.

---

## Step 3: Verify Render Environment Variables

Go to Render Dashboard → Your Service → **Environment**

Ensure these are set correctly:

### Required Live Keys:
```
STRIPE_SECRET_KEY=sk_live_51SQJK...  (starts with sk_live_)
STRIPE_PUBLISHABLE_KEY=pk_live_51SQJK...  (starts with pk_live_)
STRIPE_WEBHOOK_SECRET=whsec_...  (from your LIVE webhook endpoint)
```

⚠️ **Common Mistake:** Using test webhook secret (`whsec_test_...`) with live keys.

### How to Get the Correct Live Webhook Secret:
1. Stripe Dashboard → Developers → Webhooks
2. Click on your **Live** webhook endpoint
3. Click **"Signing secret"** → **"Reveal"**
4. Copy the `whsec_...` value
5. Paste it into Render's `STRIPE_WEBHOOK_SECRET`
6. Redeploy the service

---

## Step 4: Test the Webhook Manually

### 4.1 Trigger a Test Event from Stripe
- Stripe Dashboard → Developers → Webhooks
- Click on your webhook endpoint
- Click **"Send test webhook"**
- Select event: `checkout.session.completed`
- Add this JSON payload:

```json
{
  "id": "cs_test_manual",
  "object": "checkout.session",
  "customer": "cus_test",
  "subscription": "sub_test",
  "client_reference_id": "YOUR_ACTUAL_USER_ID_HERE",
  "metadata": {
    "user_id": "YOUR_ACTUAL_USER_ID_HERE",
    "plan_id": "YOUR_PRO_PLAN_ID_HERE"
  }
}
```

**How to Get Your User ID:**
1. Go to Supabase Dashboard → Authentication → Users
2. Find your email (`aglonoqp@gmail.com`)
3. Copy the UUID (something like `a1b2c3d4-...`)

**How to Get Your Pro Plan ID:**
Run this in Supabase SQL Editor:
```sql
SELECT id FROM subscription_plans WHERE plan_id = 'pro';
```

### 4.2 Check Response
- If you get **200 OK**, the webhook is working!
- If you get an error, copy the error message and we'll debug it.

---

## Step 5: Check Database

### 5.1 Open Supabase Dashboard
- https://supabase.com/dashboard
- Go to your project
- Click **"SQL Editor"**

### 5.2 Check Your Subscription
```sql
SELECT 
  us.user_id,
  us.status,
  us.stripe_subscription_id,
  us.stripe_customer_id,
  sp.plan_id,
  sp.display_name
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = 'YOUR_USER_ID_HERE';
```

**Expected Result:**
- `plan_id`: `pro`
- `status`: `active`
- `stripe_subscription_id`: `sub_...` (from Stripe)
- `stripe_customer_id`: `cus_...` (from Stripe)

**If Still Showing Free:**
- Webhook didn't process correctly
- Or user_id didn't match

---

## Step 6: Manual Fix (If Webhook is Broken)

If the webhook is completely broken and you need to upgrade your account NOW, run this SQL:

```sql
-- Get your user_id
SELECT id, email FROM auth.users WHERE email = 'aglonoqp@gmail.com';

-- Get pro plan_id
SELECT id, plan_id FROM subscription_plans WHERE plan_id = 'pro';

-- Manually upgrade (replace with your actual IDs)
INSERT INTO user_subscriptions (user_id, plan_id, status, stripe_subscription_id, stripe_customer_id)
VALUES (
  'YOUR_USER_ID',
  'YOUR_PRO_PLAN_ID',
  'active',
  'sub_manual_upgrade',
  'cus_manual_upgrade'
)
ON CONFLICT (user_id)
DO UPDATE SET
  plan_id = 'YOUR_PRO_PLAN_ID',
  status = 'active',
  updated_at = NOW();
```

⚠️ **This is a temporary fix** - you still need to fix the webhook for future payments!

---

## Step 7: Verify Upgrade Worked

### 7.1 Refresh Your Frontend
- Go to https://jobmail-frontend.vercel.app/subscription
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### 7.2 Check Features
You should now see:
- ✅ **Pro Plan** badge
- ✅ **Unlimited applications** (no more 25 limit)
- ✅ **Auto-tracking enabled** in Gmail Add-on
- ✅ **Analytics** dashboard accessible
- ✅ **Export** buttons working

---

## Next Steps

1. **Check Stripe Webhook Logs** (Step 1.3) - This will tell you if webhooks are being sent
2. **Check Render Logs** (Step 2.2) - This will tell you if they're being received
3. **Verify Environment Variables** (Step 3) - Especially the webhook secret
4. **Send me the results** of the above checks and I'll help debug further

---

## Quick Checklist

- [ ] Stripe webhook endpoint exists and is enabled
- [ ] Webhook URL is correct: `https://jobmail-api.onrender.com/v1/subscription/webhook`
- [ ] Webhook events include: `checkout.session.completed`
- [ ] Render has `STRIPE_WEBHOOK_SECRET` set to the LIVE secret
- [ ] Render has `STRIPE_SECRET_KEY` set to live key (starts with `sk_live_`)
- [ ] Render logs show webhook was received
- [ ] Database shows your subscription is updated to "pro"

---

Let me know what you find in the Stripe webhook logs and Render logs, and I'll help you fix it!

