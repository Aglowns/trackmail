# JobMail

A Gmail Add-on that automatically tracks job applications by parsing emails and storing structured data in a centralized database.

## 🎯 Project Overview

JobMail consists of three main components:
1. **Backend API** (Next.js + Neon Postgres) - This repository
2. **Gmail Add-on** (Google Apps Script) - Stage 3
3. **Web Dashboard** (Next.js frontend) - Stage 4

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system design and architecture
- **[README_BACKEND.md](./README_BACKEND.md)** - Backend setup and deployment guide
- **[api.types.ts](./api.types.ts)** - TypeScript API contracts
- **[prisma/schema.prisma](./prisma/schema.prisma)** - Database schema

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
npm run db:generate
npm run db:migrate:dev

# Start development server
npm run dev
```

Visit: `http://localhost:3000`

## 🏗️ Current Status

- ✅ **Stage 1:** Architecture & System Design
- ✅ **Stage 2:** Backend API Implementation (You are here)
- ⏳ **Stage 3:** Gmail Add-on
- ⏳ **Stage 4:** Web Dashboard
- ⏳ **Stage 5:** Production Deployment

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

