# Fix: Webhook Not Reaching Backend

## 🔍 Problem

Webhook trigger succeeds, but backend doesn't receive it.

## ✅ What We Know

- ✅ Server is running (uvicorn on port 8000)
- ✅ Webhook secret is configured
- ✅ Endpoint exists: `/v1/subscription/webhook`
- ❌ **`stripe listen` is probably not running or stopped**

## 🔧 Solution

### Step 1: Check if `stripe listen` is Running

Look for the PowerShell window that was running `stripe listen`.

**It should show:**
```
> Ready! Your webhook signing secret is whsec_...
```

**If you don't see this window, or it's closed, that's the problem!**

### Step 2: Start `stripe listen` Again

Open a **NEW PowerShell window** and run:

```powershell
stripe listen --forward-to localhost:8000/v1/subscription/webhook
```

**IMPORTANT:**
- Keep this window **OPEN**
- Don't close it
- You should see: `> Ready! Your webhook signing secret is whsec_...`

### Step 3: Verify All Three Windows Are Open

You should have **3 PowerShell windows**:

1. **Window 1:** Server running (`uvicorn app.main:app --reload`)
2. **Window 2:** `stripe listen` running (`stripe listen --forward-to...`)
3. **Window 3:** For running commands (like `stripe trigger`)

### Step 4: Test Again

In Window 3 (or any window), run:

```powershell
stripe trigger checkout.session.completed
```

### Step 5: Check All Windows

**Window 1 (Server):** Should show:
```
INFO:     127.0.0.1:xxxxx - "POST /v1/subscription/webhook HTTP/1.1" 200 OK
Processing Stripe webhook event: checkout.session.completed
Successfully processed Stripe webhook: checkout.session.completed
```

**Window 2 (`stripe listen`):** Should show:
```
--> checkout.session.completed [evt_xxxxx]
<--  [200] POST http://localhost:8000/v1/subscription/webhook [evt_xxxxx]
```

**Window 3 (Trigger):** Should show:
```
Trigger succeeded! Check dashboard for event details.
```

## 🎯 Most Likely Issue

**`stripe listen` is not running!**

This is the "bridge" between Stripe and your backend. Without it, webhooks can't reach your server.

## ✅ Quick Fix

1. Open new PowerShell window
2. Run: `stripe listen --forward-to localhost:8000/v1/subscription/webhook`
3. Keep it open
4. Trigger webhook again
5. Check server logs

## 🚀 After Fix

Once `stripe listen` is running and you trigger the webhook, you should see:
- ✅ Event in `stripe listen` window
- ✅ POST request in server logs
- ✅ "Processing Stripe webhook event" message
- ✅ "Successfully processed" message

**Try starting `stripe listen` again and let me know what you see!**

