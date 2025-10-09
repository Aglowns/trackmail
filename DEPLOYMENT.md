# Deployment Guide

Step-by-step guide for deploying JobMail backend to Vercel with Neon Postgres.

---

## 🎯 Prerequisites

- ✅ GitHub account
- ✅ Vercel account ([sign up](https://vercel.com/signup))
- ✅ Neon account ([sign up](https://neon.tech))
- ✅ Code pushed to GitHub repository

---

## 📋 Deployment Steps

### Step 1: Set Up Neon Database

1. **Create Neon Project**
   - Go to [neon.tech](https://neon.tech)
   - Click "Create Project"
   - Choose region (closest to your users)
   - Project name: `jobmail`

2. **Get Connection Strings**
   - Navigate to **Dashboard → Connection Details**
   - Copy two connection strings:
     - **Pooled connection** (for `DATABASE_URL`)
     - **Direct connection** (for `DIRECT_URL`)

3. **Connection String Format**
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

---

### Step 2: Prepare Repository

1. **Ensure all files are committed**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Verify package.json scripts**
   - ✅ `build` script exists
   - ✅ `start` script exists
   - ✅ `postinstall` runs `prisma generate`

---

### Step 3: Deploy to Vercel

1. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

2. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build` (auto-filled)
   - **Install Command:** `npm install` (auto-filled)
   - **Output Directory:** `.next` (auto-filled)

3. **Set Environment Variables**

   Click "Environment Variables" and add:

   ```env
   # Database
   DATABASE_URL=postgresql://...neon.tech/jobmail?sslmode=require
   DIRECT_URL=postgresql://...neon.tech/jobmail?sslmode=require
   
   # API Key (generate with: openssl rand -base64 32)
   JOBMAIL_API_KEY=sk_live_YOUR_SECURE_KEY_HERE
   
   # NextAuth
   NEXTAUTH_SECRET=YOUR_SECRET_HERE
   NEXTAUTH_URL=https://your-app.vercel.app
   
   # OAuth (optional for initial deployment)
   GITHUB_ID=your_github_id
   GITHUB_SECRET=your_github_secret
   ```

   **Important:** For production, ensure:
   - Use **Production** environment
   - All values are filled
   - `NEXTAUTH_URL` matches your Vercel domain

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

---

### Step 4: Run Database Migrations

After first deployment:

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Link to project
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy
```

**Option B: Using Vercel Dashboard**

1. Go to project → **Settings → Functions**
2. Click on any function → **Console**
3. Run: `npx prisma migrate deploy`

**Option C: Local with production DATABASE_URL**

```bash
# Temporarily set production DATABASE_URL
export DATABASE_URL="postgresql://...production..."
npx prisma migrate deploy
```

---

### Step 5: Verify Deployment

1. **Health Check**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "version": "1.0.0"
   }
   ```

2. **Test API Endpoint**
   ```bash
   curl -X POST https://your-app.vercel.app/api/applications/upsert \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"threadId":"test","lastEmailId":"test","company":"Test","title":"Test","status":"NEW","source":"GMAIL","confidence":"LOW"}'
   ```

3. **Check Logs**
   - Vercel Dashboard → Project → Deployments
   - Click on latest deployment
   - View **Functions** tab for logs

---

### Step 6: Configure OAuth (for Web Dashboard)

#### GitHub OAuth

1. **Create OAuth App**
   - Go to: https://github.com/settings/developers
   - Click "New OAuth App"
   - Settings:
     - **Application name:** JobMail
     - **Homepage URL:** `https://your-app.vercel.app`
     - **Authorization callback URL:** `https://your-app.vercel.app/api/auth/callback/github`

2. **Update Environment Variables**
   - Copy **Client ID** and **Client Secret**
   - Add to Vercel: Settings → Environment Variables
     - `GITHUB_ID=xxx`
     - `GITHUB_SECRET=xxx`

3. **Redeploy**
   - Vercel auto-deploys on env var changes
   - Or manually: **Deployments → ... → Redeploy**

#### Google OAuth

1. **Create OAuth Client**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create project (if needed)
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

2. **Update Environment Variables**
   - Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel

---

## 🔄 Continuous Deployment

Vercel automatically deploys on every push to `main` branch.

### Automatic Deployments

```bash
git add .
git commit -m "Update feature"
git push origin main
# ✅ Vercel auto-deploys
```

### Preview Deployments

```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
# ✅ Vercel creates preview URL
```

---

## 🗄️ Database Migrations in Production

### New Migration

1. **Create migration locally**
   ```bash
   npx prisma migrate dev --name add_new_field
   ```

2. **Commit and push**
   ```bash
   git add .
   git commit -m "Add database migration"
   git push origin main
   ```

3. **Run migration on production**
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

---

## 📊 Monitoring

### Vercel Dashboard

- **Deployments:** View build logs
- **Functions:** View API logs in real-time
- **Analytics:** Traffic and performance metrics

### External Monitoring

Consider adding:
- **Sentry** - Error tracking
- **LogDNA/Datadog** - Log aggregation
- **Uptime Robot** - Uptime monitoring

Health check URL: `https://your-app.vercel.app/api/health`

---

## 🔒 Security Checklist

- [ ] `JOBMAIL_API_KEY` is strong (32+ characters)
- [ ] `NEXTAUTH_SECRET` is unique and secure
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] Environment variables set to **Production** environment
- [ ] OAuth redirect URIs match production domain
- [ ] No secrets committed to Git (check with `git log -S 'secret'`)

---

## 🚨 Rollback

If deployment fails:

1. **Rollback via Dashboard**
   - Go to: Deployments → Previous successful deployment
   - Click "..." → "Promote to Production"

2. **Rollback via CLI**
   ```bash
   vercel rollback
   ```

---

## 🐛 Troubleshooting

### Build Fails

**Error:** `Prisma Client not generated`

**Fix:**
- Ensure `postinstall` script in `package.json` runs `prisma generate`
- Check build logs for Prisma errors

---

### Database Connection Fails

**Error:** `Can't reach database server`

**Fix:**
- Verify `DATABASE_URL` in Vercel env vars
- Check Neon database is running
- Ensure connection string includes `?sslmode=require`

---

### NextAuth Errors

**Error:** `NEXTAUTH_URL is not set`

**Fix:**
- Add `NEXTAUTH_URL=https://your-app.vercel.app` to Vercel env vars
- Redeploy

---

### API Key Not Working

**Error:** `Invalid API key`

**Fix:**
- Verify `JOBMAIL_API_KEY` matches in Vercel and Gmail Add-on
- Check for trailing spaces or newlines
- Regenerate if needed: `openssl rand -base64 32`

---

## 📈 Scaling

Vercel scales automatically. For heavy usage:

1. **Upgrade Vercel Plan**
   - Pro: $20/month (increased limits)
   - Enterprise: Custom pricing

2. **Optimize Database**
   - Use connection pooling (Neon does this by default)
   - Add indexes for common queries
   - Consider read replicas for high traffic

3. **Add Caching**
   - Redis (Upstash) for idempotency cache
   - CDN for static assets

---

## 🔄 Environment Strategy

| Environment | Branch | Database | OAuth | Purpose |
|-------------|--------|----------|-------|---------|
| Development | `*` | Local/Dev Neon | Localhost | Local dev |
| Preview | `feature/*` | Preview Neon | Preview URLs | Testing |
| Production | `main` | Production Neon | Production URLs | Live |

---

## 📝 Post-Deployment Checklist

- [ ] Health check returns `status: ok`
- [ ] Can create application via API
- [ ] Can list applications
- [ ] OAuth sign-in works
- [ ] Database migrations applied
- [ ] Logs show no errors
- [ ] Domain/SSL configured (if custom domain)
- [ ] Monitoring set up
- [ ] Team members have access
- [ ] Documentation updated with production URLs

---

**Last Updated:** October 8, 2025  
**Deployment Target:** Vercel + Neon  
**Estimated Deploy Time:** 5-10 minutes

