# Configure Your Stripe Test Keys

## ✅ Your Stripe Test Keys

**Publishable Key:**
```
pk_test_your_publishable_key_here
```

**Secret Key:**
```
sk_test_your_secret_key_here
```

## Step 1: Create/Update .env File

Create a `.env` file in the root directory (if it doesn't exist) and add your Stripe keys:

```env
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Webhook Secret (get this after setting up webhook - see Step 2)
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URL (for checkout redirects)
FRONTEND_URL=https://jobmail-frontend.vercel.app
```

## Step 2: Set Up Webhook Endpoint

### Option A: Local Development (Stripe CLI)

1. **Install Stripe CLI:**
   - Download: https://stripe.com/docs/stripe-cli
   - Or Windows: `scoop install stripe`
   - Or Mac: `brew install stripe/stripe-cli/stripe`

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:8000/v1/subscription/webhook
   ```
   
   This will output a webhook signing secret like:
   ```
   > Ready! Your webhook signing secret is whsec_... (^C to quit)
   ```
   
   Copy that `whsec_...` value and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### Option B: Production (Stripe Dashboard)

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   https://your-backend.onrender.com/v1/subscription/webhook
   ```
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add it to your `.env` file and also to Render environment variables

## Step 3: Install Stripe Package

Make sure Stripe is installed:

```bash
pip install stripe>=7.0.0
```

Or if using requirements.txt:

```bash
pip install -r requirements.txt
```

## Step 4: Test the Configuration

### Test 1: Check if keys are loaded

Run your backend server and check the logs. You should see:
```
✅ Stripe configured successfully
```

If you see warnings about Stripe not being configured, check your `.env` file.

### Test 2: Create a checkout session

Use Swagger UI or curl to test:

```bash
POST /v1/subscription/upgrade
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "plan_name": "pro",
  "billing_period": "monthly"
}
```

You should get a response with a `checkout_url`.

### Test 3: Complete a test payment

1. Use the checkout URL from the response
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date (e.g., 12/25)
4. Any 3-digit CVC (e.g., 123)
5. Any ZIP code (e.g., 12345)

### Test 4: Verify webhook processing

Check your backend logs for:
- ✅ Webhook received
- ✅ Signature verified
- ✅ Event processed: checkout.session.completed
- ✅ Subscription created in database

## Step 5: For Render Deployment

If deploying to Render, add these environment variables:

1. Go to Render Dashboard → Your Service → Environment
2. Add these variables:
   - `STRIPE_SECRET_KEY` = `sk_test_your_secret_key_here`
   - `STRIPE_PUBLISHABLE_KEY` = `pk_test_your_publishable_key_here`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from webhook setup)

## Important Notes

✅ **Test Mode**: These are test keys - safe for development
✅ **Security**: Never commit `.env` file to git (already in `.gitignore`)
✅ **Production**: Use different keys for production (live mode keys from Stripe)

## Troubleshooting

### "Stripe module not installed"
```bash
pip install stripe>=7.0.0
```

### "Payment processing is not configured"
- Check `.env` file exists and has `STRIPE_SECRET_KEY`
- Restart your server after adding env vars
- Check logs for configuration errors

### Webhook not working
- Verify webhook secret matches in `.env` and Stripe Dashboard
- Check webhook endpoint URL is correct
- Check Stripe Dashboard → Webhooks → Events for delivery status

## Next Steps

Once configured:
1. ✅ Test checkout session creation
2. ✅ Test payment flow with test card
3. ✅ Verify webhook processing
4. ✅ Check subscription updates in database

You're ready to test payments! 🚀

