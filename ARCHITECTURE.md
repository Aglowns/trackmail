# JobMail - Architecture & System Contract

**Version:** 1.0  
**Status:** Planning  
**Last Updated:** October 8, 2025

---

## 1. Executive Summary

**JobMail** is a Gmail Add-on that automatically parses job application emails and stores structured data in a centralized database via a Vercel-hosted API. Users can view and manage their applications through a web dashboard.

### Key Components
- **Gmail Add-on** (Google Apps Script) - Email parsing & background automation
- **Vercel API** (Next.js API Routes) - RESTful backend
- **Neon Postgres** (via Prisma ORM) - Persistent data storage
- **Web Dashboard** (Next.js) - User interface for viewing applications

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          GMAIL / GOOGLE WORKSPACE                    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Gmail Add-on (Google Apps Script)                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │    │
│  │  │  Card UI     │  │ Email Parser │  │ Time-driven      │  │    │
│  │  │  (Sidebar)   │  │              │  │ Trigger (48h)    │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────┬────────────────────────────────────────────┘
                          │
                          │ HTTPS + Bearer Token
                          │ X-JobMail-Source: gmail-addon
                          │ Idempotency-Key: <messageId>
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          VERCEL (Next.js)                            │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  API Routes (Next.js API)                                   │    │
│  │  ┌────────────────────────────────────────────────────┐    │    │
│  │  │  Middleware: Rate Limiting, Auth, Idempotency     │    │    │
│  │  └────────────────────────────────────────────────────┘    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐    │    │
│  │  │ POST upsert │  │ GET list    │  │ PATCH status   │    │    │
│  │  │ /api/       │  │ /api/       │  │ /api/          │    │    │
│  │  │ applications│  │ applications│  │ applications   │    │    │
│  │  │ /upsert     │  │             │  │ /:id/status    │    │    │
│  │  └─────────────┘  └─────────────┘  └────────────────┘    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Web Dashboard (Next.js Pages)                              │    │
│  │  - NextAuth.js (user sessions)                              │    │
│  │  - React UI for viewing/filtering applications              │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────┬────────────────────────────────────────────┘
                          │
                          │ Prisma Client
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       NEON POSTGRES                                  │
│                                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐      │
│  │ Application   │  │ Event         │  │ InboxMessage      │      │
│  │ (job apps)    │  │ (audit log)   │  │ (deduplication)   │      │
│  └───────────────┘  └───────────────┘  └───────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
1. Background Trigger (every 6h)
   Gmail Add-on → Scan last 48h emails → Parse → Upsert to API

2. User Opens Email
   Gmail Add-on → Parse current thread → Display card → Upsert to API

3. User Views Dashboard
   Browser → Next.js (NextAuth) → API Routes → Neon DB → Render UI

4. User Updates Status
   Browser → API PATCH → DB Update → Event logged
```

---

## 3. Components Breakdown

### 3.1 Gmail Add-on (Google Apps Script)

**Purpose:** Parse job emails, extract structured data, sync to API

**Key Modules:**
- **UI Module** (`addon.gs`)
  - Contextual card rendering in Gmail sidebar
  - Shows parsed job data for current thread
  - Action buttons (mark applied, view online, etc.)

- **Parser Module** (`parser.gs`)
  - Pattern matching for job emails (LinkedIn, Indeed, Greenhouse, etc.)
  - Extract: company, title, jobUrl, appliedAt, status, atsVendor
  - Confidence scoring (high/medium/low)

- **API Client** (`api.gs`)
  - POST to `/api/applications/upsert` with Bearer token
  - Idempotency-Key header (messageId)
  - Error handling & retry logic

- **Background Automation** (`triggers.gs`)
  - Time-driven trigger: runs every 6 hours
  - Scans emails from last 48 hours
  - Filters: `subject:(job OR application OR interview) newer_than:2d`
  - Batch processing with rate limiting

**Script Properties (Secure Storage):**
```
JOBMAIL_API_URL=https://your-app.vercel.app
JOBMAIL_API_KEY=sk_live_...
```

### 3.2 Vercel API (Next.js API Routes)

**Purpose:** RESTful backend for CRUD operations on applications

**Tech Stack:**
- Next.js 14+ (App Router or Pages Router)
- Prisma ORM
- NextAuth.js (for web dashboard sessions)
- Rate limiting middleware (upstash/rate-limit or similar)

**Endpoints:** (See Section 4 - API Contract)

**Middleware Chain:**
```
Request → CORS → Rate Limit → Auth → Idempotency Check → Route Handler → Response
```

**Authentication Strategy:**
- **Gmail Add-on → API:** 
  - Bearer token in `Authorization` header
  - Custom header `X-JobMail-Source: gmail-addon`
  - Validate against `process.env.GMAIL_ADDON_API_KEY`
  
- **Web Dashboard → API:**
  - NextAuth.js session cookies
  - User-scoped queries (future: multi-user support)

### 3.3 Database (Neon Postgres + Prisma)

**Purpose:** Persistent storage with relational integrity

**Key Features:**
- Serverless Postgres (instant scaling)
- Connection pooling via Prisma
- Automatic migrations
- Unique constraints for deduplication

**Models:** (See Section 5 - Database Schema)

---

## 4. API Contract

All endpoints return JSON. Error responses follow format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 4.1 POST /api/applications/upsert

**Purpose:** Create or update application (idempotent)

**Auth:** Bearer token + `X-JobMail-Source: gmail-addon`

**Headers:**
```
Authorization: Bearer <API_KEY>
X-JobMail-Source: gmail-addon
Idempotency-Key: <messageId>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  threadId: string;           // Gmail thread ID (unique constraint)
  lastEmailId: string;        // Latest email ID in thread
  company: string;
  title: string;
  jobUrl?: string | null;
  appliedAt?: Date | string;  // ISO 8601
  status: "new" | "applied" | "interviewing" | "offered" | "rejected" | "withdrawn";
  source: "gmail" | "manual"; // Always "gmail" from add-on
  confidence: "high" | "medium" | "low";
  atsVendor?: string | null;  // e.g., "greenhouse", "lever"
  companyDomain?: string | null;
  rawSubject?: string;
  rawSnippet?: string;
}
```

**Response:** `200 OK` or `201 Created`
```typescript
{
  id: string;                 // UUID
  threadId: string;
  company: string;
  title: string;
  status: string;
  createdAt: string;          // ISO 8601
  updatedAt: string;
  isNew: boolean;             // true if created, false if updated
}
```

**Logic:**
1. Check `Idempotency-Key` cache (Redis or DB) to prevent duplicate processing
2. Find existing application by `threadId`
3. If exists: update if `lastEmailId` is newer, else return existing
4. If new: create application
5. Log event to `Event` table
6. Store `messageId` in `InboxMessage` for deduplication

---

### 4.2 GET /api/applications

**Purpose:** List applications with filtering & pagination

**Auth:** Bearer token OR NextAuth session

**Query Parameters:**
```
status?=applied              // Filter by status
company?=Google              // Partial match (case-insensitive)
q?=engineer                  // Search title, company, or snippet
dateFrom?=2025-01-01         // ISO date
dateTo?=2025-12-31           // ISO date
page?=1                      // Default: 1
limit?=20                    // Default: 20, max: 100
sortBy?=appliedAt            // appliedAt | updatedAt | createdAt
sortOrder?=desc              // asc | desc
```

**Response:** `200 OK`
```typescript
{
  data: Application[];        // Array of application objects
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### 4.3 GET /api/applications/by-thread/:threadId

**Purpose:** Get single application by Gmail thread ID

**Auth:** Bearer token OR NextAuth session

**Response:** `200 OK` or `404 Not Found`
```typescript
{
  id: string;
  threadId: string;
  lastEmailId: string;
  company: string;
  title: string;
  jobUrl: string | null;
  appliedAt: string | null;
  status: string;
  source: string;
  confidence: string;
  atsVendor: string | null;
  companyDomain: string | null;
  rawSubject: string | null;
  rawSnippet: string | null;
  createdAt: string;
  updatedAt: string;
  events: Event[];            // Related events
}
```

---

### 4.4 PATCH /api/applications/:id/status

**Purpose:** Update application status

**Auth:** Bearer token OR NextAuth session

**Request Body:**
```typescript
{
  status: "applied" | "interviewing" | "offered" | "rejected" | "withdrawn";
  notes?: string;             // Optional note for event log
}
```

**Response:** `200 OK`
```typescript
{
  id: string;
  status: string;
  updatedAt: string;
}
```

**Side Effect:** Creates an `Event` record with type `status_changed`

---

### 4.5 POST /api/events (Optional)

**Purpose:** Manual event logging for debugging/auditing

**Auth:** Bearer token

**Request Body:**
```typescript
{
  applicationId?: string;     // Optional link to application
  type: "email_parsed" | "upsert" | "status_changed" | "error";
  metadata?: Record<string, any>;
  message?: string;
}
```

**Response:** `201 Created`
```typescript
{
  id: string;
  type: string;
  createdAt: string;
}
```

---

## 5. Database Schema (Prisma)

See `prisma/schema.prisma` for full schema definition.

### 5.1 Models Overview

**Application**
- Primary entity storing parsed job data
- Unique constraint on `threadId` (Gmail thread ID)
- Status field with enum
- Timestamps for audit trail

**Event**
- Audit log for all application changes
- Links to `Application` via foreign key
- Stores type + metadata JSON

**InboxMessage**
- Deduplication table
- Stores processed `messageId` to prevent re-parsing
- Unique constraint on `messageId`

---

## 6. Security Architecture

### 6.1 Authentication Layers

| Client | Method | Implementation |
|--------|--------|----------------|
| Gmail Add-on | Bearer Token | `Authorization: Bearer <API_KEY>` + custom header `X-JobMail-Source: gmail-addon` |
| Web Dashboard | Session Cookie | NextAuth.js with JWT or database sessions |
| Future: Mobile App | OAuth2 / JWT | NextAuth.js providers |

### 6.2 API Key Management

**Environment Variables:**
```env
# Vercel Environment Variables
GMAIL_ADDON_API_KEY=sk_live_xxxxxxxxxxxxx  # Used by add-on
DATABASE_URL=postgresql://...              # Neon connection string
NEXTAUTH_SECRET=...                        # NextAuth.js secret
NEXTAUTH_URL=https://your-app.vercel.app
```

**Apps Script Properties:**
```javascript
// Set via: Script Properties (secure)
JOBMAIL_API_URL=https://your-app.vercel.app
JOBMAIL_API_KEY=sk_live_xxxxxxxxxxxxx
```

**Security Best Practices:**
- API key rotated quarterly
- Rate limiting: 100 requests/minute per source
- HTTPS only (enforced by Vercel & Apps Script)
- CORS restricted to add-on domain

### 6.3 Idempotency & Replay Protection

**Strategy:** Use `Idempotency-Key` header with Gmail `messageId`

**Flow:**
1. Add-on sends: `Idempotency-Key: <messageId>`
2. API checks `InboxMessage` table for existing `messageId`
3. If exists: return cached response (no duplicate processing)
4. If new: process request, store `messageId`, cache response for 24h

**Benefits:**
- Prevents duplicate applications from re-processing same email
- Safe retries on network failures
- Consistent state even with background trigger overlaps

### 6.4 Rate Limiting

**Rules:**
- **Gmail Add-on:** 100 requests/minute per API key
- **Web Dashboard:** 1000 requests/minute per user session
- **Global:** 10,000 requests/minute across all sources

**Implementation:** Redis-backed rate limiter (Upstash) or Vercel Edge Config

**Response on Limit Exceeded:** `429 Too Many Requests`
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## 7. Parsing Strategy

### 7.1 Email Patterns

JobMail recognizes job emails from:

| Source | Patterns | Fields Extracted |
|--------|----------|------------------|
| **LinkedIn** | `sender:jobs-noreply@linkedin.com` | company, title, jobUrl, appliedAt |
| **Indeed** | `sender:noreply@indeed.com` | company, title, jobUrl |
| **Greenhouse** | `body contains "Greenhouse"`, domain parsing | company, title, jobUrl, atsVendor |
| **Lever** | `body contains "Lever"`, domain parsing | company, title, jobUrl, atsVendor |
| **Workday** | `body contains "Workday"`, domain parsing | company, title, atsVendor |
| **Generic** | Subject patterns: `job`, `application`, `interview` | company (from sender), title (from subject) |

### 7.2 Confidence Scoring

| Score | Criteria |
|-------|----------|
| **High** | Known ATS vendor + company domain + jobUrl extracted |
| **Medium** | Partial match (e.g., title + company but no URL) |
| **Low** | Generic pattern match only |

### 7.3 Status Inference

| Email Content | Inferred Status |
|---------------|----------------|
| "Your application has been received" | `applied` |
| "Schedule an interview" | `interviewing` |
| "We'd like to offer you" | `offered` |
| "Unfortunately" OR "not moving forward" | `rejected` |
| Default (new parse) | `new` |

---

## 8. Background Automation

### 8.1 Time-Driven Trigger

**Schedule:** Every 6 hours (4x daily)  
**Query:** `subject:(job OR application OR interview) newer_than:2d`  
**Batch Size:** 50 emails per run (to avoid timeout)

**Pseudo-Flow:**
```
1. Trigger fires at 00:00, 06:00, 12:00, 18:00 UTC
2. Get all emails from last 48 hours matching filter
3. For each email:
   a. Check if messageId already processed (InboxMessage table)
   b. If processed, skip
   c. If new, parse and upsert via API
   d. Sleep 100ms (rate limiting)
4. Log summary to Event table (e.g., "Processed 23 emails, 5 new applications")
```

**Error Handling:**
- Individual email failures don't stop batch
- Errors logged to `Event` table with type `error`
- Retry logic: if API returns 5xx, retry up to 3x with exponential backoff

---

## 9. Acceptance Criteria

### Phase 1: Core Infrastructure ✅
- [ ] Neon Postgres database provisioned
- [ ] Prisma schema defined with migrations
- [ ] Vercel project created with environment variables
- [ ] POST `/api/applications/upsert` endpoint functional
- [ ] GET `/api/applications` endpoint functional
- [ ] Bearer token authentication working
- [ ] Idempotency middleware implemented

### Phase 2: Gmail Add-on (Basic)
- [ ] Apps Script project initialized
- [ ] Card UI renders in Gmail sidebar
- [ ] Parser extracts LinkedIn job emails (high confidence)
- [ ] Parser extracts Indeed job emails (medium confidence)
- [ ] API client successfully upserts to Vercel API
- [ ] Error handling displays user-friendly messages

### Phase 3: Background Automation
- [ ] Time-driven trigger installed (6h interval)
- [ ] Trigger scans last 48h of emails
- [ ] Batch processing respects rate limits
- [ ] Deduplication prevents re-processing
- [ ] Summary events logged after each run

### Phase 4: Advanced Parsing
- [ ] Greenhouse emails parsed
- [ ] Lever emails parsed
- [ ] Workday emails parsed
- [ ] Generic job emails parsed (low confidence)
- [ ] Status inference rules applied
- [ ] Company domain extraction working

### Phase 5: Web Dashboard
- [ ] NextAuth.js authentication configured
- [ ] List view with filters (status, company, date range)
- [ ] Detail view for single application
- [ ] Status update UI (dropdown + save)
- [ ] Search functionality (q parameter)
- [ ] Pagination working

### Phase 6: Polish & Production
- [ ] Rate limiting tested under load
- [ ] Error monitoring (Sentry or similar)
- [ ] API documentation published (Swagger/OpenAPI)
- [ ] User onboarding flow (install add-on → authorize)
- [ ] Performance: API responses < 200ms p95
- [ ] Security audit passed (OWASP checklist)

---

## 10. Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Next.js | 14+ | Web dashboard |
| **Frontend** | React | 18+ | UI components |
| **Frontend** | TailwindCSS | 3+ | Styling |
| **Backend** | Next.js API Routes | 14+ | RESTful API |
| **Backend** | Prisma | 5+ | ORM |
| **Database** | Neon Postgres | Latest | Serverless DB |
| **Auth (Web)** | NextAuth.js | 4+ | User sessions |
| **Auth (Add-on)** | Bearer Token | N/A | API key auth |
| **Add-on** | Google Apps Script | V8 Runtime | Gmail integration |
| **Hosting** | Vercel | Latest | Serverless deployment |
| **Rate Limiting** | Upstash Redis | Latest | Distributed rate limiting |

---

## 11. Deployment Checklist

### Prerequisites
- [ ] Neon account created
- [ ] Vercel account created
- [ ] Google Cloud project created (for Apps Script)
- [ ] Domain configured (optional, for NextAuth)

### Environment Setup
```env
# .env.local (Vercel)
DATABASE_URL="postgresql://..."
GMAIL_ADDON_API_KEY="sk_live_..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://your-app.vercel.app"
UPSTASH_REDIS_URL="..."
```

### Deployment Steps
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy main branch
5. Run Prisma migrations: `npx prisma migrate deploy`
6. Deploy Apps Script add-on
7. Install add-on in test Gmail account
8. Verify end-to-end flow

---

## 12. Future Enhancements (Out of Scope for V1)

- **Multi-user support:** Each user has isolated applications
- **Email notifications:** Remind user of pending interviews
- **Analytics dashboard:** Charts for application funnel
- **Browser extension:** Parse job postings directly on company websites
- **Mobile app:** React Native app for on-the-go management
- **AI-powered insights:** GPT-4 summarization of job descriptions
- **Calendar integration:** Auto-schedule interview prep time
- **Resume versioning:** Track which resume was sent for each application

---

## 13. Open Questions & Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Single-user vs multi-user? | **Single-user for V1** | Simplifies auth, can add later |
| How to handle email threads with multiple emails? | **Update if lastEmailId is newer** | Preserves history, updates status |
| Should we store raw email HTML? | **No, only subject + snippet** | Privacy + storage concerns |
| How to handle false positives? | **Allow manual delete/hide** | User can dismiss non-job emails |
| Backup strategy? | **Neon auto-backups + weekly exports** | Neon handles point-in-time restore |

---

## 14. Contact & Maintenance

**Architect:** Senior Architect  
**Project Start:** October 8, 2025  
**Expected V1 Delivery:** TBD

**Change Log:**
- 2025-10-08: Initial architecture document created

---

*End of Architecture Document*

