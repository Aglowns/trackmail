# 🚀 Local Setup Instructions

Your backend is almost ready! Follow these steps to get it running locally.

---

## ✅ Step 1: Create .env File

Create a file named `.env` in the root directory with this content:

```env
# Database (REQUIRED - see options below)
DATABASE_URL="postgresql://user:password@host/jobmail?sslmode=require"
DIRECT_URL="postgresql://user:password@host/jobmail?sslmode=require"

# API Keys (GENERATED - already secure!)
JOBMAIL_API_KEY="AV16iK6nMLWuK6CWYPi5YjXTAL3fjUexS+V2vx1CR/k="
NEXTAUTH_SECRET="KO5wGs+F4fWz20/ajfmQvaVmyUueYLEJmsovuDmHDYA="
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

---

## 📊 Database Options

You need a PostgreSQL database. Choose one:

### Option 1: Neon (Recommended - Free & Fast)

**Quickest setup for testing:**

1. Go to https://neon.tech
2. Sign up (free tier available)
3. Create new project: "JobMail"
4. Copy the **Connection String** from dashboard
5. Update both `DATABASE_URL` and `DIRECT_URL` in `.env`

**Example:**
```env
DATABASE_URL="postgresql://user:pass@ep-abc123.us-east-2.aws.neon.tech/jobmail?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-abc123.us-east-2.aws.neon.tech/jobmail?sslmode=require"
```

### Option 2: Docker PostgreSQL (Local)

**If you have Docker installed:**

```powershell
# Run PostgreSQL in Docker
docker run -d `
  --name jobmail-db `
  -p 5432:5432 `
  -e POSTGRES_PASSWORD=password `
  -e POSTGRES_DB=jobmail `
  postgres:15

# Then update .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/jobmail"
DIRECT_URL="postgresql://postgres:password@localhost:5432/jobmail"
```

### Option 3: Local PostgreSQL Installation

**If PostgreSQL is already installed:**

```powershell
# Create database
psql -U postgres -c "CREATE DATABASE jobmail;"

# Update .env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/jobmail"
DIRECT_URL="postgresql://postgres:your_password@localhost:5432/jobmail"
```

---

## ⚙️ Step 2: Run Database Migrations

After configuring your database URL:

```powershell
npm run db:migrate:dev
```

This will:
- Create the database schema
- Set up tables: `applications`, `events`, `inbox_messages`
- Create indexes

**Expected output:**
```
✔ Database migrations applied successfully
✔ Generated Prisma Client
```

---

## 🌱 Step 3: Seed Sample Data (Optional)

Add some test data to play with:

```powershell
npm run db:seed
```

This creates:
- 3 sample job applications (Google, Meta, Stripe)
- Related events
- Inbox message records

---

## 🚀 Step 4: Start the Server

```powershell
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.2.0
  - Local:        http://localhost:3000
  - Ready in 2.1s
```

---

## ✅ Step 5: Verify It's Working

### Test 1: Health Check

Open browser or use curl:
```powershell
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "database": "connected",
  "version": "1.0.0"
}
```

### Test 2: View Home Page

Visit: http://localhost:3000

You should see the JobMail landing page.

### Test 3: Test API Endpoint

Create a test application:

```powershell
curl -X POST http://localhost:3000/api/applications/upsert `
  -H "Authorization: Bearer AV16iK6nMLWuK6CWYPi5YjXTAL3fjUexS+V2vx1CR/k=" `
  -H "Content-Type: application/json" `
  -d '{\"threadId\":\"test_123\",\"lastEmailId\":\"email_123\",\"company\":\"Test Company\",\"title\":\"Software Engineer\",\"status\":\"APPLIED\",\"source\":\"GMAIL\",\"confidence\":\"HIGH\"}'
```

**Expected response (201 Created):**
```json
{
  "id": "uuid-here",
  "threadId": "test_123",
  "company": "Test Company",
  "status": "APPLIED",
  "isNew": true
}
```

---

## 🎉 You're All Set!

Your backend is running at: **http://localhost:3000**

**What's available:**
- ✅ 5 API endpoints (see README_BACKEND.md)
- ✅ Prisma Studio: `npm run db:studio` (database GUI)
- ✅ Tests: `npm test`
- ✅ Health check: http://localhost:3000/api/health

---

## 🐛 Troubleshooting

### "Database connection failed"
- Check your `DATABASE_URL` is correct
- Verify database is running (for Docker/local PostgreSQL)
- For Neon: Check you're not on free tier limit

### "Prisma Client not found"
```powershell
npm run db:generate
```

### "Port 3000 already in use"
Kill existing process or change port:
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
$env:PORT=3001; npm run dev
```

### "NEXTAUTH_SECRET not set" warning
This is OK for local API testing. You only need OAuth for web dashboard features.

---

## 📚 Next Steps

1. **Test the API** - See TESTING.md for comprehensive API testing guide
2. **Explore the Database** - Run `npm run db:studio` to browse data
3. **Build Gmail Add-on** - Stage 3 (coming next!)
4. **Read Documentation** - Check README_BACKEND.md for full details

---

## 💡 Quick Commands

```powershell
# Start server
npm run dev

# Run tests
npm test

# Open database GUI
npm run db:studio

# View logs (in dev server terminal)
# API requests are logged automatically

# Re-run migrations
npm run db:migrate:dev
```

---

**Need Help?** Check README_BACKEND.md or TESTING.md for detailed guides.

**Your API Key:** `AV16iK6nMLWuK6CWYPi5YjXTAL3fjUexS+V2vx1CR/k=`  
*Use this in Gmail Add-on for Bearer token authentication*



