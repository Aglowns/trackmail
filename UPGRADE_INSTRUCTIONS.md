# Upgrade Your Account to Pro - Step by Step

## Your Information
- **User ID**: `0a6623f5-24f3-4194-bf9b-8002da0571ea`
- **Email**: `aglonoqp@gmail.com`
- **Stripe Subscription**: `sub_1QKyVDC0sg0ZRk3BHLWp6ea`
- **Stripe Customer**: `cus_TOXVx0QDPUoCfQ`
- **Amount Paid**: $2.99

---

## Step 1: Run the SQL in Supabase

### 1.1 Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select your JobMail project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### 1.2 Copy and Paste This SQL

```sql
-- Manually Upgrade to Pro Plan
INSERT INTO user_subscriptions (
    user_id, 
    plan_id, 
    status, 
    stripe_subscription_id, 
    stripe_customer_id,
    current_period_start,
    current_period_end
)
SELECT 
    '0a6623f5-24f3-4194-bf9b-8002da0571ea',
    id,
    'active',
    'sub_1QKyVDC0sg0ZRk3BHLWp6ea',
    'cus_TOXVx0QDPUoCfQ',
    NOW(),
    NOW() + INTERVAL '1 month'
FROM subscription_plans 
WHERE plan_id = 'pro'
ON CONFLICT (user_id)
DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = NOW();
```

### 1.3 Run the Query
1. Click **"Run"** button (or press `Ctrl+Enter`)
2. You should see: **"Success. No rows returned"** ✅

### 1.4 Verify the Upgrade
Run this to confirm:

```sql
SELECT 
    us.user_id,
    us.status,
    us.stripe_subscription_id,
    sp.plan_id,
    sp.display_name
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = '0a6623f5-24f3-4194-bf9b-8002da0571ea';
```

You should see:
- `status`: `active` ✅
- `plan_id`: `pro` ✅
- `display_name`: `Pro` ✅

---

## Step 2: Verify on Your Website

### 2.1 Clear Cache and Reload
1. Go to: https://jobmail-frontend.vercel.app/subscription
2. **Hard refresh**: 
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

### 2.2 What You Should See
- ✅ Plan badge shows: **"Pro"** (not "Free")
- ✅ Usage shows: **"25 of ∞ applications"** (unlimited)
- ✅ Status: **"Active"**

### 2.3 Test Pro Features

**Dashboard:**
- Go to: https://jobmail-frontend.vercel.app/dashboard
- You should be able to add more than 25 applications ✅

**Analytics:**
- Go to: https://jobmail-frontend.vercel.app/analytics
- Analytics should load (no more 403 errors) ✅

**Gmail Add-on:**
- Open Gmail
- Open the JobMail add-on
- Auto-tracking should work automatically ✅

---

## Step 3: Push the Code Fix (For Future Payments)

While your account is now upgraded, we still need to push the code fix so future customers' payments work automatically.

### Option A: Run the Batch File
1. Open File Explorer
2. Navigate to: `C:\Users\aglon\Desktop\CURSOR\trackmail`
3. Double-click: **`push_webhook_fix.bat`**
4. Wait for it to complete

### Option B: Manual Git Commands
Open PowerShell and run:

```powershell
cd C:\Users\aglon\Desktop\CURSOR\trackmail
git add app/services/payment.py WEBHOOK_FIX_COMPLETE.md UPGRADE_ACCOUNT_SQL.sql UPGRADE_INSTRUCTIONS.md
git commit -m "Fix webhook user_id mapping and upgrade account"
git push origin main
```

### Wait for Render to Deploy
- Go to: https://dashboard.render.com
- Your service will auto-deploy (2-3 minutes)
- Check logs to see "Deployment complete" ✅

---

## Step 4: Test the Webhook Fix

Once Render finishes deploying:

### 4.1 Send Test Webhook
1. Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select: `customer.subscription.created`
5. Click **"Send test webhook"**

### 4.2 Check Render Logs
You should now see:
```
Processing Stripe webhook event: customer.subscription.created
Successfully processed Stripe webhook: customer.subscription.created
```

✅ No more "Could not find user_id" errors!

---

## Summary

**Immediate Actions:**
1. ✅ Run SQL in Supabase (Step 1)
2. ✅ Verify Pro upgrade on website (Step 2)
3. ✅ Push code fix to GitHub (Step 3)
4. ✅ Wait for Render deployment (2-3 min)
5. ✅ Test webhook (Step 4)

**What This Fixes:**
- ✅ Your account is now Pro (you paid $2.99)
- ✅ All Pro features unlocked
- ✅ Future customers will auto-upgrade after payment
- ✅ Webhooks will work correctly going forward

**Current Status:**
- Payment: ✅ Received ($2.99)
- Account: ⏳ Run SQL to activate
- Code: ⏳ Push to deploy
- Future: ✅ Will work automatically

---

## Troubleshooting

### If Pro features still don't work after SQL:
1. Hard refresh: `Ctrl+Shift+R`
2. Clear browser cache
3. Log out and log back in
4. Check Supabase SQL verification query

### If push fails:
- Try the batch file instead of manual commands
- Or send me the error and I'll help

### If webhook test still fails:
- Check that `STRIPE_WEBHOOK_SECRET` is set in Render
- Make sure Render deployment finished
- Check Render logs for any errors

---

Let me know once you've run the SQL and I'll help verify everything is working! 🚀

