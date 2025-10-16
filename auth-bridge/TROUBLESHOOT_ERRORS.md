# 🐛 Troubleshooting Internal Server Error

## What We Know
- ✅ Railway deployment shows "successful"
- ❌ Website shows "Internal Server Error"
- 🔍 Need to check logs for the actual error

## Step 1: Check Railway Logs

### In Railway Dashboard:
1. Go to: https://railway.app/dashboard
2. Click your **"trackmail"** project
3. Click the **auth-bridge service**
4. Click the **"Deployments"** tab
5. Click on the **"ACTIVE"** deployment (the green one)
6. Click **"View logs"** button
7. Look for error messages (usually in red)

### Common Errors to Look For:

#### 1. **Missing Dependencies**
```
ModuleNotFoundError: No module named 'fastapi'
```
**Solution**: Add `requirements.txt` to deployment

#### 2. **Environment Variables Missing**
```
SUPABASE_URL not found
```
**Solution**: Verify variables are set in Variables tab

#### 3. **Port Configuration**
```
Port 8001 not available
```
**Solution**: Railway expects port from PORT environment variable

#### 4. **Python Version Issues**
```
Python 3.x not found
```
**Solution**: Add runtime.txt file

## Step 2: Quick Fixes to Try

### Fix 1: Add Missing Files

Create these files in your `auth-bridge` directory:

**runtime.txt**:
```
python-3.11.0
```

**Procfile** (alternative to Dockerfile):
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Fix 2: Update main.py for Railway

Railway uses a different port system. Update your `main.py`:

```python
# At the bottom of main.py, change this:
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))  # Railway uses PORT env var
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### Fix 3: Verify Environment Variables

In Railway Dashboard:
1. Go to **Variables** tab
2. Verify these are set:
   - `SUPABASE_URL=https://fvpggfqkmldgwjbanwyr.supabase.co`
   - `SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `PORT=8001` (optional, Railway sets this automatically)

## Step 3: Redeploy

After making changes:

### Option A: Using Railway CLI
```powershell
cd C:\Users\aglon\Desktop\CURSOR\trackmail\auth-bridge
railway up --detach
```

### Option B: Using Railway Dashboard
1. Go to **Deployments** tab
2. Click **"Deploy"** button
3. Wait for new deployment

## Step 4: Check Logs Again

After redeploying:
1. Click on the new deployment
2. Click **"View logs"**
3. Look for:
   - ✅ "Application startup complete"
   - ✅ "Uvicorn running on http://0.0.0.0:8001"
   - ❌ Any error messages

## Common Railway-Specific Issues

### Issue 1: Port Configuration
Railway automatically sets the `PORT` environment variable. Your app needs to use it:

```python
import os
port = int(os.getenv("PORT", 8001))
```

### Issue 2: Missing Dependencies
Make sure `requirements.txt` includes all dependencies:

```
fastapi==0.115.0
uvicorn[standard]==0.31.0
supabase==2.9.0
python-multipart==0.0.12
jinja2==3.1.4
python-dotenv==1.0.1
pydantic==2.9.2
pydantic-settings==2.5.2
```

### Issue 3: File Structure
Railway expects this structure:
```
auth-bridge/
├── main.py
├── requirements.txt
├── templates/
│   └── signin.html
└── (optional: runtime.txt, Procfile)
```

## Quick Debug Commands

### Check if files exist:
```powershell
cd C:\Users\aglon\Desktop\CURSOR\trackmail\auth-bridge
dir
```

### Test locally first:
```powershell
pip install -r requirements.txt
python main.py
```

## Alternative: Use Procfile Instead of Dockerfile

Railway sometimes works better with Procfile:

**Create Procfile**:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Remove Dockerfile** (temporarily):
```powershell
cd C:\Users\aglon\Desktop\CURSOR\trackmail\auth-bridge
del Dockerfile
```

Then redeploy.

## Still Having Issues?

### Check These:
1. ✅ All files uploaded correctly
2. ✅ Environment variables set
3. ✅ No syntax errors in Python code
4. ✅ Dependencies in requirements.txt
5. ✅ Port configuration correct

### Share the Logs:
Copy and paste the error logs from Railway dashboard here, and I'll help debug further.

---

## Expected Working Logs

When everything works, you should see logs like:
```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

---

**Next Step**: Check the Railway logs and let me know what error you see! 🔍
