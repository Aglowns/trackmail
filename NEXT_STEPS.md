# 🚀 Gmail Add-on - Ready to Deploy!

## ✅ What's Already Done

✅ **Dependencies installed** (274 packages)  
✅ **TypeScript compiled** → `apps-script/dist/Code.js` (619 lines)  
✅ **Manifest ready** → `apps-script/dist/appsscript.json`  
✅ **Build system working** → `npm run build` succeeds  

## 📋 Next Steps (You Need To Do)

### Step 1: Enable Apps Script API

Visit: https://script.google.com/home/usersettings  
Toggle **ON**: "Google Apps Script API"

### Step 2: Login to Clasp (One-time)

```bash
cd apps-script
npx clasp login
```

This will:
- Open your browser
- Ask you to login with your Google account
- Grant permissions to clasp CLI

### Step 3: Create Apps Script Project

```bash
npx clasp create --title "Job Tracker Gmail Add-on" --type standalone
```

This will:
- Create a new Apps Script project
- Update `.clasp.json` with your `scriptId`
- Link your local files to the cloud project

### Step 4: Deploy to Apps Script

```bash
npm run push
```

This will:
- Upload `dist/Code.js` and `dist/appsscript.json`
- Make the add-on available in Apps Script editor

### Step 5: Install the Add-on

```bash
npm run open
```

This opens the Apps Script editor. Then:

1. Click **"Deploy"** → **"Test deployments"**
2. Click **"Install"**
3. Grant requested permissions:
   - Read Gmail messages
   - Make external API calls
   - Store configuration

### Step 6: Configure the Add-on

1. Open **Gmail** in your browser
2. Open any email
3. Click the **add-on icon** in the right sidebar (might take a moment to appear)
4. Click **"Settings"** or navigate to the homepage
5. Enter your configuration:
   - **Vercel API URL**: `https://your-trackmail-app.vercel.app`
   - **API Key**: Your `JOBMAIL_API_KEY` from backend `.env`
   - **Dashboard URL**: (optional) Your frontend URL
6. Click **"Save Configuration"**
7. Click **"Test Connection"** to verify

### Step 7: Setup Automated Scanning (Optional but Recommended)

In the Apps Script editor:

1. Select `setupTriggers` from the function dropdown (top toolbar)
2. Click **"Run"** (▶️ button)
3. Grant permissions if prompted
4. Check logs to confirm: "Triggers setup complete!"

This installs:
- **Hourly scan**: Runs every hour, scans last 2 days
- **Daily digest**: Runs at 8 AM, scans last 7 days

### Step 8: Test It!

1. Find a job application confirmation email (or send yourself a test one)
2. Open it in Gmail
3. Click the add-on icon
4. You should see parsed job details
5. Click **"Save to Tracker"**
6. Check your backend database to verify it saved

## 🔧 Development Commands

```bash
cd apps-script

# Rebuild after code changes
npm run build

# Push updates to Apps Script
npm run push

# Build + push in one command
npm run deploy

# View execution logs
npm run logs

# Open Apps Script editor
npm run open

# Watch for changes (auto-rebuild)
npm run watch
```

## 🐛 Troubleshooting

### "Add-on not appearing in Gmail"
- Refresh Gmail completely (Ctrl+R or Cmd+R)
- Wait 1-2 minutes after installation
- Check deployment status in Apps Script editor

### "Configuration not found"
- Make sure you saved settings via the Settings UI
- Check Script Properties in Apps Script editor: File → Project Properties → Script Properties

### "API connection failed"
- Verify your backend is running: `curl https://yourapp.vercel.app/api/health`
- Check API URL format (must start with `https://`)
- Verify `JOBMAIL_API_KEY` matches backend `.env`

### "Permission errors"
- Re-deploy: Deploy → Test deployments → Install
- Grant all requested permissions
- Check OAuth scopes in `appsscript.json`

## 📚 Documentation

- **Full Guide**: `apps-script/README_ADDON.md`
- **Quick Start**: `apps-script/QUICKSTART.md`
- **Stage 3 Report**: `STAGE3_COMPLETE.md`

## 🎯 What the Add-on Does

1. **Detects job application emails** automatically
2. **Parses** company name, job title, status, source
3. **Shows context card** with details when you open the email
4. **Saves to your API** with one click
5. **Scans hourly** for new applications (if triggers enabled)
6. **Works with 15+ ATS platforms**: Greenhouse, Lever, LinkedIn, Workday, etc.

## 🔐 Required Permissions

- ✅ **Read Gmail** (view messages only - no send/delete)
- ✅ **External requests** (call your Vercel API)
- ✅ **Storage** (save configuration)
- ✅ **Run as add-on** (display in Gmail sidebar)

## 📊 Current Status

```
✅ TypeScript source code (8 modules)
✅ Build system configured (esbuild + clasp)
✅ Dependencies installed (274 packages)
✅ Code compiled successfully (dist/Code.js)
✅ Manifest ready (appsscript.json)
✅ Documentation complete

⏳ Waiting for: Your Google account authentication (Step 2)
⏳ Waiting for: Apps Script project creation (Step 3)
⏳ Waiting for: Deployment to Google (Step 4)
⏳ Waiting for: API configuration (Step 6)
```

## 🆘 Need Help?

1. **Check logs**: `npm run logs` in `apps-script/` directory
2. **View executions**: Apps Script editor → "Executions" tab (clock icon)
3. **Test manually**: Run functions directly in Apps Script editor
4. **Read docs**: See `apps-script/README_ADDON.md` for detailed guides

---

**You're ready to deploy!** Start with Step 1 above. 🚀

