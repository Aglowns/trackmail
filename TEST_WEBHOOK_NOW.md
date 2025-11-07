# Test Webhook Now! 🚀

## ✅ `stripe listen` is Running

The background job is active and forwarding webhooks to your server.

## 🧪 Test the Webhook

In this same terminal, run:

```powershell
stripe trigger checkout.session.completed
```

## 🔍 Check Results

### 1. Check Background Job Output

See what `stripe listen` received:

```powershell
Receive-Job -Name "StripeListen"
```

You should see:
```
--> checkout.session.completed [evt_xxxxx]
<--  [200] POST http://localhost:8000/v1/subscription/webhook [evt_xxxxx]
```

### 2. Check Server Logs

Look at your **server terminal** (where `uvicorn` is running). You should see:

```
INFO:     127.0.0.1:xxxxx - "POST /v1/subscription/webhook HTTP/1.1" 200 OK
Processing Stripe webhook event: checkout.session.completed
Successfully processed Stripe webhook: checkout.session.completed
```

## ✅ Success Indicators

- ✅ `stripe listen` shows event forwarded
- ✅ Server shows POST request
- ✅ Server shows "Processing Stripe webhook event"
- ✅ Server shows "Successfully processed"

## 🎯 Quick Commands

**Check job status:**
```powershell
Get-Job -Name "StripeListen"
```

**See job output:**
```powershell
Receive-Job -Name "StripeListen"
```

**Stop job (when done):**
```powershell
Stop-Job -Name "StripeListen"
Remove-Job -Name "StripeListen"
```

## 🚀 Ready to Test!

Run `stripe trigger checkout.session.completed` and check both:
1. Server logs
2. Background job output

**Let me know what you see!**
