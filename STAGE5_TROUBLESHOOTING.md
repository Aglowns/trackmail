# 🔧 Stage 5 Troubleshooting Guide

**Complete reference for debugging production deployment issues**

---

## Table of Contents

- [Database Issues](#database-issues)
- [Vercel Deployment Issues](#vercel-deployment-issues)
- [Apps Script Issues](#apps-script-issues)
- [Authentication & Authorization](#authentication--authorization)
- [Network & Connectivity](#network--connectivity)
- [Performance Issues](#performance-issues)
- [Data Integrity Issues](#data-integrity-issues)
- [Quick Diagnostics](#quick-diagnostics)

---

## Database Issues

### Error: "Can't reach database server" (P1001)

**Symptoms:**
- API health check shows `"database": "disconnected"`
- Vercel logs: `PrismaClientInitializationError: Can't reach database server`
- 503 Service Unavailable responses

**Root Causes:**

1. **Incorrect DATABASE_URL format**
   ```
   ❌ postgres://user:pass@...          (wrong protocol)
   ❌ postgresql://user:pass@host/db    (missing sslmode)
   ✅ postgresql://user:pass@host/db?sslmode=require
   ```

2. **Neon database paused (free tier)**
   - Free tier auto-pauses after inactivity
   - First query after pause takes 5-10 seconds
   - Subsequent queries are fast

3. **SSL certificate issues**
   - Missing `?sslmode=require` in connection string
   - Firewall blocking SSL connections

4. **Connection string copied with whitespace**
   - Trailing spaces or newlines
   - Hidden characters from clipboard

**Solutions:**

```powershell
# 1. Test connection locally
$env:DATABASE_URL="your-production-url"
npx prisma db execute --stdin
# Then type: SELECT 1;
# Press Ctrl+D

# 2. Verify connection string in Vercel
vercel env ls
# Check DATABASE_URL value

# 3. Wake Neon database
# Visit: https://console.neon.tech
# Click on your project → Database wakes automatically

# 4. Test with psql (if installed)
psql "postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

**Verification:**

```powershell
curl https://your-app.vercel.app/api/health
# Should return: "database": "connected"
```

---

### Error: "Prepared statement already exists" (P2034)

**Symptoms:**
- Intermittent database errors
- `PrismaClientKnownRequestError: Prepared statement "s0" already exists`

**Root Cause:**
- Connection pooling conflict
- Multiple Prisma clients using same connection

**Solutions:**

1. **Use DIRECT_URL for migrations:**
   ```powershell
   # Ensure DIRECT_URL is set in Vercel
   vercel env add DIRECT_URL
   # Paste direct connection string from Neon
   ```

2. **Add connection pool settings:**
   ```env
   # In Vercel environment variables
   DATABASE_URL="postgresql://...?sslmode=require&pgbouncer=true&connection_limit=1"
   ```

3. **Use transaction pooling (Neon specific):**
   ```env
   # For better concurrency
   DATABASE_URL="postgresql://...?sslmode=require&pool_timeout=10&connect_timeout=10"
   ```

---

### Error: "Too many connections"

**Symptoms:**
- `P1001: Can't reach database server`
- Neon dashboard shows "Connection limit reached"

**Root Cause:**
- Free tier: 20 simultaneous connections
- Vercel serverless functions not releasing connections

**Solutions:**

1. **Reduce connection pool size:**
   ```typescript
   // lib/prisma.ts
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
     // Add connection limit
     __internal: {
       engineProtocol: 'json',
     },
   });
   ```

2. **Use connection pooler:**
   ```
   DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
   ```

3. **Upgrade Neon plan:**
   - Pro plan: Unlimited connections
   - Better for production workloads

---

### Error: "SSL connection has been closed unexpectedly"

**Symptoms:**
- Intermittent connection drops
- `error: SSL connection has been closed unexpectedly`

**Root Cause:**
- Network timeout
- SSL handshake failure
- Neon maintenance

**Solutions:**

1. **Add connection timeout:**
   ```env
   DATABASE_URL="postgresql://...?sslmode=require&connect_timeout=10"
   ```

2. **Retry logic in Prisma:**
   ```typescript
   // lib/prisma.ts
   import { PrismaClient } from '@prisma/client';
   
   const prismaClientSingleton = () => {
     return new PrismaClient({
       log: ['error', 'warn'],
     }).$extends({
       query: {
         async $allOperations({ operation, model, args, query }) {
           const maxRetries = 3;
           for (let i = 0; i < maxRetries; i++) {
             try {
               return await query(args);
             } catch (e) {
               if (i === maxRetries - 1) throw e;
               await new Promise(res => setTimeout(res, 100 * (i + 1)));
             }
           }
         },
       },
     });
   };
   ```

---

## Vercel Deployment Issues

### Error: "Module not found: Can't resolve '@prisma/client'"

**Symptoms:**
- Build fails with `Module not found: Can't resolve '@prisma/client'`
- Vercel logs show Prisma import errors

**Root Cause:**
- Prisma Client not generated during build
- Missing `postinstall` script

**Solutions:**

1. **Verify postinstall script exists:**
   ```json
   // package.json
   {
     "scripts": {
       "postinstall": "prisma generate"
     }
   }
   ```

2. **Add explicit generation to build:**
   ```json
   {
     "scripts": {
       "build": "prisma generate && next build"
     }
   }
   ```

3. **Check Vercel build logs:**
   - Look for "Generating Prisma Client" message
   - If missing, postinstall didn't run

4. **Force reinstall:**
   ```powershell
   # Locally
   npm clean-cache --force
   rm -rf node_modules package-lock.json
   npm install
   
   # Then commit and push
   git add .
   git commit -m "Fix Prisma generation"
   git push
   ```

---

### Error: "NEXTAUTH_URL is not set"

**Symptoms:**
- NextAuth errors in logs
- OAuth sign-in fails
- `[next-auth][error] NEXTAUTH_URL environment variable not set`

**Root Cause:**
- Missing NEXTAUTH_URL environment variable
- Variable set for wrong environment (Preview instead of Production)

**Solutions:**

1. **Add NEXTAUTH_URL in Vercel:**
   ```powershell
   vercel env add NEXTAUTH_URL production
   # Enter: https://your-project.vercel.app
   ```

2. **Verify it's set for Production:**
   - Vercel Dashboard → Settings → Environment Variables
   - Check "Production" checkbox is selected

3. **Redeploy after adding:**
   ```powershell
   vercel --prod
   ```

4. **Update after custom domain:**
   ```
   # If you add a custom domain
   NEXTAUTH_URL=https://yourdomain.com
   ```

---

### Error: "Build exceeded maximum duration"

**Symptoms:**
- Build times out after 10 minutes (Free tier)
- `Error: Build exceeded maximum duration of 10m0s`

**Root Cause:**
- Large dependencies
- Slow postinstall scripts
- Network issues during install

**Solutions:**

1. **Upgrade Vercel plan:**
   - Pro: 45-minute build timeout
   - Required for large projects

2. **Optimize dependencies:**
   ```powershell
   # Check for unnecessary dependencies
   npm prune
   
   # Remove unused packages
   npm uninstall <unused-packages>
   ```

3. **Use caching:**
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "framework": "nextjs",
     "cache": ["node_modules", ".next/cache"]
   }
   ```

4. **Reduce postinstall work:**
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate"
       // Don't run tests or other heavy tasks here
     }
   }
   ```

---

### Error: "Function invocation timeout"

**Symptoms:**
- API requests timeout after 10 seconds
- `Error: Function execution timed out after 10.00 seconds`

**Root Cause:**
- Slow database queries
- External API calls timing out
- Database cold start (Neon free tier)

**Solutions:**

1. **Increase timeout in vercel.json:**
   ```json
   {
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     }
   }
   ```
   Note: Hobby plan max is 10s, Pro plan max is 60s

2. **Optimize database queries:**
   ```typescript
   // Add select to reduce payload
   const apps = await prisma.application.findMany({
     select: {
       id: true,
       company: true,
       title: true,
       status: true,
       // Only fields you need
     },
     take: 50, // Limit results
   });
   ```

3. **Add timeout to external calls:**
   ```typescript
   // For Apps Script → Vercel calls
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 25000);
   
   const response = await fetch(url, {
     signal: controller.signal,
     headers: { ... }
   });
   ```

4. **Use Vercel Edge Functions for faster cold starts:**
   ```typescript
   // app/api/health/route.ts
   export const runtime = 'edge';
   ```

---

### Error: "Rate limit exceeded"

**Symptoms:**
- `429 Too Many Requests`
- Frequent during automated scans

**Root Cause:**
- Apps Script trigger making too many requests
- No rate limiting implemented

**Solutions:**

1. **Add rate limiting middleware:**
   ```typescript
   // middleware.ts
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';
   
   const rateLimitMap = new Map<string, number[]>();
   
   export function middleware(request: NextRequest) {
     const apiKey = request.headers.get('authorization')?.split(' ')[1];
     if (!apiKey) return NextResponse.next();
     
     const now = Date.now();
     const timestamps = rateLimitMap.get(apiKey) || [];
     const recentRequests = timestamps.filter(t => now - t < 60000);
     
     if (recentRequests.length >= 100) {
       return NextResponse.json(
         { error: 'Rate limit exceeded' },
         { status: 429 }
       );
     }
     
     recentRequests.push(now);
     rateLimitMap.set(apiKey, recentRequests);
     
     return NextResponse.next();
   }
   ```

2. **Reduce scan frequency:**
   ```typescript
   // apps-script/src/scheduler.ts
   // Change from hourly to every 2 hours
   ScriptApp.newTrigger('hourlyScan')
     .timeBased()
     .everyHours(2) // Instead of 1
     .create();
   ```

3. **Use Vercel Edge Config for distributed rate limiting** (Pro plan)

---

## Apps Script Issues

### Error: "401 Unauthorized"

**Symptoms:**
- Apps Script logs: `Exception: Request failed with status 401`
- API returns "Invalid API key"
- Test Connection button shows error

**Root Cause:**
- API key mismatch between Apps Script and Vercel
- Trailing whitespace in API key
- API key not set in Script Properties

**Diagnostic Steps:**

```javascript
// Run this in Apps Script editor to debug
function debugAuth() {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('JOBMAIL_API_KEY');
  
  Logger.log('API Key exists: ' + (apiKey ? 'YES' : 'NO'));
  Logger.log('API Key length: ' + (apiKey ? apiKey.length : 0));
  Logger.log('First 10 chars: ' + (apiKey ? apiKey.substring(0, 10) : 'N/A'));
  Logger.log('Last 5 chars: ' + (apiKey ? apiKey.substring(apiKey.length - 5) : 'N/A'));
  
  // Check for whitespace
  if (apiKey && apiKey !== apiKey.trim()) {
    Logger.log('⚠️ API Key contains whitespace!');
  }
}
```

**Solutions:**

1. **Verify API key matches:**
   ```powershell
   # Get Vercel's API key
   vercel env ls
   
   # Compare with Apps Script property
   # They must match EXACTLY (case-sensitive)
   ```

2. **Remove whitespace:**
   ```javascript
   function fixApiKey() {
     const props = PropertiesService.getScriptProperties();
     let apiKey = props.getProperty('JOBMAIL_API_KEY');
     apiKey = apiKey.trim();
     props.setProperty('JOBMAIL_API_KEY', apiKey);
     Logger.log('API Key trimmed and saved');
   }
   ```

3. **Reset API key:**
   ```powershell
   # Generate new key
   openssl rand -base64 32
   
   # Update in Vercel
   vercel env rm JOBMAIL_API_KEY production
   vercel env add JOBMAIL_API_KEY production
   
   # Update in Apps Script
   # Project Settings → Script Properties → JOBMAIL_API_KEY
   ```

4. **Test authentication:**
   ```javascript
   function testAuth() {
     const props = PropertiesService.getScriptProperties();
     const apiUrl = props.getProperty('VERCEL_API_URL');
     const apiKey = props.getProperty('JOBMAIL_API_KEY');
     
     const response = UrlFetchApp.fetch(apiUrl + '/api/health', {
       method: 'get',
       headers: {
         'Authorization': 'Bearer ' + apiKey
       },
       muteHttpExceptions: true
     });
     
     Logger.log('Status: ' + response.getResponseCode());
     Logger.log('Response: ' + response.getContentText());
   }
   ```

---

### Error: "403 Forbidden" or "Insufficient Permissions"

**Symptoms:**
- `Exception: Access denied`
- Cannot read Gmail messages
- Cannot access Properties Service

**Root Cause:**
- OAuth scopes not authorized
- User revoked permissions
- Missing scopes in `appsscript.json`

**Solutions:**

1. **Verify scopes in appsscript.json:**
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

2. **Revoke and re-authorize:**
   - Visit: https://myaccount.google.com/permissions
   - Find "JobMail Gmail Add-on"
   - Click "Remove access"
   - In Apps Script editor: Run any function → Grant permissions again

3. **Check Google API status:**
   - https://www.google.com/appsstatus
   - Gmail and Apps Script must be operational

---

### Error: "UrlFetchApp timeout"

**Symptoms:**
- `Exception: Request timeout`
- Apps Script logs show slow API calls
- Emails not being saved

**Root Cause:**
- Vercel API taking too long
- Neon database cold start
- Network latency

**Solutions:**

1. **Increase timeout in Apps Script:**
   ```typescript
   // apps-script/src/storage.ts
   const response = UrlFetchApp.fetch(url, {
     method: 'post',
     headers: headers,
     payload: JSON.stringify(payload),
     muteHttpExceptions: true,
     timeout: 30000 // Increase to 30 seconds
   });
   ```

2. **Optimize Vercel API:**
   - Add database indexes (already in schema)
   - Use `select` to reduce payload size
   - Enable query result caching

3. **Check Neon database:**
   - Free tier may be paused → first query is slow
   - Upgrade to prevent auto-pause
   - Or accept 5-10s delay after inactivity

4. **Add retry logic:**
   ```typescript
   async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return UrlFetchApp.fetch(url, options);
       } catch (e) {
         if (i === maxRetries - 1) throw e;
         Utilities.sleep(1000 * (i + 1)); // Exponential backoff
       }
     }
   }
   ```

---

### Issue: "Emails not being detected"

**Symptoms:**
- Hourly scan runs but finds 0 emails
- Known job emails not appearing in dashboard
- Manual scan shows no results

**Diagnostic Steps:**

```javascript
// Run in Apps Script editor
function testEmailSearch() {
  const query = 'subject:(application received OR thank you for applying) newer_than:7d';
  const threads = GmailApp.search(query, 0, 10);
  
  Logger.log('Found threads: ' + threads.length);
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    Logger.log('\nThread: ' + thread.getFirstMessageSubject());
    Logger.log('Messages: ' + messages.length);
    
    messages.forEach(msg => {
      Logger.log('  From: ' + msg.getFrom());
      Logger.log('  Subject: ' + msg.getSubject());
    });
  });
}
```

**Solutions:**

1. **Adjust search query:**
   ```typescript
   // apps-script/src/gmail.ts
   // Make query less restrictive
   const queries = [
     'from:noreply newer_than:7d',
     'subject:application newer_than:7d',
     'from:(greenhouse.io OR lever.co OR linkedin.com) newer_than:7d'
   ];
   ```

2. **Lower confidence threshold:**
   ```typescript
   // apps-script/src/main.ts
   // Save MEDIUM confidence emails (not just HIGH)
   if (parsed.confidence === 'HIGH' || parsed.confidence === 'MEDIUM') {
     await saveToAPI(parsed);
   }
   ```

3. **Check labels:**
   ```javascript
   // Ensure emails aren't archived/deleted
   const threads = GmailApp.search('in:inbox OR in:all', 0, 10);
   ```

4. **Verify trigger is running:**
   - Apps Script editor → Triggers (clock icon)
   - Check "Last Execution" timestamp
   - View execution logs: `clasp logs`

---

### Issue: "Trigger not running"

**Symptoms:**
- No automatic scans happening
- Last execution shows "N/A" or old date
- No entries in execution log

**Diagnostic Steps:**

```javascript
// Run in Apps Script editor
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log('Total triggers: ' + triggers.length);
  
  triggers.forEach(trigger => {
    Logger.log('\nTrigger:');
    Logger.log('  Function: ' + trigger.getHandlerFunction());
    Logger.log('  Type: ' + trigger.getEventType());
  });
}
```

**Solutions:**

1. **Delete and recreate triggers:**
   ```javascript
   function resetTriggers() {
     // Delete all existing triggers
     const triggers = ScriptApp.getProjectTriggers();
     triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
     
     // Recreate
     ScriptApp.newTrigger('hourlyScan')
       .timeBased()
       .everyHours(1)
       .create();
     
     ScriptApp.newTrigger('dailyDigestScan')
       .timeBased()
       .atHour(8)
       .everyDays(1)
       .create();
     
     Logger.log('Triggers recreated');
   }
   ```

2. **Check trigger quota:**
   - Free Gmail: 20 triggers per script
   - Check: Apps Script editor → Triggers → Verify not at limit

3. **Verify function name is correct:**
   - Trigger must call `hourlyScan` exactly
   - Case-sensitive
   - Function must exist in deployed code

4. **Check execution history:**
   - Apps Script editor → Executions
   - Look for errors
   - Check "Failed" executions

---

## Authentication & Authorization

### Issue: "Bearer token missing or invalid"

**Symptoms:**
- 401 Unauthorized
- Error: "No authorization header"

**Solutions:**

1. **Check Authorization header format:**
   ```
   ❌ Authorization: your-api-key
   ❌ Authorization: bearer your-api-key
   ✅ Authorization: Bearer your-api-key
   ```
   (Note: Capital "B" in "Bearer")

2. **Verify middleware is not stripping header:**
   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     console.log('Headers:', Object.fromEntries(request.headers));
     // Check if Authorization is present
   }
   ```

3. **Test with curl:**
   ```powershell
   curl https://your-app.vercel.app/api/applications `
     -H "Authorization: Bearer YOUR_API_KEY" `
     -v  # Verbose mode shows headers
   ```

---

### Issue: "Idempotency key rejected"

**Symptoms:**
- Error: "Idempotency key must be unique"
- Duplicate applications created

**Root Cause:**
- Reusing same Idempotency-Key for different requests
- Idempotency cache expired

**Solutions:**

1. **Use message ID as idempotency key:**
   ```typescript
   // apps-script/src/storage.ts
   const headers = {
     'Authorization': `Bearer ${apiKey}`,
     'Idempotency-Key': emailMessage.getId(), // Unique per email
     'Content-Type': 'application/json'
   };
   ```

2. **Check InboxMessage table:**
   ```sql
   SELECT messageId, COUNT(*) as count
   FROM inbox_messages
   GROUP BY messageId
   HAVING COUNT(*) > 1;
   -- Should return 0 rows
   ```

---

## Network & Connectivity

### Issue: "CORS policy blocked"

**Symptoms:**
- Browser console: `Access to fetch blocked by CORS policy`
- Requests fail from frontend

**Root Cause:**
- Missing CORS headers
- Wrong origin in headers

**Solutions:**

1. **Add CORS headers in API routes:**
   ```typescript
   // app/api/applications/route.ts
   export async function GET(request: NextRequest) {
     const response = NextResponse.json(data);
     
     response.headers.set('Access-Control-Allow-Origin', '*');
     response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
     response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
     
     return response;
   }
   ```

2. **Add OPTIONS handler:**
   ```typescript
   export async function OPTIONS(request: NextRequest) {
     return new NextResponse(null, {
       status: 200,
       headers: {
         'Access-Control-Allow-Origin': '*',
         'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE',
         'Access-Control-Allow-Headers': 'Authorization, Content-Type, Idempotency-Key',
       },
     });
   }
   ```

Note: Apps Script UrlFetchApp is NOT subject to CORS (server-side).

---

### Issue: "DNS resolution failed"

**Symptoms:**
- `Error: getaddrinfo ENOTFOUND`
- Cannot reach Vercel deployment

**Solutions:**

1. **Check domain is accessible:**
   ```powershell
   nslookup your-project.vercel.app
   ping your-project.vercel.app
   ```

2. **Verify deployment is live:**
   - Visit Vercel Dashboard → Deployments
   - Check "Production" deployment is successful

3. **Try alternative DNS:**
   ```powershell
   # Windows
   ipconfig /flushdns
   ```

---

## Performance Issues

### Issue: "Slow API responses"

**Diagnostic:**

```powershell
# Measure response time
Measure-Command {
  curl https://your-app.vercel.app/api/health
}
```

**Solutions:**

1. **Add database indexes** (already in schema):
   ```sql
   CREATE INDEX idx_applications_company ON applications(company);
   CREATE INDEX idx_applications_status ON applications(status);
   ```

2. **Optimize queries:**
   ```typescript
   // Use select to reduce payload
   const apps = await prisma.application.findMany({
     select: {
       id: true,
       company: true,
       title: true,
       status: true,
     },
     take: 50, // Limit results
   });
   ```

3. **Enable Next.js caching:**
   ```typescript
   export const revalidate = 60; // Cache for 60 seconds
   ```

4. **Use Vercel Edge Functions:**
   ```typescript
   export const runtime = 'edge';
   ```

---

## Quick Diagnostics

### Full System Health Check

```powershell
# Run all diagnostics
.\scripts\daily-health-check.ps1 -ApiUrl "https://your-app.vercel.app" -ApiKey "your-api-key"
```

### Manual Checks

```powershell
# 1. API Health
curl https://your-app.vercel.app/api/health

# 2. Database Connectivity
curl https://your-app.vercel.app/api/applications?limit=1 `
  -H "Authorization: Bearer YOUR_API_KEY"

# 3. Apps Script Config
# Run in Apps Script editor:
function checkConfig() {
  const props = PropertiesService.getScriptProperties();
  Logger.log('VERCEL_API_URL: ' + props.getProperty('VERCEL_API_URL'));
  Logger.log('API Key length: ' + (props.getProperty('JOBMAIL_API_KEY') || '').length);
}

# 4. Vercel Logs
vercel logs --follow

# 5. Apps Script Logs
clasp logs
```

---

## Getting Help

If issues persist:

1. **Check service status:**
   - Vercel: https://vercel-status.com
   - Neon: https://neon.tech/status
   - Google: https://www.google.com/appsstatus

2. **Review documentation:**
   - `STAGE5_DEPLOYMENT_GUIDE.md`
   - `README.md`
   - `apps-script/README_ADDON.md`

3. **Enable verbose logging:**
   ```typescript
   // lib/prisma.ts
   const prisma = new PrismaClient({
     log: ['query', 'info', 'warn', 'error'],
   });
   ```

4. **Contact support:**
   - Vercel: https://vercel.com/support
   - Neon: https://neon.tech/docs/introduction/support

---

**Last Updated:** October 10, 2025

