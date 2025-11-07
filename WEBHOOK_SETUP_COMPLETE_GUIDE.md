# Complete Webhook Setup - PowerShell Commands

## Step 1: Install Stripe CLI

**If you have Scoop:**
```powershell
scoop install stripe
```

**If not, install manually:**
1. Download from: https://github.com/stripe/stripe-cli/releases/latest
2. Download `stripe_X.X.X_windows_x86_64.zip`
3. Extract to `C:\stripe-cli`
4. Add to PATH:
   ```powershell
   $env:Path += ";C:\stripe-cli"
   ```
5. Verify:
   ```powershell
   stripe --version
   ```

## Step 2: Login to Stripe

```powershell
stripe login
```

This opens your browser to authenticate. Click "Allow access".

## Step 3: Start Webhook Forwarding

**Open a NEW PowerShell window** (keep it open):

```powershell
stripe listen --forward-to localhost:8000/v1/subscription/webhook
```

**You'll see:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

**Copy the `whsec_...` value!**

## Step 4: Add Webhook Secret to .env

Edit your `.env` file and add/update:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

(Replace `whsec_xxxxxxxxxxxxx` with the actual value from Step 3)

## Step 5: Restart Your Server

After adding the webhook secret, restart your FastAPI server:

```powershell
# Stop current server (Ctrl+C)
# Then restart:
uvicorn app.main:app --reload
```

## Step 6: Test It!

### Test 1: Trigger Test Webhook

In a **third PowerShell window**, while `stripe listen` is running:

```powershell
stripe trigger checkout.session.completed
```

**Check:**
- ✅ `stripe listen` window shows event received
- ✅ Your backend logs show webhook processed

### Test 2: Full Payment Test

1. Open Swagger UI: http://localhost:8000/docs
2. Call `POST /v1/subscription/upgrade`
3. Copy the `checkout_url` from response
4. Open it in browser
5. Use test card: `4242 4242 4242 4242`
6. Complete payment
7. Check `stripe listen` window for webhook events

## ✅ You're Done!

Once webhook is working:
- ✅ Checkout sessions work
- ✅ Payments process
- ✅ Webhooks update subscriptions automatically

**Your Stripe integration is complete!** 🚀

