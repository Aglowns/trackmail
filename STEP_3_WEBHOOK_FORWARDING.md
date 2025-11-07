# Step 3: Start Webhook Forwarding

## ⚠️ Important: Use a NEW PowerShell Window

You need to open a **separate PowerShell window** for webhook forwarding because it needs to keep running.

## Command to Run

In your **NEW PowerShell window**, run:

```powershell
stripe listen --forward-to localhost:8000/v1/subscription/webhook
```

## What You'll See

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

## What to Do

1. **Copy the `whsec_...` value** - This is your webhook signing secret
2. **Keep this terminal open** - Don't close it, it needs to keep running
3. **Add to .env file** - Add this line:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```
   (Replace `whsec_xxxxxxxxxxxxx` with the actual value)

## After Adding Webhook Secret

1. Restart your backend server
2. The webhook integration will be complete!

## Testing

Once webhook forwarding is running, you can test it:

**In another terminal:**
```powershell
stripe trigger checkout.session.completed
```

You should see the event in both:
- The `stripe listen` terminal
- Your backend server logs

## Ready?

Open a new PowerShell window and run the command above!

