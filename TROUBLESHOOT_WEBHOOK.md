# Troubleshooting Webhook Not Reaching Backend

## 🔍 Issue

Webhook trigger succeeds, but backend doesn't receive it.

## ✅ Checklist

### 1. Is `stripe listen` Still Running?

**Check:** Look for the PowerShell window running `stripe listen`

**Should show:**
```
> Ready! Your webhook signing secret is whsec_...
```

**If not running:**
- Open a new PowerShell window
- Run: `stripe listen --forward-to localhost:8000/v1/subscription/webhook`
- Keep it open!

### 2. Is Server Running?

**Check:** Look for the terminal with `uvicorn` running

**Should show:**
```
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: Application startup complete.
```

### 3. Check Webhook Endpoint Path

The endpoint should be: `/v1/subscription/webhook`

**Verify in code:** The router is at `/subscription` and webhook is at `/webhook`
**Full path:** `/v1/subscription/webhook`

### 4. Test Webhook Endpoint Directly

Try accessing the endpoint manually:

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/v1/subscription/webhook" -Method POST -ContentType "application/json" -Body '{"test": "data"}'
```

This should return an error about missing signature, but confirms the endpoint exists.

## 🔧 Common Issues

### Issue 1: `stripe listen` Not Running

**Solution:** Start it in a new PowerShell window:
```powershell
stripe listen --forward-to localhost:8000/v1/subscription/webhook
```

### Issue 2: Wrong Endpoint URL

**Check:** Make sure `stripe listen` is forwarding to:
```
localhost:8000/v1/subscription/webhook
```

Not just `localhost:8000` or `localhost:8000/webhook`

### Issue 3: Server Not Receiving Requests

**Check:** Look at server logs when you trigger webhook
- Should see ANY request (even if it fails)
- If no request at all, `stripe listen` isn't forwarding

### Issue 4: Port Conflict

**Check:** Make sure nothing else is using port 8000
```powershell
Test-NetConnection -ComputerName localhost -Port 8000
```

## 🧪 Step-by-Step Debug

1. **Verify `stripe listen` is running:**
   - Look for the window
   - Should show "Ready!" message

2. **Verify server is running:**
   - Look for uvicorn terminal
   - Should show "Application startup complete"

3. **Trigger webhook again:**
   ```powershell
   stripe trigger checkout.session.completed
   ```

4. **Check `stripe listen` window:**
   - Should show: `--> checkout.session.completed`
   - Should show: `<-- [200]` or error

5. **Check server terminal:**
   - Should show POST request
   - Should show processing messages

## 🎯 Quick Fix

Most likely issue: `stripe listen` is not running or stopped.

**Solution:**
1. Open a new PowerShell window
2. Run: `stripe listen --forward-to localhost:8000/v1/subscription/webhook`
3. Keep it open
4. Trigger webhook again
5. Check both windows

