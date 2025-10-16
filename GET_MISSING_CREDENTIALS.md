# 🔑 Get Missing Supabase Credentials

## What We Need

We have these credentials already:
- ✅ **SUPABASE_URL**: `https://fvpggfqkmldgwjbanwyr.supabase.co`
- ✅ **SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzY5MjIsImV4cCI6MjA3NTg1MjkyMn0.bqVIUz4t-s6Tc-tmglITDTm1KeY5panOfTKkFzzqTwQ`

We need to get these:
- ❌ **SUPABASE_SERVICE_ROLE_KEY** (currently has placeholder: `YourServiceRoleKey`)
- ❌ **DATABASE_PASSWORD** (currently has placeholder: `your-password`)

## Step 1: Get Service Role Key

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**: `fvpggfqkmldgwjbanwyr`
3. **Go to Settings** → **API**
4. **Find "Project API keys" section**
5. **Copy the `service_role` key** (it's the secret key, starts with `eyJ...`)

## Step 2: Get Database Password

1. **Still in Supabase Dashboard**
2. **Go to Settings** → **Database**
3. **Scroll down to "Connection string"**
4. **Select "URI" tab**
5. **Copy the connection string** (it will look like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.fvpggfqkmldgwjbanwyr.supabase.co:5432/postgres
   ```
6. **Replace `[YOUR-PASSWORD]` with the actual password** you set when creating the project

## Step 3: Update Railway Variables

Once you have both values, run these commands:

```powershell
# Update service role key (replace with your actual key)
railway variables --set "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI3NjkyMiwiZXhwIjoyMDc1ODUyOTIyfQ.YOUR_ACTUAL_SERVICE_ROLE_KEY"

# Update database URL (replace YOUR_PASSWORD with actual password)
railway variables --set "DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.fvpggfqkmldgwjbanwyr.supabase.co:5432/postgres"
```

## Step 4: Test the Fix

After updating the variables:

```powershell
# Check variables are set
railway variables

# Redeploy with new variables
railway up

# Test the health endpoint
curl https://trackmail-production.up.railway.app/health
```

## Expected Results

After fixing the credentials, you should see:
- ✅ Health endpoint returns `{"status": "healthy"}`
- ✅ No more 502 errors
- ✅ Main TrackMail app loads successfully
- ✅ Database migrations can run

## If You Don't Remember Your Database Password

If you forgot your database password:
1. **Go to Supabase Dashboard** → **Settings** → **Database**
2. **Click "Reset database password"**
3. **Set a new password**
4. **Update the DATABASE_URL with the new password**

---

**Once you get these credentials, paste them here and I'll help you update the Railway variables!** 🚀
