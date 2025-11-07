# Fix: Connection Refused Error

## 🔍 Problem

The error shows:
```
Failed to POST: Post "http://localhost:8000/v1/subscription/webhook": 
dial tcp [::1]:8000: connectex: No connection could be made because 
the target machine actively refused it.
```

This means **your server is not running or not accessible on port 8000**.

## ✅ Solution: Start Your Server

### Step 1: Check if Server is Running

Look for the terminal where you started `uvicorn`. Is it still running?

**If the server stopped:**
- The terminal might have closed
- The server might have crashed
- You might have stopped it

### Step 2: Start the Server Again

In a PowerShell window, run:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

### Step 3: Keep Server Running

**IMPORTANT:** Keep this terminal open and the server running!

### Step 4: Test Again

Once the server is running, trigger the webhook again:

```powershell
stripe trigger checkout.session.completed
```

## 🔍 Verify Server is Running

### Option 1: Check Health Endpoint

Open in browser:
```
http://localhost:8000/health
```

Should show: `{"status": "ok"}`

### Option 2: Check Swagger UI

Open in browser:
```
http://localhost:8000/docs
```

Should show the API documentation.

## 📋 Current Status

- ✅ `stripe listen` is running (receiving events)
- ❌ **Server is NOT running** (connection refused)
- ⏳ **Need to start server**

## 🎯 Quick Fix

1. **Start server:**
   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Keep it running** (don't close the terminal)

3. **Trigger webhook again:**
   ```powershell
   stripe trigger checkout.session.completed
   ```

4. **Check both windows:**
   - `stripe listen` window: Should show `[200]` instead of error
   - Server window: Should show webhook processing

## 🚀 After Server Starts

Once the server is running, the webhook should work:
- ✅ Events will be forwarded
- ✅ Server will receive them
- ✅ Webhooks will be processed

**Start your server now and try again!**

