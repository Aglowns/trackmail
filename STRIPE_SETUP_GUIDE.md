# Stripe Payment Integration Setup Guide

## Overview

This guide will help you set up Stripe payment processing for subscription upgrades in TrackMail.

## Step 1: Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click **"Sign up"** or **"Start now"**
3. Create an account with your email
4. Complete the account setup (you can use test mode initially)

## Step 2: Get API Keys

### Test Mode Keys (for development)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in top right)
3. Navigate to **Developers** → **API keys**
4. You'll see:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key" to see it

### Production Keys (for live payments)

1. Switch to **Live mode** in Stripe Dashboard
2. Navigate to **Developers** → **API keys**
3. Get your live keys (starts with `pk_live_...` and `sk_live_...`)

## Step 3: Set Up Webhook Endpoint

### For Development (using Stripe CLI)

1. **Install Stripe CLI:**
   - Download from: https://stripe.com/docs/stripe-cli
   - Or use: `brew install stripe/stripe-cli/stripe` (Mac)
   - Or: `scoop install stripe` (Windows)

2. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:8000/v1/subscription/webhook
   ```
   
   This will give you a webhook signing secret (starts with `whsec_...`)

### For Production (on Render)

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **"Add endpoint"**
3. Enter your endpoint URL:
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

## Step 4: Configure Environment Variables

Add these to your `.env` file or deployment environment:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51...  # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_51...  # Optional, for frontend reference
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook signing secret

# Frontend URL (for checkout redirects)
FRONTEND_URL=https://your-frontend.vercel.app  # Optional, defaults to jobmail-frontend.vercel.app
```

### For Render Deployment

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add the variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PUBLISHABLE_KEY` (optional)

## Step 5: Create Products and Prices in Stripe

### Option A: Use Stripe Dashboard (Recommended)

1. Go to **Products** → **Add product**
2. **Name:** "TrackMail Pro"
3. **Description:** "Unlimited applications with AI-powered automation"
4. **Pricing:**
   - **Recurring:** Monthly
   - **Price:** $2.99 USD
   - Click **"Add another price"**
   - **Recurring:** Yearly
   - **Price:** $29.99 USD
5. Save the **Price IDs** (start with `price_...`)

### Option B: Use Code (Optional)

You can create products/prices programmatically using Stripe API, but the Dashboard method is simpler.

## Step 6: Update Database with Stripe Price IDs (Optional)

If you want to use Stripe Price IDs directly instead of creating prices on-the-fly:

1. Add columns to `subscription_plans` table:
   ```sql
   ALTER TABLE subscription_plans 
   ADD COLUMN stripe_price_id_monthly TEXT,
   ADD COLUMN stripe_price_id_yearly TEXT;
   ```

2. Update plans with Stripe Price IDs:
   ```sql
   UPDATE subscription_plans 
   SET stripe_price_id_monthly = 'price_...',
       stripe_price_id_yearly = 'price_...'
   WHERE name = 'pro';
   ```

## Step 7: Test the Integration

### Test with Stripe Test Cards

1. Go to your app and try to upgrade
2. Use Stripe test card: `4242 4242 4242 4242`
3. Use any future expiry date (e.g., 12/25)
4. Use any 3-digit CVC (e.g., 123)
5. Use any ZIP code (e.g., 12345)

### Test Webhook Events

Using Stripe CLI:
```bash
# Trigger checkout completion
stripe trigger checkout.session.completed

# Trigger subscription creation
stripe trigger customer.subscription.created

# Trigger subscription update
stripe trigger customer.subscription.updated

# Trigger subscription deletion
stripe trigger customer.subscription.deleted
```

## Step 8: Verify Integration

1. **Check backend logs** for webhook processing
2. **Check database** - subscription should be created/updated
3. **Test user flow:**
   - User clicks "Upgrade to Pro"
   - Redirected to Stripe checkout
   - Completes payment
   - Webhook updates subscription
   - User now has Pro access

## Troubleshooting

### Webhook Not Received

- Check webhook endpoint URL is correct
- Verify webhook secret matches
- Check Stripe Dashboard → Webhooks → Events for delivery status
- Check backend logs for incoming webhooks

### Payment Not Processing

- Verify Stripe secret key is correct
- Check you're using test keys for test mode
- Verify frontend is calling `/v1/subscription/upgrade`
- Check browser console for errors

### Subscription Not Updating

- Check webhook is properly configured
- Verify webhook signature verification is working
- Check database for subscription records
- Review backend logs for webhook processing errors

## Security Best Practices

1. ✅ **Never commit API keys to git** - Use environment variables
2. ✅ **Use different keys for test/production**
3. ✅ **Verify webhook signatures** - Already implemented
4. ✅ **Use HTTPS** - Required for webhooks
5. ✅ **Monitor webhook events** - Check Stripe Dashboard regularly

## Next Steps

Once Stripe is configured:
1. Test the full checkout flow
2. Set up production Stripe account
3. Configure production webhook endpoint
4. Go live! 🚀

