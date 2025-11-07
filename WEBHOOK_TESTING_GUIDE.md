# Webhook Testing Guide

## ✅ What We Know

1. **Server Started Successfully** ✅
   - Server was running on port 8000
   - Health check worked: `{"status": "ok"}`
   - Server then shut down (you stopped it)

2. **Webhook Trigger Succeeded** ✅
   - `stripe trigger checkout.session.completed` worked
   - Stripe created test fixtures
   - Event was sent

## ⚠️ Issue

The server was **stopped** when you ran the webhook trigger, so the webhook couldn't be processed by your backend.

## 🔧 Solution: Test with Server Running

### Step 1: Start Server (Keep It Running!)

In a PowerShell window, run:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**IMPORTANT:** Keep this window open and the server running!

### Step 2: Trigger Webhook (While Server is Running)

In a **DIFFERENT PowerShell window**, run:

```powershell
stripe trigger checkout.session.completed
```

### Step 3: Check Server Logs

In the **server window**, you should now see:

```
Processing Stripe webhook event: checkout.session.completed
Successfully processed Stripe webhook: checkout.session.completed
```

### Step 4: Check `stripe listen` Window

In the **`stripe listen` window**, you should see:
- Event received
- Event forwarded to backend
- Response status 200

## ✅ Success Indicators

You'll know it's working when you see:

1. **Server logs show:**
   - "Processing Stripe webhook event"
   - "Successfully processed Stripe webhook"

2. **`stripe listen` window shows:**
   - Event forwarded
   - Response 200 OK

3. **No errors** in any of the windows

## 🎯 Current Status

- ✅ Server can start successfully
- ✅ Health endpoint works
- ✅ Webhook trigger works
- ⏳ **Need to test with server running** to verify webhook processing

## 🚀 Next Steps

1. Start server (keep it running)
2. Trigger webhook in separate window
3. Check server logs for webhook processing
4. If successful, test full payment flow!

