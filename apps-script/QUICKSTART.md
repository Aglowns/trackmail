# Quick Start Guide

Get the Gmail Add-on running in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- Google account with Gmail
- Vercel API running (Stage 2)
- `JOBMAIL_API_KEY` from backend

## 5-Step Setup

### 1. Install Dependencies

```bash
cd apps-script
npm install
```

### 2. Enable Apps Script API

Visit: https://script.google.com/home/usersettings  
Toggle ON: "Google Apps Script API"

### 3. Login and Create Project

```bash
npx clasp login
npx clasp create --title "Job Tracker Gmail Add-on" --type standalone
```

### 4. Build and Deploy

```bash
npm run build
npm run push
```

### 5. Install and Configure

```bash
# Open Apps Script editor
npm run open
```

In the editor:
1. Click "Deploy" → "Test deployments" → "Install"
2. Grant permissions
3. Open Gmail, click add-on icon
4. Go to Settings, enter:
   - **API URL**: `https://yourapp.vercel.app`
   - **API Key**: Your `JOBMAIL_API_KEY`
5. Click "Save" and "Test Connection"

## Setup Automated Scanning

In Apps Script editor:
1. Select `setupTriggers` from function dropdown
2. Click "Run"
3. Grant permissions

Done! The add-on will now scan for job emails every hour.

## Test It

1. Find a job application confirmation email
2. Open it in Gmail
3. Click the add-on icon (right sidebar)
4. See parsed job details
5. Click "Save to Tracker"

## Next Steps

- Read [README_ADDON.md](./README_ADDON.md) for full documentation
- Customize parsing rules in `src/parser.ts`
- Add more ATS platforms
- Adjust scan frequency in `src/scheduler.ts`

## Troubleshooting

**Add-on not showing?**
- Refresh Gmail completely
- Check deployment status in Apps Script

**API errors?**
- Verify API URL and key in Settings
- Test backend: `curl https://yourapp.vercel.app/api/health`

**Need help?**
```bash
# View logs
npm run logs

# Rebuild and push
npm run deploy
```

---

For detailed documentation, see [README_ADDON.md](./README_ADDON.md)

