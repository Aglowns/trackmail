# JobMail

A Gmail Add-on that automatically tracks job applications by parsing emails and storing structured data in a centralized database.

## 🎯 Project Overview

JobMail consists of three main components:
1. **Backend API** (Next.js + Neon Postgres) - This repository
2. **Gmail Add-on** (Google Apps Script) - Stage 3
3. **Web Dashboard** (Next.js frontend) - Stage 4

## 📚 Documentation

### Core Documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system design and architecture
- **[README_BACKEND.md](./README_BACKEND.md)** - Backend API reference
- **[README_WEB.md](./README_WEB.md)** - Web dashboard guide
- **[api.types.ts](./api.types.ts)** - TypeScript API contracts
- **[prisma/schema.prisma](./prisma/schema.prisma)** - Database schema

### Deployment Guides
- **[STAGE5_DEPLOYMENT_GUIDE.md](./STAGE5_DEPLOYMENT_GUIDE.md)** - Complete production deployment guide
- **[STAGE5_TROUBLESHOOTING.md](./STAGE5_TROUBLESHOOTING.md)** - Common issues and solutions
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Vercel deployment reference
- **[SETUP_LOCAL.md](./SETUP_LOCAL.md)** - Local development setup

### Add-on Documentation
- **[apps-script/README_ADDON.md](./apps-script/README_ADDON.md)** - Gmail Add-on setup and usage
- **[apps-script/QUICKSTART.md](./apps-script/QUICKSTART.md)** - Quick add-on deployment

### Stage Completion Reports
- **[STAGE5_COMPLETE.md](./STAGE5_COMPLETE.md)** - Stage 5 completion summary
- **[PROJECT_COMPLETE.md](./PROJECT_COMPLETE.md)** - Full project completion report

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Configure database (see SETUP_LOCAL.md)
# Create .env with DATABASE_URL

# Setup database
npm run db:generate
npm run db:migrate:dev

# Start development server
npm run dev
```

Visit: `http://localhost:3000`

### Production Deployment

```powershell
# One-command deployment to Vercel + Neon
.\scripts\quick-deploy.ps1 -NeonDatabaseUrl "postgresql://..."
```

See **[STAGE5_DEPLOYMENT_GUIDE.md](./STAGE5_DEPLOYMENT_GUIDE.md)** for complete instructions.

## 🏗️ Current Status

- ✅ **Stage 1:** Architecture & System Design
- ✅ **Stage 2:** Backend API Implementation
- ✅ **Stage 3:** Gmail Add-on
- ✅ **Stage 4:** Web Dashboard
- ✅ **Stage 5:** Production Deployment (Complete! 🚀)

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Neon Postgres
- **ORM:** Prisma 5
- **Auth:** NextAuth.js
- **Validation:** Zod
- **Testing:** Vitest
- **Deployment:** Vercel

## 📋 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/applications/upsert` | POST | Bearer | Create/update application |
| `/api/applications` | GET | Bearer/Session | List applications |
| `/api/applications/by-thread/:id` | GET | Bearer/Session | Get by thread ID |
| `/api/applications/:id/status` | PATCH | Bearer/Session | Update status |
| `/api/events` | POST | Bearer/Session | Log event |

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage
```

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Neon Documentation](https://neon.tech/docs)

## 📄 License

Proprietary - JobMail Project

