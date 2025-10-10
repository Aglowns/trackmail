# ⚡ QuickStart — Production Deployment

**Get JobMail running in production in under 15 minutes**

---

## Prerequisites (5 minutes)

1. **Create Accounts:**
   - [Vercel](https://vercel.com/signup) - Free tier
   - [Neon](https://neon.tech) - Free tier
   - Google account (for Apps Script)

2. **Local Setup:**
   - Node.js 18+ installed
   - Git installed
   - Code pushed to GitHub

---

## Step 1: Neon Database (2 minutes)

1. **Create Project:**
   ```
   Visit: https://console.neon.tech
   Click "New Project"
   Name: jobmail-production
   Region: us-east-2 (or closest to you)
   ```

2. **Copy Connection String:**
   ```
   Dashboard → Connection Details
   Copy "Pooled connection"
   Should look like: postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

3. **Save it** — you'll need this in Step 2

---

## Step 2: Deploy Everything (5 minutes)

Run our automated deployment script:

```powershell
# Windows PowerShell
cd C:\Users\aglon\Desktop\CURSOR\Trackmail

.\scripts\quick-deploy.ps1 `
  -NeonDatabaseUrl "postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require"
```

This will:
- ✅ Generate API keys
- ✅ Install dependencies
- ✅ Run tests
- ✅ Deploy to Vercel
- ✅ Set environment variables
- ✅ Run database migrations
- ✅ Verify deployment

**Expected output:**
```
========================================
  ✓ Deployment Complete!
========================================

Production URL: https://jobmail-abc123.vercel.app

Credentials (SAVE THESE!):
  JOBMAIL_API_KEY=AV16iK6nMLWuK6CWYPi5YjXTAL3fjUexS+V2vx1CR/k=
  NEXTAUTH_SECRET=KO5wGs+F4fWz20/ajfmQvaVmyUueYLEJmsovuDmHDYA=
```

**⚠️ SAVE THE API KEY!** You need it for Step 3.

---

## Step 3: Gmail Add-on (5 minutes)

### 3.1 Enable Apps Script API

```
Visit: https://script.google.com/home/usersettings
Toggle ON: "Google Apps Script API"
```

### 3.2 Deploy Add-on

```powershell
cd apps-script

# Login to Google
npx clasp login

# Create project
npx clasp create --title "JobMail Gmail Add-on" --type standalone

# Build and push
npm run build
npx clasp push
```

### 3.3 Configure

```powershell
# Open Apps Script editor
npx clasp open
```

In the editor:
1. **Project Settings** → **Script Properties**
2. Add these properties:

   | Property | Value |
   |----------|-------|
   | `VERCEL_API_URL` | `https://jobmail-abc123.vercel.app` (from Step 2) |
   | `JOBMAIL_API_KEY` | `AV16iK6n...` (from Step 2) |
   | `DASHBOARD_URL` | `https://jobmail-abc123.vercel.app` |

3. **Deploy** → **Test deployments** → **Install**
4. Grant permissions when prompted

### 3.4 Setup Triggers

In Apps Script editor:
1. Select `setupTriggers` from function dropdown
2. Click **Run** ▶️
3. Grant permissions

---

## Step 4: Test (3 minutes)

### Test API

```powershell
curl https://jobmail-abc123.vercel.app/api/health
```

**Expected:** `"status": "ok", "database": "connected"`

### Test Gmail Add-on

1. **Open Gmail:** https://mail.google.com
2. **Open any email**
3. **Check right sidebar** — add-on icon should appear
4. **Click add-on** → Should see "JobMail Settings"

### Test Job Email

1. **Find a job application email** (or send yourself one)
2. **Open it in Gmail**
3. **Add-on should show:**
   - ✅ Parsed company name
   - ✅ Parsed job title
   - ✅ "Save to Tracker" button
4. **Click "Save to Tracker"**
5. **Verify in dashboard:** Visit your Vercel URL

---

## ✅ You're Live!

Your production stack is now running:

- ✅ **API:** `https://jobmail-abc123.vercel.app`
- ✅ **Database:** Neon Postgres
- ✅ **Add-on:** Installed in Gmail
- ✅ **Triggers:** Running hourly scans
- ✅ **Dashboard:** Web UI for viewing applications

---

## What Happens Now?

### Automatic Scanning

Every hour, the add-on:
1. Scans your Gmail for job application emails
2. Parses company, title, status
3. Saves high-confidence matches to database
4. You can view them in the dashboard

### Manual Tracking

When you open a job email:
1. Add-on shows parsed details in sidebar
2. Click "Save to Tracker" to add to database
3. Works even for low-confidence emails

---

## Next Steps

### Optional Enhancements

1. **Custom Domain:**
   ```
   Vercel → Settings → Domains → Add Domain
   Update NEXTAUTH_URL and DASHBOARD_URL
   ```

2. **OAuth Sign-In:**
   ```
   See STAGE5_DEPLOYMENT_GUIDE.md → Step 6
   Configure GitHub/Google OAuth
   ```

3. **Monitoring:**
   ```powershell
   # Daily health check
   .\scripts\daily-health-check.ps1 `
     -ApiUrl "https://jobmail-abc123.vercel.app" `
     -ApiKey "your-api-key"
   ```

4. **Upgrade Plans (optional):**
   - Neon Pro: $19/month — no auto-pause, better performance
   - Vercel Pro: $20/month — unlimited bandwidth, faster builds

---

## Troubleshooting

### API Health Check Fails

```powershell
# Check Vercel logs
vercel logs --follow

# Verify DATABASE_URL
vercel env ls

# Test database connection
$env:DATABASE_URL="your-neon-url"
npx prisma db execute --stdin
# Type: SELECT 1;
```

### Add-on Not Appearing

1. Refresh Gmail (Ctrl+R / Cmd+R)
2. Check deployment: Apps Script editor → Deploy → Test deployments
3. Verify permissions granted

### Emails Not Being Detected

1. Check trigger is running: Apps Script → Triggers
2. View execution logs: `npx clasp logs`
3. Test manually: Run `hourlyScan` function from editor

### "401 Unauthorized" Errors

```javascript
// Run in Apps Script editor
function checkApiKey() {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('JOBMAIL_API_KEY');
  Logger.log('API Key: ' + apiKey.substring(0, 10) + '...');
}
```

Verify it matches Vercel env var: `vercel env ls`

---

## Full Documentation

For detailed guides, see:

- **[STAGE5_DEPLOYMENT_GUIDE.md](./STAGE5_DEPLOYMENT_GUIDE.md)** — Complete deployment guide
- **[STAGE5_TROUBLESHOOTING.md](./STAGE5_TROUBLESHOOTING.md)** — Troubleshooting reference
- **[apps-script/README_ADDON.md](./apps-script/README_ADDON.md)** — Add-on documentation

---

## Support

- **Health Check:** `https://your-app.vercel.app/api/health`
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Neon Console:** https://console.neon.tech
- **Apps Script Editor:** `npx clasp open`

---

## Summary

```
Time Investment:
  Neon setup:     2 minutes
  Deployment:     5 minutes
  Apps Script:    5 minutes
  Testing:        3 minutes
  ────────────────────────
  Total:         15 minutes

Result:
  ✅ Production API running on Vercel
  ✅ Database on Neon with migrations applied
  ✅ Gmail Add-on tracking job applications
  ✅ Automated hourly scans
  ✅ Web dashboard for viewing applications
  ✅ Zero monthly cost (free tiers)
```

**Happy job hunting! 🚀**

---

**Last Updated:** October 10, 2025  
**Deployment Target:** Vercel + Neon + Google Apps Script  
**Total Time:** ~15 minutes

