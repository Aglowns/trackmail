# Test Full Payment Flow - Complete Guide

## 🎯 Goal

Test the complete payment flow end-to-end:
1. Create checkout session with your user account
2. Complete payment with test card
3. Verify webhook processes with real metadata
4. Confirm subscription is created

## Step 1: Get Your JWT Token

You need a JWT token from Supabase Auth. Here are your options:

### Option A: Use Existing Token (If You Have One)

If you're already logged into your app/frontend, you can get the token from:
- Browser DevTools → Application → Local Storage → Look for Supabase auth token
- Or from your Gmail add-on if you're already authenticated

### Option B: Get Token from Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **Users**
3. Find your user (or create a test user)
4. Click on the user
5. Copy the **Access Token** (this is your JWT)

### Option C: Generate Token via API

If you have credentials, you can sign in via Supabase API to get a token.

## Step 2: Create Checkout Session

### Using Swagger UI (Recommended)

1. **Open Swagger UI:**
   ```
   http://localhost:8000/docs
   ```

2. **Authorize:**
   - Click the **"Authorize"** button (top right, lock icon)
   - In the "Value" field, enter: `Bearer YOUR_JWT_TOKEN_HERE`
   - Replace `YOUR_JWT_TOKEN_HERE` with your actual token
   - Click **"Authorize"**
   - Click **"Close"**

3. **Find Upgrade Endpoint:**
   - Scroll to find: `POST /v1/subscription/upgrade`
   - Click on it to expand

4. **Try It Out:**
   - Click **"Try it out"** button
   - In the request body, enter:
     ```json
     {
       "plan_name": "pro",
       "billing_period": "monthly"
     }
     ```
   - Click **"Execute"**

5. **Get Checkout URL:**
   - In the response, look for `checkout_url`
   - Copy the entire URL (starts with `https://checkout.stripe.com/...`)

### Using PowerShell (Alternative)

```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    plan_name = "pro"
    billing_period = "monthly"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/v1/subscription/upgrade" -Method POST -Headers $headers -Body $body
Write-Host "Checkout URL: $($response.checkout_url)"
$response.checkout_url
```

## Step 3: Complete Payment

1. **Open the checkout URL** in your browser
   - It will look like: `https://checkout.stripe.com/c/pay/cs_test_...`

2. **Use Test Card:**
   - **Card Number:** `4242 4242 4242 4242`
   - **Expiry Date:** Any future date (e.g., `12/25`)
   - **CVC:** Any 3 digits (e.g., `123`)
   - **ZIP Code:** Any 5 digits (e.g., `12345`)

3. **Complete Payment:**
   - Fill in the card details
   - Click **"Pay"** or **"Subscribe"**

4. **After Payment:**
   - You'll be redirected to the success page
   - The URL will include `?success=true&session_id=...`

## Step 4: Verify Webhook Processing

### Check Server Logs

In your **server terminal**, you should see:

```
INFO: 127.0.0.1:xxxxx "POST /v1/subscription/webhook HTTP/1.1" 200 OK
Processing Stripe webhook event: checkout.session.completed
Successfully processed Stripe webhook: checkout.session.completed
```

**Important:** This time you should **NOT** see "Missing user_id" because real checkout sessions include the metadata we set!

### Check `stripe listen` Window

Should show:
```
--> checkout.session.completed [evt_xxxxx]
<--  [200] POST http://localhost:8000/v1/subscription/webhook [evt_xxxxx]
```

## Step 5: Verify Subscription Created

### Check Subscription Status

**Using Swagger UI:**
1. Go to: `GET /v1/subscription/status`
2. Click "Try it out" → "Execute"
3. Should show:
   ```json
   {
     "subscription": {
       "plan_name": "Pro",
       "status": "active"
     },
     "features": {
       "max_applications": null,
       "auto_tracking": true,
       "unlimited_applications": true
     }
   }
   ```

**Using PowerShell:**
```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:8000/v1/subscription/status" -Method GET -Headers $headers
```

## ✅ Success Indicators

- ✅ Checkout session created successfully
- ✅ Payment completed with test card
- ✅ Webhook received and processed
- ✅ **No "Missing user_id" error** (real checkout has metadata!)
- ✅ Subscription status shows "Pro" plan
- ✅ Features show `auto_tracking: true` and `unlimited_applications: true`

## 🎉 You're Done!

If all steps succeed, your Stripe integration is **fully functional** and ready for production!

## 🚀 Next Steps

1. **Test with different plans** (yearly billing)
2. **Test subscription updates** (upgrade/downgrade)
3. **Test subscription cancellation**
4. **Set up production Stripe account**
5. **Configure production webhook endpoint**

**Ready to start? Get your JWT token and create a checkout session!**

