# Running `stripe listen` in Background

## ✅ Started as Background Job

I've started `stripe listen` as a background job in PowerShell.

## 📊 Check Status

To check if it's running:

```powershell
Get-Job -Name "StripeListen"
```

To see the output:

```powershell
Receive-Job -Name "StripeListen"
```

## 🧪 Test Webhook Now

Now you can test the webhook in this same terminal:

```powershell
stripe trigger checkout.session.completed
```

## 🔍 Check Results

### 1. Check Background Job Output

```powershell
Receive-Job -Name "StripeListen"
```

You should see webhook events being forwarded.

### 2. Check Server Logs

Look at your server terminal - you should now see:
```
INFO:     127.0.0.1:xxxxx - "POST /v1/subscription/webhook HTTP/1.1" 200 OK
Processing Stripe webhook event: checkout.session.completed
```

## 🛑 Stop Background Job (When Done)

```powershell
Stop-Job -Name "StripeListen"
Remove-Job -Name "StripeListen"
```

## 🎯 Alternative: Run in New Window

If you prefer to see the output in real-time, you can still open a new PowerShell window and run:

```powershell
stripe listen --forward-to localhost:8000/v1/subscription/webhook
```

This way you can see the webhook events as they happen.

## ✅ Current Setup

- ✅ Server running (in one terminal)
- ✅ `stripe listen` running (as background job)
- ✅ Ready to test webhooks!

**Try triggering a webhook now and check the server logs!**

