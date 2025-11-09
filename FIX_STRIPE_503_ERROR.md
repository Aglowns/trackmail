# Fix: Stripe 503 Error - "Failed to start checkout session"

## Problem

When clicking "Upgrade to Pro" in the frontend, you're getting a **503 Service Unavailable** error with the message:
```
Failed to start checkout session
```

## Root Cause

The backend (deployed on Render) is returning a 503 error because either:

1. **Stripe module is not installed** on the production server, OR
2. **`STRIPE_SECRET_KEY` environment variable is not set** in Render

Looking at the code, the `payment.py` service checks for both conditions and returns a 503 error if either is missing.

## Solution

You need to configure the Stripe environment variables in Render.

### Step 1: Go to Render Dashboard

1. Visit https://dashboard.render.com
2. Find your `jobmail-api` service (or whatever you named the backend)
3. Click on it

### Step 2: Add Environment Variables

1. Click on **"Environment"** in the left sidebar
2. Click **"Add Environment Variable"** button
3. Add these three variables:

#### Variable 1: STRIPE_SECRET_KEY
- **Key**: `STRIPE_SECRET_KEY`
- **Value**: `sk_test_51SQJL41RJeIrTwIa30GjKSqvlVW65U3Ni7ig2LcW5YWxgp7k0LQhm4lKIOsHOJCrTJWVWmJhDKKNENR8cqD9mxc500i8vNpdCN`

#### Variable 2: STRIPE_PUBLISHABLE_KEY
- **Key**: `STRIPE_PUBLISHABLE_KEY`
- **Value**: `pk_test_51SQJL41RJeIrTwIa2XHgtPi0K19R0YEE89EpN0QwdCP9oLQYmC444Dbg06kr4tfOliWl51Bwxnag2KkgzTPTi7Kh00GrPZ7den`

#### Variable 3: STRIPE_WEBHOOK_SECRET
- **Key**: `STRIPE_WEBHOOK_SECRET`
- **Value**: `whsec_your_webhook_secret_here` (you'll update this later after setting up production webhook)

4. Click **"Save Changes"**

### Step 3: Verify Stripe Module is Installed

The `stripe` module should already be in `requirements.txt`, but let's verify:

Check that `requirements.txt` contains:
```
stripe>=7.0.0
```

If it's there (which it should be from our previous work), Render will automatically install it on the next deployment.

### Step 4: Redeploy

After adding the environment variables:

1. Render should automatically trigger a new deployment
2. **OR** manually trigger one by clicking **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for the deployment to complete (usually 2-3 minutes)

### Step 5: Verify the Fix

Once deployed:

1. Go back to https://jobmail-frontend.vercel.app/subscription
2. Click "Upgrade to Pro"
3. Select a billing period
4. Click "Start Pro plan"
5. You should now be redirected to Stripe checkout instead of getting an error!

---

## Alternative: Check Logs

If you want to see exactly what's happening:

1. In Render Dashboard → Your Service
2. Click on **"Logs"** tab
3. Look for warning messages like:
   - `"WARNING: Stripe module not installed"`
   - `"WARNING: STRIPE_SECRET_KEY not set"`

These will tell you which issue you're facing.

---

## Expected Behavior After Fix

Once the environment variables are set and the service is redeployed:

1. ✅ Backend will initialize Stripe with your API key
2. ✅ `create_checkout_session` endpoint will work
3. ✅ Frontend will receive a `checkout_url`
4. ✅ User will be redirected to Stripe's secure checkout page
5. ✅ After payment, webhook will update the database
6. ✅ User will be upgraded to Pro plan!

---

## Important Notes

### For Production (Later):

When you're ready to accept real payments:

1. Switch to **live mode** in Stripe Dashboard
2. Get your **live API keys** (starts with `sk_live_...` and `pk_live_...`)
3. Update the environment variables in Render with **live keys**
4. Set up a **production webhook** endpoint:
   - In Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://jobmail-api.onrender.com/v1/subscription/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.*`
   - Copy the webhook signing secret
   - Update `STRIPE_WEBHOOK_SECRET` in Render

### Security:

- ✅ Never commit API keys to git (already in `.gitignore`)
- ✅ Use test keys for development/staging
- ✅ Use live keys only in production
- ✅ Rotate keys if compromised

---

## Quick Fix Summary

```bash
# 1. Go to Render Dashboard
https://dashboard.render.com

# 2. Select your service

# 3. Environment → Add Environment Variables:
STRIPE_SECRET_KEY=sk_test_51SQJL41RJeIrTwIa30GjKSqvlVW65U3Ni7ig2LcW5YWxgp7k0LQhm4lKIOsHOJCrTJWVWmJhDKKNENR8cqD9mxc500i8vNpdCN
STRIPE_PUBLISHABLE_KEY=pk_test_51SQJL41RJeIrTwIa2XHgtPi0K19R0YEE89EpN0QwdCP9oLQYmC444Dbg06kr4tfOliWl51Bwxnag2KkgzTPTi7Kh00GrPZ7den
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# 4. Save Changes → Wait for auto-redeploy

# 5. Test again!
```

---

## Verification Checklist

After deploying:

- [ ] Environment variables added to Render
- [ ] Service redeployed successfully
- [ ] Logs show no Stripe warnings
- [ ] Frontend loads subscription page without errors
- [ ] "Upgrade to Pro" button works
- [ ] Redirects to Stripe checkout page
- [ ] Console shows no 503 errors

---

That's it! Once you add those environment variables to Render, the payment flow will work perfectly. 🚀

