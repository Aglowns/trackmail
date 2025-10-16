# Deploy Backend to Railway - Step by Step

## 🚀 **Step 1: Create Railway Project**

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Connect your GitHub account** (if not already connected)
5. **Select your `trackmail` repository**
6. **Choose "Deploy Now"**

## 🔧 **Step 2: Configure Environment Variables**

1. **In Railway Dashboard**, click on your project
2. **Go to "Variables" tab**
3. **Add these environment variables**:

```
SUPABASE_URL=https://fvpggfqkmldgwjbanwyr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzY5MjIsImV4cCI6MjA3NTg1MjkyMn0.bqVIUz4t-s6Tc-tmglITDTm1KeY5panOfTKkFzzqTwQ
```

## 📋 **Step 3: Wait for Deployment**

1. **Railway will automatically**:
   - Detect it's a Python project
   - Install dependencies from `requirements.txt`
   - Use `Procfile` to start the app
   - Use `runtime.txt` for Python version

2. **Check deployment logs** for any errors
3. **Wait for "Deployed" status**

## 🎯 **Step 4: Get Your Backend URL**

1. **Once deployed**, Railway will show your app URL
2. **It will look like**: `https://trackmail-backend-production.up.railway.app`
3. **Copy this URL** - you'll need it for the next step

## ✅ **Step 5: Update Gmail Add-on**

1. **Open your `Auth.gs` file** in Apps Script
2. **Find this line**:
   ```javascript
   const BACKEND_API_URL = 'http://localhost:8000/v1';
   ```
3. **Replace with your Railway URL**:
   ```javascript
   const BACKEND_API_URL = 'https://your-backend-url.up.railway.app/v1';
   ```
4. **Save the file**

## 🧪 **Step 6: Test the Connection**

1. **Open Gmail**
2. **Open any email**
3. **Open TrackMail add-on**
4. **Click "Test Parsing"** or **"Track This Application"**
5. **Should work without DNS errors!**

---

## 🆘 **Troubleshooting**

### **If deployment fails:**
- Check Railway logs for error messages
- Ensure all files are committed to GitHub
- Verify environment variables are set correctly

### **If add-on still shows DNS error:**
- Double-check the BACKEND_API_URL in Auth.gs
- Make sure you're using `https://` (not `http://`)
- Ensure the URL ends with `/v1`

### **Need help?**
- Check Railway deployment logs
- Test backend URL in browser: `https://your-url.up.railway.app/health`
