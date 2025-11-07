# Test Full Payment Flow - Step by Step

## 🎯 Goal

Test the complete payment flow:
1. Create checkout session
2. Complete payment
3. Verify webhook processes with real metadata
4. Check subscription is created

## 📋 Prerequisites

- ✅ Server running (port 8000)
- ✅ `stripe listen` running
- ✅ You have a JWT token for authentication

## Step 1: Get Your JWT Token

You need a JWT token from Supabase Auth to call the upgrade endpoint.

**Option A: From your frontend/app**
- Sign in and copy the JWT token from browser storage or network requests

**Option B: Generate test token**
- Use Supabase dashboard or your auth system

## Step 2: Create Checkout Session

### Using Swagger UI (Easiest)

1. **Open Swagger UI:**
   ```
   http://localhost:8000/docs
   ```

2. **Authorize:**
   - Click the **"Authorize"** button (top right)
   - Enter your JWT token in the format: `Bearer <your_token>`
   - Click "Authorize"

3. **Call Upgrade Endpoint:**
   - Find: `POST /v1/subscription/upgrade`
   - Click "Try it out"
   - Enter:
     ```json
     {
       "plan_name": "pro",
       "billing_period": "monthly"
     }
     ```
   - Click "Execute"

4. **Copy the Checkout URL:**
   - In the response, copy the `checkout_url`
   - It will look like: `https://checkout.stripe.com/c/pay/cs_test_...`

### Using PowerShell (Alternative)

```powershell
$token = "your_jwt_token_here"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    plan_name = "pro"
    billing_period = "monthly"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/v1/subscription/upgrade" -Method POST -Headers $headers -Body $body
$response.checkout_url
```

## Step 3: Complete Payment

1. **Open the checkout URL** in your browser

2. **Use Test Card:**
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

3. **Complete the payment**

## Step 4: Verify Webhook Processing

### Check Server Logs

You should see:
```
INFO: 127.0.0.1:xxxxx "POST /v1/subscription/webhook HTTP/1.1" 200 OK
Processing Stripe webhook event: checkout.session.completed
Successfully processed Stripe webhook: checkout.session.completed
```

**This time, you should NOT see "Missing user_id"** because real checkout sessions include metadata!

### Check `stripe listen` Window

Should show:
```
--> checkout.session.completed [evt_xxxxx]
<--  [200] POST http://localhost:8000/v1/subscription/webhook [evt_xxxxx]
```

## Step 5: Verify Subscription Created

Check your database or use the subscription status endpoint:

```powershell
$token = "your_jwt_token_here"
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:8000/v1/subscription/status" -Method GET -Headers $headers
```

Should show:
- Plan: "Pro"
- Status: "active"
- Features: unlimited applications, auto_tracking, etc.

## ✅ Success Indicators

- ✅ Checkout session created
- ✅ Payment completed
- ✅ Webhook received and processed
- ✅ No "Missing user_id" error (real checkout has metadata)
- ✅ Subscription created/updated in database

## 🎉 Ready to Test!

Start with Step 1 - get your JWT token and create a checkout session!

