# Step 3: Webhook Forwarding - Instructions

## ✅ Webhook Forwarding Started

A new PowerShell window should have opened automatically.

## 📋 What You Should See

In the **new PowerShell window**, look for this line:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

## ⚠️ Important Actions

1. **Find the webhook secret** - Look for `whsec_...` in that window
2. **Copy it** - You'll need it for the next step
3. **Keep the window open** - Don't close it, it needs to keep running

## 🔧 If Window Didn't Open

Manually open a new PowerShell window and run:

```powershell
stripe listen --forward-to localhost:8000/v1/subscription/webhook
```

## 📝 Next: Add Webhook Secret to .env

Once you have the `whsec_...` value:

1. Open `.env` file in your project root
2. Add this line (or update if it exists):
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```
3. Replace `whsec_xxxxxxxxxxxxx` with the actual value from the window

## ✅ After Adding Secret

1. Restart your backend server
2. Webhook integration will be complete!

## 🧪 Quick Test

After setup, you can test with:

```powershell
stripe trigger checkout.session.completed
```

Check both:
- The `stripe listen` window (should show event)
- Your backend logs (should show webhook processed)

---

**Look for the new PowerShell window and copy the webhook secret!**

