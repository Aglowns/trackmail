# Fix: Webhook Not Being Received

## Problem Identified ✅

Looking at your Render logs, your backend is running at:
```
https://trackmail-backend1.onrender.com
```

But your Stripe webhook is probably configured for a different URL, which is why webhooks are never reaching your backend.

---

## Solution: Update Stripe Webhook URL

### Step 1: Go to Stripe Dashboard
- https://dashboard.stripe.com
- Make sure you're in **Live mode** (top-left toggle)
- Go to: **Developers → Webhooks**

### Step 2: Check Your Current Webhook
Look at the endpoint URL. It probably says something like:
- ❌ `https://jobmail-api.onrender.com/v1/subscription/webhook` (WRONG)
- ❌ `https://trackmail-backend.onrender.com/v1/subscription/webhook` (WRONG)

But it should be:
- ✅ `https://trackmail-backend1.onrender.com/v1/subscription/webhook` (CORRECT)

### Step 3: Fix the Webhook URL

#### Option A: Update Existing Webhook (Recommended)
1. Click on your existing webhook endpoint
2. Click **"..."** (three dots) → **"Update details"**
3. Change the URL to:
   ```
   https://trackmail-backend1.onrender.com/v1/subscription/webhook
   ```
4. Click **"Update endpoint"**

#### Option B: Create New Webhook (If needed)
1. Click **"Add endpoint"** button
2. Enter endpoint URL:
   ```
   https://trackmail-backend1.onrender.com/v1/subscription/webhook
   ```
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **"Add endpoint"**
5. Click **"Reveal"** on the signing secret and copy it
6. Go to Render → Your Service → Environment
7. Update `STRIPE_WEBHOOK_SECRET` with the new secret
8. Redeploy the service

### Step 4: Delete Old Webhook (If you created a new one)
- If you created a new webhook in Option B, delete the old one
- Click on the old webhook → "..." → "Delete endpoint"

---

## Step 5: Test the Webhook

### Method 1: Send Test Webhook from Stripe
1. In Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select event type: `checkout.session.completed`
5. Click **"Send test webhook"**

### Method 2: Make Another Payment (Small Test)
1. Go to your site: https://jobmail-frontend.vercel.app/subscription
2. Click "Upgrade to Pro"
3. Use a test card: `4242 4242 4242 4242`
4. Complete the payment

### Check Render Logs
After sending the test webhook or making a payment, check Render logs again.

You should NOW see:
```
INFO:     xxx.xxx.xxx.xxx:0 - "POST /v1/subscription/webhook HTTP/1.1" 200 OK
Processing Stripe webhook event: checkout.session.completed
Successfully processed Stripe webhook: checkout.session.completed
```

---

## Step 6: Manually Upgrade Your Account (For Now)

Since you already paid $2.99, let's manually upgrade your account while we fix the webhook.

### Get Your User ID
1. Go to Supabase Dashboard → Authentication → Users
2. Find your email: `aglonoqp@gmail.com`
3. Copy your User ID (UUID like: `a1b2c3d4-e5f6-...`)

### Run This SQL in Supabase
1. Supabase Dashboard → SQL Editor
2. Click "New query"
3. Paste this (replace `YOUR_USER_ID` with your actual UUID):

```sql
-- First, get the pro plan ID
SELECT id, plan_id, display_name FROM subscription_plans WHERE plan_id = 'pro';

-- Copy the 'id' from the result above, then run this:
-- Replace YOUR_USER_ID with your actual user UUID
-- Replace YOUR_PRO_PLAN_ID with the 'id' from the query above

INSERT INTO user_subscriptions (user_id, plan_id, status, stripe_subscription_id, stripe_customer_id)
VALUES (
  'YOUR_USER_ID',  -- Replace with your actual user_id
  'YOUR_PRO_PLAN_ID',  -- Replace with pro plan id from above
  'active',
  'sub_manual_upgrade_2025_11_09',
  'cus_manual_upgrade_2025_11_09'
)
ON CONFLICT (user_id)
DO UPDATE SET
  plan_id = EXCLUDED.plan_id,
  status = 'active',
  updated_at = NOW();
```

4. Click **"Run"**

### Verify the Upgrade
1. Go to https://jobmail-frontend.vercel.app/subscription
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. You should now see **"Pro"** plan with unlimited applications!

---

## Summary

**Immediate Actions:**
1. ✅ Update Stripe webhook URL to: `https://trackmail-backend1.onrender.com/v1/subscription/webhook`
2. ✅ Run SQL to manually upgrade your account (since you already paid)
3. ✅ Test webhook with "Send test webhook" button

**After Fixing:**
- All future payments will automatically upgrade accounts
- Webhooks will be logged in Render
- No manual SQL needed

---

## Quick Checklist

- [ ] Stripe webhook URL updated to `https://trackmail-backend1.onrender.com/v1/subscription/webhook`
- [ ] Test webhook sent from Stripe dashboard
- [ ] Render logs show `POST /v1/subscription/webhook HTTP/1.1" 200 OK`
- [ ] Your account manually upgraded via SQL
- [ ] Frontend shows "Pro" plan

Let me know once you've updated the webhook URL and I'll help you with the manual upgrade SQL!

