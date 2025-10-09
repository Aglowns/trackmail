# JobMail Backend - Setup & Deployment Guide

**Version:** 1.0  
**Stack:** Next.js 14 (App Router) + Prisma + Neon Postgres  
**Auth:** NextAuth (sessions) + Bearer token (API key)

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Database Setup (Neon)](#database-setup-neon)
5. [Environment Variables](#environment-variables)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [API Documentation](#api-documentation)
9. [Deployment to Vercel](#deployment-to-vercel)
10. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

```bash
# 1. Clone and install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Configure .env with your Neon database URL and API key

# 4. Generate Prisma client
npm run db:generate

# 5. Run database migrations
npm run db:migrate:dev

# 6. Start development server
npm run dev

# 7. Visit http://localhost:3000
```

---

## 📦 Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Neon Account**: [https://neon.tech](https://neon.tech)
- **Vercel Account**: [https://vercel.com](https://vercel.com) (for deployment)
- **GitHub/Google OAuth App**: For NextAuth (optional for local dev)

---

## 🛠️ Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14+
- Prisma 5+
- NextAuth 4+
- Zod (validation)
- Vitest (testing)

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials (see [Environment Variables](#environment-variables) section).

### 3. Generate Prisma Client

```bash
npm run db:generate
```

This generates the Prisma Client based on your schema in `prisma/schema.prisma`.

---

## 🗄️ Database Setup (Neon)

### Create Neon Project

1. Sign up at [https://neon.tech](https://neon.tech)
2. Create a new project (select region close to your users)
3. Copy the **Connection String** from the dashboard

### Connection String Format

```
postgresql://user:password@ep-example-123456.us-east-2.aws.neon.tech/jobmail?sslmode=require
```

### Set Database URLs in .env

```env
DATABASE_URL="postgresql://..."  # For Prisma queries (uses pooling)
DIRECT_URL="postgresql://..."    # For migrations (direct connection)
```

> **Note:** Neon provides both pooled and direct connection strings. Use the pooled URL for `DATABASE_URL` and direct URL for `DIRECT_URL`.

### Run Migrations

```bash
# Create and apply migration
npm run db:migrate:dev

# Or for production
npm run db:migrate:deploy
```

This creates 3 tables:
- `applications` - Job application records
- `events` - Audit log
- `inbox_messages` - Deduplication table

### Verify Database

```bash
# Open Prisma Studio (GUI for database)
npm run db:studio
```

Visit `http://localhost:5555` to browse your data.

---

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```env
# ============================================================================
# DATABASE (Neon Postgres)
# ============================================================================
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host/dbname?sslmode=require"

# ============================================================================
# JOBMAIL API KEY (for Gmail Add-on)
# ============================================================================
# Generate a secure random key:
# openssl rand -base64 32
JOBMAIL_API_KEY="sk_live_your_very_long_random_secret_key_here"

# ============================================================================
# NEXTAUTH (Web Dashboard Sessions)
# ============================================================================
# Generate secret:
# openssl rand -base64 32
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# ============================================================================
# OAUTH PROVIDERS (choose one or both)
# ============================================================================

# GitHub OAuth App
# Create at: https://github.com/settings/developers
# Authorization callback URL: http://localhost:3000/api/auth/callback/github
GITHUB_ID="your_github_oauth_app_id"
GITHUB_SECRET="your_github_oauth_app_secret"

# Google OAuth 2.0
# Create at: https://console.cloud.google.com/apis/credentials
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# ============================================================================
# NODE ENVIRONMENT
# ============================================================================
NODE_ENV="development"
```

### Generate Secure Keys

```bash
# API Key
openssl rand -base64 32

# NextAuth Secret
openssl rand -base64 32
```

### OAuth Setup (Optional for Local Dev)

**GitHub OAuth:**
1. Go to: https://github.com/settings/developers
2. Create New OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env`

**Google OAuth:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Client Secret to `.env`

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Visit: `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:coverage` | Generate test coverage report |
| `npm run db:migrate:dev` | Run database migrations (dev) |
| `npm run db:migrate:deploy` | Run database migrations (prod) |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Open Prisma Studio |

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- tests/api/applications-upsert.test.ts
```

### Watch Mode

```bash
npm test -- --watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Test Structure

```
tests/
├── setup.ts                              # Vitest global setup
├── api/
│   ├── applications-upsert.test.ts      # POST /api/applications/upsert
│   └── applications-list.test.ts        # GET /api/applications
```

---

## 📚 API Documentation

### Base URL

- **Local:** `http://localhost:3000`
- **Production:** `https://your-app.vercel.app`

### Authentication

**Two authentication methods:**

1. **Bearer Token** (for Gmail Add-on)
   ```
   Authorization: Bearer sk_live_your_api_key
   X-JobMail-Source: gmail-addon
   ```

2. **Session Cookie** (for web dashboard)
   ```
   Cookie: next-auth.session-token=...
   ```

### Endpoints

#### 1. POST /api/applications/upsert

**Auth:** Bearer token  
**Idempotency:** By `threadId` + `lastEmailId`

**Request:**
```json
{
  "threadId": "thread_abc123",
  "lastEmailId": "msg_xyz789",
  "company": "Acme Corp",
  "title": "Senior Software Engineer",
  "jobUrl": "https://acme.com/jobs/123",
  "appliedAt": "2025-01-15T10:30:00Z",
  "status": "APPLIED",
  "source": "GMAIL",
  "confidence": "HIGH",
  "atsVendor": "greenhouse",
  "companyDomain": "acme.com",
  "rawSubject": "Application Received - Senior Software Engineer",
  "rawSnippet": "Thank you for applying...",
  "messageId": "gmail_msg_id_123"
}
```

**Response:** `201 Created` or `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "threadId": "thread_abc123",
  "company": "Acme Corp",
  "title": "Senior Software Engineer",
  "status": "APPLIED",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "isNew": true
}
```

#### 2. GET /api/applications

**Auth:** Bearer token OR Session

**Query Parameters:**
- `status` - Filter by status (e.g., `APPLIED`, `INTERVIEWING`)
- `company` - Filter by company (partial match)
- `q` - Full-text search across title, company, snippet
- `dateFrom` - ISO date (e.g., `2025-01-01`)
- `dateTo` - ISO date
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)
- `sortBy` - Sort field: `appliedAt`, `updatedAt`, `createdAt` (default: `createdAt`)
- `sortOrder` - Sort order: `asc`, `desc` (default: `desc`)

**Example:**
```
GET /api/applications?status=APPLIED&company=Acme&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "threadId": "thread_abc123",
      "company": "Acme Corp",
      "title": "Senior Software Engineer",
      "status": "APPLIED",
      "appliedAt": "2025-01-15T10:30:00Z",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 3. GET /api/applications/by-thread/:threadId

**Auth:** Bearer token OR Session

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "threadId": "thread_abc123",
  "company": "Acme Corp",
  "title": "Senior Software Engineer",
  ...
  "events": [
    {
      "id": "...",
      "type": "APPLICATION_CREATED",
      "message": "Created from email msg_xyz789",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### 4. PATCH /api/applications/:id/status

**Auth:** Bearer token OR Session

**Request:**
```json
{
  "status": "INTERVIEWING",
  "notes": "Phone screen scheduled for next week"
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "INTERVIEWING",
  "updatedAt": "2025-01-16T14:00:00Z"
}
```

#### 5. POST /api/events

**Auth:** Bearer token OR Session

**Request:**
```json
{
  "applicationId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "EMAIL_PARSED",
  "message": "Successfully parsed LinkedIn job email",
  "metadata": {
    "source": "linkedin",
    "confidence": "high"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "...",
  "type": "EMAIL_PARSED",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes:**
- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `VALIDATION_ERROR` (400) - Invalid request body
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Unique constraint violation
- `INTERNAL_SERVER_ERROR` (500) - Server error

---

## 🚀 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/jobmail.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### 3. Set Environment Variables

In Vercel dashboard, go to **Settings → Environment Variables** and add:

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JOBMAIL_API_KEY=sk_live_...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app
GITHUB_ID=...
GITHUB_SECRET=...
```

### 4. Deploy

Vercel will automatically deploy on every push to `main`.

### 5. Run Migrations on Production

After first deployment, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy

# Or manually via Vercel Dashboard → Functions → Console
```

### 6. Update OAuth Redirect URIs

Update your GitHub/Google OAuth apps with production callback URLs:
- `https://your-app.vercel.app/api/auth/callback/github`
- `https://your-app.vercel.app/api/auth/callback/google`

---

## 🐛 Troubleshooting

### Issue: Prisma Client not generated

**Solution:**
```bash
npm run db:generate
```

### Issue: Database connection failed

**Check:**
1. `DATABASE_URL` is correct in `.env`
2. Neon database is running
3. IP whitelist is disabled (or your IP is whitelisted)
4. Connection string includes `?sslmode=require`

### Issue: NextAuth session not working

**Check:**
1. `NEXTAUTH_SECRET` is set
2. `NEXTAUTH_URL` matches your domain
3. OAuth app credentials are correct
4. OAuth redirect URIs match your domain

### Issue: Bearer token authentication fails

**Check:**
1. `JOBMAIL_API_KEY` is set in `.env`
2. Request includes: `Authorization: Bearer <API_KEY>`
3. API key matches exactly (no extra spaces)

### Issue: TypeScript errors

**Solution:**
```bash
# Regenerate types
npm run db:generate

# Restart TypeScript server in VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: Tests failing

**Solution:**
```bash
# Clear cache and re-run
npm test -- --clearCache
npm test
```

### View Logs

**Local:**
```bash
# Terminal where npm run dev is running
```

**Vercel:**
1. Go to Vercel dashboard
2. Select your project
3. Click on deployment
4. View "Functions" tab for API route logs

---

## 📝 Notes

### Database Migrations

- **Development:** Use `npm run db:migrate:dev` (interactive, creates migration files)
- **Production:** Use `npm run db:migrate:deploy` (non-interactive)

### Prisma Schema Changes

After modifying `prisma/schema.prisma`:
1. Generate new client: `npm run db:generate`
2. Create migration: `npm run db:migrate:dev --name your_migration_name`
3. Push to production: Deploy to Vercel, then run `npx prisma migrate deploy`

### API Key Rotation

To rotate the `JOBMAIL_API_KEY`:
1. Generate new key: `openssl rand -base64 32`
2. Update `JOBMAIL_API_KEY` in Vercel dashboard
3. Update key in Gmail Add-on Script Properties
4. Redeploy Vercel app

### Backup Strategy

Neon provides automatic backups:
- Point-in-time restore (last 7 days on free tier)
- Branch database for testing
- Manual exports via Prisma Studio or `pg_dump`

---

## 🤝 Contributing

This is a Stage 2 implementation. For future stages:
- **Stage 3:** Gmail Add-on (Apps Script)
- **Stage 4:** Web dashboard UI
- **Stage 5:** Advanced features (analytics, AI insights)

---

## 📄 License

Proprietary - JobMail Project

---

## 🆘 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Check API types in [api.types.ts](./api.types.ts)
4. Review Prisma schema in [prisma/schema.prisma](./prisma/schema.prisma)

---

**Last Updated:** October 8, 2025  
**Backend Version:** 1.0.0  
**Next.js Version:** 14+  
**Prisma Version:** 5+

