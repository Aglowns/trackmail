# 🚀 Stage 5 — End-to-End Wiring & Deployment Guide

**Release Engineer's Complete Deployment Playbook**

This guide takes you from local development to a fully operational production stack on Neon, Vercel, and Google Apps Script.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Neon Database Setup](#phase-1-neon-database-setup)
3. [Phase 2: Vercel Deployment](#phase-2-vercel-deployment)
4. [Phase 3: Apps Script Deployment](#phase-3-apps-script-deployment)
5. [Phase 4: Smoke Tests](#phase-4-smoke-tests)
6. [Troubleshooting](#troubleshooting)
7. [Post-Deployment Checklist](#post-deployment-checklist)
8. [Monitoring & Operations](#monitoring--operations)

---

## Prerequisites

### Required Accounts
- ✅ **GitHub** account (code repository)
- ✅ **Vercel** account ([sign up](https://vercel.com/signup))
- ✅ **Neon** account ([sign up](https://neon.tech))
- ✅ **Google** account with Gmail access
- ✅ **Google Cloud Platform** project (for Apps Script)

### Local Requirements
- ✅ **Node.js** 18.x or later
- ✅ **npm** 9.x or later
- ✅ **Git** installed and configured
- ✅ Code pushed to GitHub repository

### Before You Start
- [ ] All local tests passing (`npm test`)
- [ ] Code committed to `main` branch
- [ ] No uncommitted secrets (check `.gitignore`)
- [ ] Database schema is stable (no pending migrations)

---

## Phase 1: Neon Database Setup

### 1.1 Create Neon Project

**Automated Script:** See `scripts/setup-neon.ps1`

**Manual Steps:**

1. **Go to Neon Console**
   ```
   https://console.neon.tech
   ```

2. **Create New Project**
   - Click "New Project"
   - **Project Name:** `jobmail-production`
   - **Region:** Choose closest to your users (e.g., `us-east-2`)
   - **Postgres Version:** 15 or later
   - Click "Create Project"

3. **Get Connection Strings**
   
   Navigate to: **Dashboard → Connection Details**
   
   Copy both connection strings:
   
   **Pooled Connection** (for `DATABASE_URL`):
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   
   **Direct Connection** (for `DIRECT_URL`):
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&options=project%3Dxxx
   ```

4. **Verify Connection String Format**
   
   ✅ Starts with `postgresql://`
   ✅ Contains `@ep-` (Neon endpoint)
   ✅ Ends with `?sslmode=require`
   ✅ No spaces or newlines

5. **Test Connection (Optional)**
   
   ```powershell
   # Using psql (if installed)
   psql "postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

### 1.2 Generate API Key

Generate a secure API key for backend authentication:

```powershell
# PowerShell
.\scripts\generate-api-key.ps1

# Or manually using openssl (Git Bash on Windows)
openssl rand -base64 32
```

**Example Output:**
```
AV16iK6nMLWuK6CWYPi5YjXTAL3fjUexS+V2vx1CR/k=
```

⚠️ **Save this key securely!** You'll need it for:
- Vercel environment variables
- Apps Script configuration
- Testing

### 1.3 Generate NextAuth Secret

```powershell
# PowerShell
.\scripts\generate-nextauth-secret.ps1

# Or manually
openssl rand -base64 32
```

---

## Phase 2: Vercel Deployment

### 2.1 Connect Repository to Vercel

**Automated Script:** See `scripts/deploy-vercel.ps1`

**Manual Steps:**

1. **Import Project**
   
   Go to: https://vercel.com/new
   
   - Click "Add New... → Project"
   - Select your GitHub repository
   - Click "Import"

2. **Configure Build Settings**
   
   Vercel auto-detects Next.js. Verify:
   
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
   - **Output Directory:** `.next` (auto-detected)

3. **Do NOT Deploy Yet** — First, set environment variables

### 2.2 Set Environment Variables

Click **Environment Variables** tab and add:

#### Required Variables

```env
# Database (from Neon)
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&options=project%3Dxxx

# API Authentication (generated in Phase 1.2)
JOBMAIL_API_KEY=AV16iK6nMLWuK6CWYPi5YjXTAL3fjUexS+V2vx1CR/k=

# NextAuth Configuration (generated in Phase 1.3)
NEXTAUTH_SECRET=KO5wGs+F4fWz20/ajfmQvaVmyUueYLEJmsovuDmHDYA=
NEXTAUTH_URL=https://your-project.vercel.app

# Node Environment
NODE_ENV=production
```

#### OAuth Variables (Optional — can add later)

```env
# GitHub OAuth (for web dashboard sign-in)
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret

# Google OAuth (alternative sign-in)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

**Important Notes:**
- Set all variables for **Production** environment
- `NEXTAUTH_URL` will be available after first deployment (you'll update it later)
- Paste values WITHOUT quotes
- No trailing spaces or newlines

### 2.3 Deploy to Production

1. **Click "Deploy"**
   
   Initial build takes 2-5 minutes.

2. **Monitor Build Logs**
   
   Watch for:
   - ✅ Dependencies installed
   - ✅ Prisma Client generated (via `postinstall` script)
   - ✅ Next.js build successful
   - ✅ Build artifacts optimized

3. **Deployment Complete**
   
   You'll get a production URL like:
   ```
   https://jobmail-abc123.vercel.app
   ```

4. **Update NEXTAUTH_URL**
   
   - Go to: **Settings → Environment Variables**
   - Edit `NEXTAUTH_URL` → Set to your production URL
   - **Redeploy:** Deployments → ... → Redeploy

### 2.4 Run Database Migrations

After deployment, run Prisma migrations to create database schema.

**Option A: Using Vercel CLI (Recommended)**

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
cd C:\Users\aglon\Desktop\CURSOR\Trackmail
vercel link

# Pull production environment variables
vercel env pull .env.production

# Run migrations using production DATABASE_URL
npx prisma migrate deploy
```

**Option B: Using Local with Production URL**

```powershell
# Temporarily set production DATABASE_URL
$env:DATABASE_URL="postgresql://user:password@ep-xxx.aws.neon.tech/neondb?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Unset variable
Remove-Item Env:\DATABASE_URL
```

**Expected Output:**

```
Applying migration `20250101000000_init`
Migration applied successfully (4s)

The following migration(s) have been applied:

migrations/
  └─ 20250101000000_init/
      └─ migration.sql

All migrations have been successfully applied.
```

**Verify Migration:**

```powershell
# Check tables were created
vercel env pull .env.production
npx prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

### 2.5 Verify Deployment

**Health Check:**

```powershell
curl https://your-project.vercel.app/api/health
```

**Expected Response (200 OK):**

```json
{
  "status": "ok",
  "timestamp": "2025-10-10T12:34:56.789Z",
  "database": "connected",
  "version": "1.0.0"
}
```

If you see `"database": "disconnected"`, check:
- DATABASE_URL is correct in Vercel env vars
- Neon database is active (free tier may pause)
- SSL mode is set (`?sslmode=require`)

---

## Phase 3: Apps Script Deployment

### 3.1 Enable Google Apps Script API

1. **Visit Google Apps Script Settings**
   ```
   https://script.google.com/home/usersettings
   ```

2. **Enable API**
   - Toggle "Google Apps Script API" to **ON**

### 3.2 Install Dependencies

```powershell
cd apps-script
npm install
```

This installs:
- `@google/clasp` - Command-line Apps Script tools
- `typescript` - TypeScript compiler
- `esbuild` - JavaScript bundler

### 3.3 Login to Clasp

```powershell
npx clasp login
```

**What happens:**
- Opens browser for Google authentication
- Grants clasp access to manage your Apps Script projects
- Saves credentials to `~/.clasprc.json`

If you get an error, ensure:
- Google Apps Script API is enabled (Step 3.1)
- Pop-ups are not blocked
- You're using the same Google account that will use the add-on

### 3.4 Create Apps Script Project

**Option A: Create New Project**

```powershell
npx clasp create --title "JobMail Gmail Add-on" --type standalone --rootDir ./
```

This creates:
- A new Apps Script project in your Google account
- `.clasp.json` with your script ID

**Option B: Clone Existing Project**

If you already have an Apps Script project:

1. Find your script ID:
   - Go to https://script.google.com
   - Open your project
   - Copy ID from URL: `script.google.com/...scriptId={YOUR_ID}`

2. Clone it:
   ```powershell
   npx clasp clone YOUR_SCRIPT_ID
   ```

### 3.5 Configure Script Properties

Before deploying, set configuration values:

**Option A: Using Web UI (Easier)**

1. Open Apps Script Editor:
   ```powershell
   npx clasp open
   ```

2. In editor: **Project Settings** → **Script Properties** → **Edit script properties**

3. Add properties:
   
   | Property | Value |
   |----------|-------|
   | `VERCEL_API_URL` | `https://your-project.vercel.app` |
   | `JOBMAIL_API_KEY` | `AV16iK6nMLWuK6CWYPi5YjXTAL3fjUexS+V2vx1CR/k=` |
   | `DASHBOARD_URL` | `https://your-project.vercel.app` (or custom domain) |

**Option B: Using Code (Run Once)**

Create a temporary function to set properties:

```javascript
function setupScriptProperties() {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    'VERCEL_API_URL': 'https://your-project.vercel.app',
    'JOBMAIL_API_KEY': 'AV16iK6nMLWuK6CWYPi5YjXTAL3fjUexS+V2vx1CR/k=',
    'DASHBOARD_URL': 'https://your-project.vercel.app'
  });
  console.log('Script properties configured!');
}
```

Then run it from the editor dropdown.

### 3.6 Build and Deploy

```powershell
# Build TypeScript to JavaScript
npm run build

# Push to Apps Script
npx clasp push

# Optional: Deploy a versioned deployment
npx clasp deploy --description "Production v1.0"
```

**Expected Output:**

```
└─ dist/appsscript.json
└─ dist/Code.js
Pushed 2 files.
```

### 3.7 Authorize Scopes

First time deployment requires authorization:

1. **Open Apps Script Editor**
   ```powershell
   npx clasp open
   ```

2. **Run a Test Function**
   - Select `onHomepage` from function dropdown
   - Click "Run" (▶️)

3. **Grant Permissions**
   - Click "Review Permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to JobMail (unsafe)"
   - Click "Allow"

**Required Scopes:**
- Gmail addons execute
- Gmail read-only
- External requests (UrlFetch)
- Script storage (Properties Service)

### 3.8 Deploy as Test Add-on

1. **In Apps Script Editor: Deploy → Test deployments**

2. **Configure Test Deployment**
   - Click "Install"
   - Grant permissions if prompted

3. **Verify Installation**
   - Open Gmail: https://mail.google.com
   - Open any email
   - Check right sidebar for add-on icon (should appear automatically)

### 3.9 Setup Time Triggers

Enable automated hourly scanning:

1. **In Apps Script Editor**
   - Select `setupTriggers` from function dropdown
   - Click "Run" (▶️)

2. **Verify Triggers Created**
   - Click "Triggers" (⏰ clock icon) in left sidebar
   - You should see:
     - `hourlyScan` — Runs every hour
     - `dailyDigestScan` — Runs daily at 8 AM

**Manual Trigger Setup (Alternative):**

If the function fails, create triggers manually:

1. Click "Triggers" in left sidebar
2. Click "+ Add Trigger"
3. Configure:
   - **Function:** `hourlyScan`
   - **Event source:** Time-driven
   - **Type of time-based trigger:** Hour timer
   - **Every N hours:** 1
   - Click "Save"

Repeat for `dailyDigestScan` with "Day timer" at 8 AM.

### 3.10 Test the Add-on

**Test 1: Homepage Card**

1. Open Gmail: https://mail.google.com
2. Click add-on icon in right sidebar
3. Should see: "JobMail Settings" card

**Test 2: Test Connection**

1. In add-on sidebar, click "Test Connection"
2. Should show: ✅ "Connection successful"
3. If fails, check:
   - `VERCEL_API_URL` is correct
   - `JOBMAIL_API_KEY` matches backend
   - Vercel API is accessible

**Test 3: Parse Job Email**

1. Open a job application confirmation email (or send yourself one)
2. Add-on should show parsed details:
   - Company name
   - Job title
   - Status
   - Confidence level
3. Click "Save to Tracker"
4. Should show: ✅ "Saved successfully"

**Test 4: Manual Scan**

1. In add-on sidebar, click "Run Scan Now"
2. Should scan recent emails
3. Check execution logs:
   ```powershell
   npm run logs
   ```

---

## Phase 4: Smoke Tests

Run these tests to verify end-to-end functionality.

### 4.1 Backend API Tests

**Script:** See `scripts/smoke-test-api.ps1`

**Test 1: Health Check**

```powershell
curl -X GET https://your-project.vercel.app/api/health
```

Expected: `200 OK`, `"database": "connected"`

**Test 2: Create Application**

```powershell
$body = @{
  threadId = "test-thread-$(Get-Date -Format 'yyyyMMddHHmmss')"
  lastEmailId = "test-email-001"
  company = "Smoke Test Corp"
  title = "Senior Test Engineer"
  status = "applied"
  source = "GMAIL"
  confidence = "HIGH"
} | ConvertTo-Json

curl -X POST https://your-project.vercel.app/api/applications/upsert `
  -H "Authorization: Bearer YOUR_API_KEY" `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: smoke-test-001" `
  -d $body
```

Expected: `201 Created`, returns application object with `id`

**Test 3: List Applications**

```powershell
curl -X GET "https://your-project.vercel.app/api/applications?limit=10" `
  -H "Authorization: Bearer YOUR_API_KEY"
```

Expected: `200 OK`, returns array with your test application

**Test 4: Get by Thread**

```powershell
curl -X GET "https://your-project.vercel.app/api/applications/by-thread/test-thread-001" `
  -H "Authorization: Bearer YOUR_API_KEY"
```

Expected: `200 OK`, returns the test application

**Test 5: Update Status**

```powershell
$updateBody = @{
  status = "interview"
} | ConvertTo-Json

curl -X PATCH "https://your-project.vercel.app/api/applications/YOUR_APP_ID/status" `
  -H "Authorization: Bearer YOUR_API_KEY" `
  -H "Content-Type: application/json" `
  -d $updateBody
```

Expected: `200 OK`, returns updated application

### 4.2 Gmail Add-on Tests

**Test 1: Open Known Job Email**

1. Find a "Thank you for applying" email in your Gmail
2. Open it
3. Add-on sidebar should show:
   - ✅ Parsed company name
   - ✅ Parsed job title
   - ✅ "Save to Tracker" button visible
   - ✅ Confidence level displayed

**Test 2: Save Application from Email**

1. In the same email, click "Save to Tracker"
2. Should show success notification
3. Verify in Vercel API:
   ```powershell
   curl https://your-project.vercel.app/api/applications \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```
4. Application should appear in list

**Test 3: Trigger Hourly Scan**

Manual trigger to test automation:

1. Open Apps Script editor: `npx clasp open`
2. Select `hourlyScan` function
3. Click "Run"
4. Check execution log:
   - Should scan recent emails
   - Log found applications
   - Upload high-confidence matches

**Alternative (using Apps Script API):**

```powershell
# Trigger via API (if enabled)
curl -X POST "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=scan"
```

### 4.3 End-to-End Integration Test

**Full user journey:**

1. **Send yourself a test job application email**
   
   From another account or use a test template:
   
   ```
   Subject: Your application to Acme Corp has been received
   
   Dear Candidate,
   
   Thank you for applying to the Software Engineer position at Acme Corp.
   We have received your application and will review it shortly.
   
   Best regards,
   Acme Talent Team
   ```

2. **Wait for hourly scan OR trigger manually**
   
   Either:
   - Wait up to 1 hour for automatic scan
   - Run `hourlyScan` manually from Apps Script editor

3. **Verify in API**
   
   ```powershell
   curl https://your-project.vercel.app/api/applications \
     -H "Authorization: Bearer YOUR_API_KEY" \
     | ConvertFrom-Json | Format-Table company, title, status
   ```
   
   Should show: `Acme Corp | Software Engineer | applied`

4. **Verify in Web Dashboard**
   
   Visit: `https://your-project.vercel.app`
   
   - Sign in (if OAuth configured)
   - Dashboard should show the application
   - Card displays all parsed details

**✅ Success Criteria:**
- Email detected automatically
- Application created in database
- Visible in web dashboard
- No errors in Vercel or Apps Script logs

---

## Troubleshooting

### 🔴 Neon Database Issues

#### Error: "Can't reach database server"

**Symptoms:**
- Health check returns `"database": "disconnected"`
- Vercel logs show `P1001: Can't reach database server`

**Fixes:**

1. **Verify CONNECTION_URL format:**
   ```
   ✅ postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ❌ postgres:// (wrong protocol)
   ❌ Missing ?sslmode=require
   ```

2. **Check Neon database is active:**
   - Free tier pauses after inactivity
   - Go to Neon Console → Wake database
   - Consider upgrading to prevent auto-pause

3. **Test connection locally:**
   ```powershell
   $env:DATABASE_URL="your-neon-url"
   npx prisma db execute --stdin <<< "SELECT 1;"
   ```

4. **Check Prisma SSL settings:**
   
   Add to `prisma/schema.prisma` if needed:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
     // Add if SSL issues persist:
     // relationMode = "prisma"
   }
   ```

#### Error: "Prepared statement already exists"

**Cause:** Connection pooling issue with Prisma

**Fix:** Use `DIRECT_URL` for migrations:

```powershell
# Ensure DIRECT_URL is set in Vercel
# Then redeploy or run migrations with DIRECT_URL
```

### 🔴 Vercel Deployment Issues

#### Error: "Module not found: Can't resolve '@prisma/client'"

**Cause:** Prisma Client not generated during build

**Fix:**

1. Verify `package.json` has `postinstall` script:
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate"
     }
   }
   ```

2. Check Vercel build logs for Prisma generation
3. If still failing, add explicit build command:
   ```json
   {
     "scripts": {
       "build": "prisma generate && next build"
     }
   }
   ```

#### Error: "NEXTAUTH_URL is not set"

**Cause:** Missing or incorrect environment variable

**Fix:**

1. Go to Vercel → Settings → Environment Variables
2. Add/Update:
   ```
   NEXTAUTH_URL=https://your-project.vercel.app
   ```
3. Redeploy: Deployments → ... → Redeploy

#### Error: "Rate limit exceeded"

**Cause:** Too many requests hitting API

**Fix:**

1. Implement rate limiting middleware (see `middleware.ts`)
2. Use Vercel Edge Config for distributed rate limiting
3. Monitor Vercel Analytics for traffic patterns

### 🔴 Apps Script Issues

#### Error: "401 Unauthorized" from API

**Cause:** Invalid or missing API key

**Fixes:**

1. **Verify API key in Script Properties:**
   ```javascript
   // Run this in Apps Script editor to check
   function checkApiKey() {
     const props = PropertiesService.getScriptProperties();
     const apiKey = props.getProperty('JOBMAIL_API_KEY');
     console.log('API Key length:', apiKey ? apiKey.length : 0);
     console.log('First 10 chars:', apiKey ? apiKey.substring(0, 10) : 'NOT SET');
   }
   ```

2. **Check for trailing spaces/newlines:**
   ```javascript
   function fixApiKey() {
     const props = PropertiesService.getScriptProperties();
     let apiKey = props.getProperty('JOBMAIL_API_KEY');
     apiKey = apiKey.trim(); // Remove whitespace
     props.setProperty('JOBMAIL_API_KEY', apiKey);
     console.log('API Key fixed!');
   }
   ```

3. **Verify API key matches backend:**
   - Check Vercel → Settings → Environment Variables → `JOBMAIL_API_KEY`
   - Must be EXACTLY the same (case-sensitive)

4. **Test authentication directly:**
   ```powershell
   curl https://your-project.vercel.app/api/health \
     -H "Authorization: Bearer YOUR_API_KEY" -v
   ```

#### Error: "403 Forbidden - Gmail scopes not authorized"

**Cause:** Missing OAuth scopes

**Fix:**

1. Delete existing authorization:
   - Visit: https://myaccount.google.com/permissions
   - Find "JobMail Gmail Add-on"
   - Click "Remove access"

2. Re-authorize with correct scopes:
   - Apps Script editor → Run function → Grant permissions
   - Verify all scopes are requested:
     - Gmail addons execute
     - Gmail readonly
     - Script external_request
     - Script storage

3. Check `appsscript.json` includes all scopes:
   ```json
   {
     "oauthScopes": [
       "https://www.googleapis.com/auth/gmail.addons.execute",
       "https://www.googleapis.com/auth/gmail.readonly",
       "https://www.googleapis.com/auth/script.external_request",
       "https://www.googleapis.com/auth/script.storage"
     ]
   }
   ```

#### Error: "UrlFetchApp timeout"

**Cause:** Vercel API taking too long to respond

**Fixes:**

1. **Increase timeout in Apps Script:**
   ```typescript
   const response = UrlFetchApp.fetch(url, {
     method: 'post',
     headers: headers,
     payload: JSON.stringify(payload),
     muteHttpExceptions: true,
     timeout: 30000 // Increase to 30 seconds
   });
   ```

2. **Optimize Vercel API performance:**
   - Add database indexes (already in schema)
   - Enable Vercel Edge caching for GET endpoints
   - Check Prisma query performance

3. **Check Neon database isn't paused:**
   - First query after pause takes 5-10 seconds
   - Upgrade to prevent auto-pause
   - Or add connection pooling

### 🔴 General Issues

#### Issue: No emails being detected

**Diagnosis:**

1. **Check Gmail search query:**
   ```javascript
   // In Apps Script, run:
   function testSearch() {
     const query = 'subject:(application received OR thank you for applying)';
     const threads = GmailApp.search(query, 0, 10);
     console.log('Found threads:', threads.length);
   }
   ```

2. **Check confidence levels:**
   - Only HIGH confidence emails are auto-saved
   - MEDIUM/LOW require manual action

3. **Verify trigger is running:**
   - Apps Script → Triggers → Check last execution
   - View execution logs: `npm run logs`

**Fixes:**

1. Adjust search query in `gmail.ts` to be less restrictive
2. Lower confidence threshold in `parser.ts`
3. Manually trigger scan to test immediately

#### Issue: Duplicate applications being created

**Cause:** Idempotency not working correctly

**Fix:**

1. Verify `threadId` is unique per email thread
2. Check `InboxMessage` table for duplicate `messageId`
3. Review API logs for duplicate requests

```sql
-- Check for duplicates in database
SELECT threadId, COUNT(*) as count
FROM applications
GROUP BY threadId
HAVING COUNT(*) > 1;
```

#### Issue: Slow API responses

**Diagnosis:**

1. Check Vercel function logs for execution time
2. Enable Prisma query logging:
   ```prisma
   generator client {
     provider = "prisma-client-js"
     log = ["query", "info", "warn", "error"]
   }
   ```

**Fixes:**

1. Add database indexes (already in schema, verify applied)
2. Reduce payload size (remove unnecessary fields)
3. Upgrade Vercel plan for better performance
4. Consider Redis caching (Upstash)

---

## Post-Deployment Checklist

### 🔒 Security

- [ ] Rotate `JOBMAIL_API_KEY` (different from development)
  ```powershell
  openssl rand -base64 32
  ```
  Update in: Vercel env vars + Apps Script properties

- [ ] Verify `NEXTAUTH_SECRET` is production-only (not in Git)

- [ ] Confirm all Vercel env vars set to **Production** (not Preview/Development)

- [ ] Enable HTTPS-only (Vercel does this by default)

- [ ] Review OAuth redirect URIs match production domain

- [ ] Check no secrets in Git history:
  ```powershell
  git log --all --full-history -- **/.env
  git log -S "API_KEY" --all
  ```

- [ ] Set up Vercel IP allowlist (if needed for sensitive data)

### 📊 Monitoring

- [ ] Enable Vercel Analytics:
  - Vercel Dashboard → Analytics → Enable

- [ ] Set up uptime monitoring:
  - Use UptimeRobot, Pingdom, or similar
  - Monitor: `https://your-project.vercel.app/api/health`
  - Alert on: 5xx errors, >5s response time

- [ ] Configure log aggregation:
  - Vercel → Integrations → Add log drain (Datadog, LogDNA, etc.)

- [ ] Set up error tracking:
  - Install Sentry: `npm install @sentry/nextjs`
  - Configure `sentry.properties`
  - Add Sentry DSN to Vercel env vars

- [ ] Create Vercel webhook notifications:
  - Settings → Git → Deploy Hooks
  - Notify on: deployment-failed, deployment-error

- [ ] Enable Vercel Speed Insights (for Next.js pages):
  ```javascript
  // app/layout.tsx
  import { SpeedInsights } from '@vercel/speed-insights/next'
  
  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          {children}
          <SpeedInsights />
        </body>
      </html>
    )
  }
  ```

### 📝 Request Logging

- [ ] Enable structured logging in API routes:
  ```typescript
  // lib/logger.ts
  export function logRequest(req: NextRequest, response: any) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.nextUrl.pathname,
      status: response.status,
      duration: '...',
      userId: '...',
    }));
  }
  ```

- [ ] Add request ID tracking:
  ```typescript
  // middleware.ts
  export function middleware(request: NextRequest) {
    const requestId = crypto.randomUUID();
    request.headers.set('X-Request-ID', requestId);
    // ...
  }
  ```

- [ ] Log slow queries:
  ```typescript
  // prisma/client.ts
  const prisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
    ],
  });
  
  prisma.$on('query', (e) => {
    if (e.duration > 1000) { // Log queries >1s
      console.warn('Slow query:', e);
    }
  });
  ```

### 🧪 Testing

- [ ] Run smoke tests (Phase 4)

- [ ] Test with real job application email

- [ ] Verify OAuth sign-in works (if configured)

- [ ] Test from different browsers (Chrome, Firefox, Safari)

- [ ] Test on mobile Gmail app (add-on may not be available)

- [ ] Load test with 100+ applications:
  ```powershell
  .\scripts\load-test.ps1
  ```

### 📖 Documentation

- [ ] Update README with production URL

- [ ] Document API endpoints with examples

- [ ] Create runbook for common operations:
  - Rotating API keys
  - Scaling database
  - Debugging failed deployments

- [ ] Add team access:
  - Vercel: Settings → Team → Invite
  - GitHub: Repository → Settings → Collaborators
  - Neon: Project Settings → Share

### 🚀 Performance

- [ ] Verify Vercel Edge caching is working:
  ```typescript
  // For static pages
  export const revalidate = 60; // Cache for 60 seconds
  ```

- [ ] Enable Next.js Incremental Static Regeneration (ISR):
  ```typescript
  // For frequently accessed pages
  export async function generateStaticParams() {
    // Pre-generate common routes
  }
  ```

- [ ] Optimize images (if any):
  ```tsx
  import Image from 'next/image';
  // Next.js automatically optimizes
  ```

- [ ] Check bundle size:
  ```powershell
  npm run build
  # Review .next/analyze/client.html
  ```

### 💰 Cost Optimization

- [ ] Review Vercel usage: Dashboard → Usage
  - Free tier: 100GB bandwidth, 100 hours compute
  - Upgrade if approaching limits

- [ ] Review Neon usage: Dashboard → Usage
  - Free tier: 1 project, 500MB storage
  - Upgrade for more storage or compute

- [ ] Optimize database queries to reduce compute time

- [ ] Consider scheduled scale-down for non-production databases

### 🎯 User Experience

- [ ] Add custom domain (if desired):
  - Vercel → Settings → Domains → Add
  - Update DNS records
  - Update `NEXTAUTH_URL` and `DASHBOARD_URL`

- [ ] Test add-on in different Gmail contexts:
  - Desktop web
  - Mobile web (limited add-on support)
  - Inbox view vs. email view

- [ ] Create user documentation:
  - How to install add-on
  - How to use features
  - FAQ

### 🔄 Continuous Deployment

- [ ] Set up staging environment:
  - Create separate Vercel project for staging
  - Use separate Neon database
  - Deploy `develop` branch to staging

- [ ] Configure GitHub branch protection:
  - Require PR reviews
  - Require status checks (tests)
  - No direct pushes to `main`

- [ ] Set up preview deployments:
  - Vercel automatically creates previews for PRs
  - Test changes before merging

---

## Monitoring & Operations

### Daily Operations

**Morning Check (2 minutes):**

```powershell
# Run daily health check script
.\scripts\daily-health-check.ps1
```

This checks:
- API health endpoint
- Database connectivity
- Recent error count
- Trigger execution status

**Weekly Review (15 minutes):**

1. Review Vercel Analytics:
   - Total requests
   - Error rate
   - Average response time

2. Review Apps Script executions:
   - Trigger success rate
   - Failed executions
   - Quota usage

3. Review database:
   - Storage usage
   - Query performance
   - Table sizes

### Scaling Thresholds

**When to upgrade Vercel:**

- Bandwidth >90% of free tier (90GB/month)
- Function execution time consistently >5s
- Need faster builds
- Need more team members

**When to upgrade Neon:**

- Storage >400MB (80% of free tier)
- Consistent connection errors (need more connections)
- Database auto-pause causing UX issues
- Need backups/point-in-time recovery

### Incident Response

**If API is down:**

1. Check Vercel status: https://vercel-status.com
2. Check Neon status: https://neon.tech/status
3. View recent deployments for breaking changes
4. Rollback if needed: `vercel rollback`

**If add-on not working:**

1. Check Apps Script execution logs: `npm run logs`
2. Verify Script Properties are set
3. Test API health endpoint
4. Re-authorize OAuth scopes if needed

**If database is slow:**

1. Check Neon compute state (may be starting from pause)
2. Review slow query logs
3. Check for missing indexes
4. Consider upgrading Neon compute

### Backup & Recovery

**Database Backups:**

Neon Pro tier includes automatic backups. For free tier:

```powershell
# Export database
pg_dump "your-neon-url" > backup-$(Get-Date -Format 'yyyyMMdd').sql

# Restore
psql "your-neon-url" < backup-20250110.sql
```

**Code Backups:**

- GitHub is your source of truth
- Vercel maintains deployment history (rollback available)
- Apps Script versions maintained by Google

**Configuration Backups:**

```powershell
# Export Vercel env vars
vercel env ls > envs-backup-$(Get-Date -Format 'yyyyMMdd').txt

# Export Apps Script properties (manually from UI)
# Or run this in Apps Script editor:
function exportProps() {
  const props = PropertiesService.getScriptProperties().getProperties();
  console.log(JSON.stringify(props, null, 2));
}
```

---

## Success Metrics

Your deployment is successful when:

- ✅ Health check returns `200 OK` with `"database": "connected"`
- ✅ Can create application via API (201 Created)
- ✅ Can list applications via API (200 OK)
- ✅ Gmail add-on appears in sidebar
- ✅ Add-on can parse job email and display card
- ✅ Clicking "Save to Tracker" creates database record
- ✅ Hourly trigger successfully scans for new emails
- ✅ Web dashboard loads and displays applications
- ✅ OAuth sign-in works (if configured)
- ✅ No errors in Vercel logs
- ✅ No errors in Apps Script execution logs

### Acceptance Criteria

**Following this guide yields a working live stack:**

1. **Backend API (Vercel):**
   - Deployed and accessible at `https://*.vercel.app`
   - All environment variables configured
   - Database migrations applied
   - Health check passing

2. **Database (Neon):**
   - PostgreSQL instance running
   - Schema created via Prisma migrations
   - Accessible from Vercel

3. **Gmail Add-on (Apps Script):**
   - Deployed and authorized
   - Script properties configured
   - Time triggers active
   - Parses and saves job emails

4. **Integration:**
   - Add-on successfully calls Vercel API
   - Applications appear in database
   - Web dashboard displays saved applications

---

## Next Steps

After successful deployment:

1. **Invite team members** (if collaborative)
2. **Set up custom domain** (optional)
3. **Enable monitoring and alerts**
4. **Create user documentation**
5. **Gather user feedback**
6. **Plan feature enhancements**

---

## Support & Resources

### Official Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Apps Script Guides](https://developers.google.com/apps-script/guides)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)

### Troubleshooting Resources

- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Neon Discord](https://discord.gg/neon)
- [Stack Overflow - Apps Script](https://stackoverflow.com/questions/tagged/google-apps-script)

### Project Documentation

- `README.md` - Project overview
- `ARCHITECTURE.md` - System design
- `README_BACKEND.md` - Backend API reference
- `apps-script/README_ADDON.md` - Add-on setup guide
- `TROUBLESHOOTING.md` - Common issues and fixes

---

**Deployment Guide Version:** 1.0  
**Last Updated:** October 10, 2025  
**Estimated Total Deployment Time:** 30-45 minutes (first time)

---

**🎉 Congratulations on reaching production!**

You now have a fully operational job application tracker with:
- Automated email parsing
- Centralized database
- Modern web dashboard
- Real-time synchronization

Happy job hunting! 🚀

