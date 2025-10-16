# 🔧 Set Environment Variables in Railway Dashboard

Your auth-bridge service is **deploying right now**! ✅

However, we need to add the environment variables through the Railway Dashboard.

## Quick Steps (2 minutes)

### 1. Open Railway Dashboard

Go to: **https://railway.app/dashboard**

Or click this build log link from the deployment:
https://railway.com/project/7001f837-b886-4e3d-89a7-d93c6f812e44/service/a865b17b-31f6-412a-8e35-5524661eaf39

### 2. Navigate to Your Service

1. You should see your **"trackmail"** project
2. Click on it
3. You'll see a service (might be called "auth-bridge" or have a generated name)
4. Click on that service

### 3. Add Variables

1. Click the **"Variables"** tab
2. Click **"+ New Variable"** or **"Add Variable"**
3. Add these two variables:

   **Variable 1:**
   - Name: `SUPABASE_URL`
   - Value: `https://fvpggfqkmldgwjbanwyr.supabase.co`

   **Variable 2:**
   - Name: `SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzY5MjIsImV4cCI6MjA3NTg1MjkyMn0.bqVIUz4t-s6Tc-tmglITDTm1KeY5panOfTKkFzzqTwQ`

4. After adding both variables, Railway will **automatically redeploy** your service with the new variables

### 4. Get Your Deployment URL

1. Still in your service dashboard
2. Click the **"Settings"** tab
3. Scroll to **"Domains"** section
4. Click **"Generate Domain"**
5. Copy the generated URL (will look like: `https://auth-bridge-production-xxxx.up.railway.app`)

### 5. Verify Deployment

Once the redeploy completes (watch the "Deployments" tab):

1. Click on your domain URL
2. You should see the **TrackMail sign-in page** 🎉
3. The page should load properly with the sign-in form

## Troubleshooting

### Build is failing?
- Check the "Deployments" tab
- Click on the failed deployment
- Check build logs for errors

### Can't find the Variables tab?
- Make sure you clicked on the service (not just the project)
- The service card should expand showing multiple tabs

### Variables not showing after setting them?
- Refresh the page
- Check the "Deployments" tab to see if a new deployment started

## Next Steps

Once you have your deployment URL:

1. ✅ Save it (you'll need it for Gmail Add-on)
2. ✅ Test it by opening in browser
3. ✅ Move to Step 2: Create Gmail Add-on

---

## Alternative: Using Railway CLI (If you prefer)

If the dashboard method doesn't work, you can try these CLI commands:

```powershell
# Make sure you're in auth-bridge directory
cd C:\Users\aglon\Desktop\CURSOR\trackmail\auth-bridge

# List services and select yours
railway service

# Then set variables
railway variables --set SUPABASE_URL=https://fvpggfqkmldgwjbanwyr.supabase.co
railway variables --set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzY5MjIsImV4cCI6MjA3NTg1MjkyMn0.bqVIUz4t-s6Tc-tmglITDTm1KeY5panOfTKkFzzqTwQ

# Check variables
railway variables

# Trigger a new deployment
railway up --detach
```

---

**Let me know once you've set the variables and have your deployment URL!** 🚀

Then we'll move to **Step 2: Create the Gmail Add-on**.

