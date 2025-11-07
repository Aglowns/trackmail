# Stripe Webhook Setup - Windows PowerShell Guide

## Step-by-Step PowerShell Commands

### Step 1: Check if Stripe CLI is Installed

```powershell
stripe --version
```

If it shows a version number, you're good! If not, install it:

### Install Stripe CLI (if needed)

**Option A: Using Scoop (Recommended)**
```powershell
scoop install stripe
```

**Option B: Manual Installation**
1. Download from: https://github.com/stripe/stripe-cli/releases/latest
2. Download `stripe_*_windows_x86_64.zip`
3. Extract to a folder (e.g., `C:\stripe-cli`)
4. Add to PATH or use full path

### Step 2: Login to Stripe

```powershell
stripe login
```

This will:
- Open your browser
- Ask you to authenticate with Stripe
- Save your credentials locally

**Expected output:**
```
Done! The Stripe CLI is configured for your account.
```

### Step 3: Start Forwarding Webhooks

**IMPORTANT:** Open a **NEW PowerShell window** for this (keep it open):

```powershell
stripe listen --forward-to localhost:8000/v1/subscription/webhook
```

**Expected output:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

**Keep this PowerShell window open!** This is forwarding webhooks to your backend.

### Step 4: Copy the Webhook Secret

From the `stripe listen` output, copy the `whsec_...` value.

Then add it to your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

You can edit the `.env` file manually or use PowerShell:

```powershell
# Read current .env
$envContent = Get-Content .env -Raw

# Add or update STRIPE_WEBHOOK_SECRET
$newSecret = "whsec_xxxxxxxxxxxxx"  # Replace with your actual secret
if ($envContent -match "STRIPE_WEBHOOK_SECRET=") {
    $envContent = $envContent -replace "STRIPE_WEBHOOK_SECRET=.*", "STRIPE_WEBHOOK_SECRET=$newSecret"
} else {
    $envContent += "`nSTRIPE_WEBHOOK_SECRET=$newSecret"
}

# Write back
Set-Content .env -Value $envContent
```

### Step 5: Verify Configuration

Check that the webhook secret is set:

```powershell
python -c "from app.config import settings; print('Webhook Secret:', 'CONFIGURED' if settings.stripe_webhook_secret and settings.stripe_webhook_secret != 'whsec_...' else 'NOT CONFIGURED')"
```

### Step 6: Restart Your Server

After adding the webhook secret, restart your FastAPI server:

```powershell
# Stop your current server (Ctrl+C if running)
# Then start it again
uvicorn app.main:app --reload
```

## Testing

### Test 1: Trigger a Test Webhook

While `stripe listen` is running in one terminal, open **another PowerShell window** and run:

```powershell
stripe trigger checkout.session.completed
```

**Check both terminals:**
- ✅ `stripe listen` terminal should show event received
- ✅ Your backend server logs should show webhook processed

### Test 2: Test Full Payment Flow

1. **Start your backend server** (if not running):
   ```powershell
   uvicorn app.main:app --reload
   ```

2. **Open Swagger UI**: http://localhost:8000/docs

3. **Create checkout session**:
   - `POST /v1/subscription/upgrade`
   - Authorization: Bearer <your_jwt_token>
   - Body: `{"plan_name": "pro", "billing_period": "monthly"}`

4. **Complete payment**:
   - Open the `checkout_url` from response
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry (e.g., 12/25)
   - Any CVC (e.g., 123)

5. **Check webhook**:
   - `stripe listen` terminal should show events
   - Backend logs should show subscription created

## Troubleshooting

### "stripe: command not found"
- Stripe CLI not installed or not in PATH
- Install using: `scoop install stripe`
- Or use full path to stripe.exe

### "Failed to forward webhook"
- Make sure your backend server is running on port 8000
- Check: http://localhost:8000/health

### "Webhook signature verification failed"
- Verify `STRIPE_WEBHOOK_SECRET` matches the one from `stripe listen`
- Make sure you restarted the server after adding the secret

### "Connection refused"
- Backend server not running
- Start with: `uvicorn app.main:app --reload`

## Quick Reference

**Terminal 1 (Backend Server):**
```powershell
uvicorn app.main:app --reload
```

**Terminal 2 (Webhook Forwarding):**
```powershell
stripe listen --forward-to localhost:8000/v1/subscription/webhook
```

**Terminal 3 (Testing):**
```powershell
stripe trigger checkout.session.completed
```

## Next Steps

Once webhook is working:
1. ✅ Test checkout session creation
2. ✅ Test payment completion
3. ✅ Verify subscription updates in database
4. ✅ Ready for production!

