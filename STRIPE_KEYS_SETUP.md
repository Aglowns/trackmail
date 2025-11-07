# Stripe Keys Configuration - Test Mode

## ✅ Your Stripe Test Keys

I've noted your Stripe test keys. Here's how to configure them:

### Environment Variables

Add these to your `.env` file (create it if it doesn't exist):

```env
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Webhook Secret (you'll get this after setting up webhook)
STRIPE_WEBHOOK_SECRET=whsec_...  # See instructions below

# Frontend URL (for checkout redirects)
FRONTEND_URL=https://jobmail-frontend.vercel.app
```

## Next Steps

### 1. Set Up Webhook Endpoint

**For Local Development (using Stripe CLI):**

1. Install Stripe CLI if you haven't:
   ```bash
   # Windows (using scoop)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:8000/v1/subscription/webhook
   ```
   
   This will give you a webhook signing secret (starts with `whsec_...`)
   Copy that and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

**For Production (Render deployment):**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. Enter your backend URL:
   ```
   https://your-backend.onrender.com/v1/subscription/webhook
   ```
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add it to your Render environment variables as `STRIPE_WEBHOOK_SECRET`

### 2. Test the Integration

**Test Card Numbers (Stripe Test Mode):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0027 6000 3184`

Use any:
- Future expiry date (e.g., 12/25)
- Any 3-digit CVC (e.g., 123)
- Any ZIP code (e.g., 12345)

**Test the Upgrade Flow:**

1. Start your backend server
2. Call the upgrade endpoint:
   ```bash
   POST /v1/subscription/upgrade
   Authorization: Bearer <your_jwt_token>
   {
     "plan_name": "pro",
     "billing_period": "monthly"
   }
   ```
3. You should get a checkout URL
4. Complete the checkout with test card `4242 4242 4242 4242`
5. Check webhook logs in Stripe Dashboard

### 3. Verify Webhook Processing

Check your backend logs for:
- ✅ Webhook received
- ✅ Signature verified
- ✅ Event processed
- ✅ Subscription updated in database

## Security Notes

⚠️ **IMPORTANT:**
- These are **TEST keys** - safe to use in development
- **Never commit** `.env` file to git
- Add `.env` to `.gitignore`
- Use different keys for production (live mode keys)

## Troubleshooting

### "Stripe module not installed"
```bash
pip install stripe>=7.0.0
```

### "Payment processing is not configured"
- Check `.env` file exists
- Verify `STRIPE_SECRET_KEY` is set
- Restart your server after adding env vars

### Webhook not receiving events
- Check webhook endpoint URL is correct
- Verify webhook secret matches
- Check Stripe Dashboard → Webhooks → Events for delivery status
- Ensure backend is accessible from internet (for production)

### Checkout session not creating
- Verify Stripe secret key is correct
- Check backend logs for Stripe API errors
- Ensure plan exists in database

## Ready to Test!

Once you've:
1. ✅ Added keys to `.env` file
2. ✅ Set up webhook endpoint
3. ✅ Added `STRIPE_WEBHOOK_SECRET` to `.env`

You're ready to test the full payment flow! 🚀

