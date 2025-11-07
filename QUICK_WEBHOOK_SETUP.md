# Quick Webhook Setup Guide

## 🚀 Fastest Way to Get Started (Local Development)

### Step 1: Install Stripe CLI

**Windows (using Scoop):**
```powershell
scoop install stripe
```

**Or download directly:**
- Go to: https://stripe.com/docs/stripe-cli
- Download for Windows
- Extract and add to PATH

### Step 2: Login to Stripe

```bash
stripe login
```

This will open your browser to authenticate with Stripe.

### Step 3: Forward Webhooks to Local Server

In a **separate terminal window**, run:

```bash
stripe listen --forward-to localhost:8000/v1/subscription/webhook
```

**Important:** Keep this terminal open! You'll see output like:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### Step 4: Copy the Webhook Secret

Copy the `whsec_...` value and add it to your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 5: Restart Your Server

After adding the webhook secret, restart your FastAPI server.

## 🧪 Test It Works

### Test 1: Trigger a Test Webhook

In another terminal, while `stripe listen` is running:

```bash
stripe trigger checkout.session.completed
```

You should see:
- ✅ Event received in `stripe listen` terminal
- ✅ Event forwarded to your backend
- ✅ Logs in your backend showing webhook processed

### Test 2: Create a Real Checkout Session

1. Use Swagger UI: `POST /v1/subscription/upgrade`
2. Get the checkout URL
3. Complete payment with test card: `4242 4242 4242 4242`
4. Check `stripe listen` terminal - you should see webhook events

## 📝 Production Setup (Later)

When ready for production:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. URL: `https://your-backend.onrender.com/v1/subscription/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the signing secret
6. Add to Render environment variables

## ✅ Verification Checklist

- [ ] Stripe CLI installed
- [ ] `stripe login` completed
- [ ] `stripe listen` running in separate terminal
- [ ] Webhook secret copied to `.env` file
- [ ] Server restarted after adding webhook secret
- [ ] Test webhook event received successfully

## 🎯 You're Ready!

Once webhook is set up, you can:
- ✅ Test checkout session creation
- ✅ Complete test payments
- ✅ See webhooks update subscriptions automatically

