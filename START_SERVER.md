# How to Start Your Backend Server

## Quick Start Command

Run this in PowerShell:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## What You'll See

When the server starts successfully, you'll see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
🚀 JobMail API starting in development mode
📝 Docs available at /docs
INFO:     Application startup complete.
```

## Verify It's Running

### Option 1: Check Health Endpoint

Open in browser:
```
http://localhost:8000/health
```

Or in PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
```

### Option 2: Open Swagger UI

Open in browser:
```
http://localhost:8000/docs
```

You should see the interactive API documentation.

## ⚠️ Important

- **Keep this terminal open** - Don't close it while testing
- **Press Ctrl+C** to stop the server when done
- **Auto-reload enabled** - Server restarts on code changes

## 🧪 After Server Starts

Once the server is running:

1. **Test webhook** - Run `stripe trigger checkout.session.completed` again
2. **Check server logs** - You should see webhook processing
3. **Test checkout** - Create a checkout session via Swagger UI

## 🚀 Ready to Start?

Run the command above in PowerShell to start your server!

