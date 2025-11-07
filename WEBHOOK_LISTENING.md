# Webhook Forwarding Started

## ✅ What Just Happened

A new PowerShell window should have opened with `stripe listen` running.

## 📋 What to Look For

In the **new PowerShell window** that opened, you should see:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

## ⚠️ Important

- **Keep that PowerShell window OPEN** - Don't close it!
- **Copy the `whsec_...` value** - You'll need it for the next step
- The window will show webhook events as they come in

## 🔍 If the Window Didn't Open

You can manually start it in a new PowerShell window:

```powershell
stripe listen --forward-to localhost:8000/v1/subscription/webhook
```

## 📝 Next Step: Add Webhook Secret to .env

Once you have the `whsec_...` value:

1. Open your `.env` file
2. Add or update this line:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```
   (Replace with your actual secret)

3. Restart your backend server

## ✅ Verification

After adding the secret and restarting, you can test:

```powershell
stripe trigger checkout.session.completed
```

You should see the event in:
- The `stripe listen` window
- Your backend server logs

## 🎯 Status

- ✅ Stripe CLI installed
- ✅ Logged in to Stripe
- ✅ Webhook forwarding started (check the new window)
- ⏳ Waiting for webhook secret to add to .env

