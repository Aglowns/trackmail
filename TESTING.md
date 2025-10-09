# Testing Guide

Complete guide for testing the JobMail backend API.

---

## 🧪 Running Tests

### All Tests

```bash
npm test
```

### Specific Test File

```bash
npm test -- tests/api/applications-upsert.test.ts
```

### Watch Mode (re-run on file changes)

```bash
npm test -- --watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Interactive UI

```bash
npm run test:ui
```

---

## 📁 Test Structure

```
tests/
├── setup.ts                              # Global test setup
├── api/
│   ├── applications-upsert.test.ts      # POST /api/applications/upsert
│   └── applications-list.test.ts        # GET /api/applications
```

---

## 🔧 Manual API Testing

### Using cURL

#### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

#### 2. Create Application (POST /api/applications/upsert)

```bash
curl -X POST http://localhost:3000/api/applications/upsert \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-JobMail-Source: gmail-addon" \
  -H "Content-Type: application/json" \
  -d '{
    "threadId": "thread_test_123",
    "lastEmailId": "email_test_123",
    "company": "Test Company",
    "title": "Software Engineer",
    "status": "APPLIED",
    "source": "GMAIL",
    "confidence": "HIGH"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "threadId": "thread_test_123",
  "company": "Test Company",
  "title": "Software Engineer",
  "status": "APPLIED",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "isNew": true
}
```

#### 3. List Applications (GET /api/applications)

```bash
curl http://localhost:3000/api/applications \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**With Filters:**
```bash
curl "http://localhost:3000/api/applications?status=APPLIED&company=Google&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### 4. Get by Thread ID

```bash
curl http://localhost:3000/api/applications/by-thread/thread_test_123 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### 5. Update Status

```bash
curl -X PATCH http://localhost:3000/api/applications/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "INTERVIEWING",
    "notes": "Phone screen scheduled"
  }'
```

#### 6. Create Event

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "EMAIL_PARSED",
    "message": "Test event",
    "metadata": {"test": true}
  }'
```

---

## 🔑 Authentication Testing

### Bearer Token (Gmail Add-on)

```bash
# Valid token
curl http://localhost:3000/api/applications \
  -H "Authorization: Bearer YOUR_API_KEY"

# Invalid token (should return 401)
curl http://localhost:3000/api/applications \
  -H "Authorization: Bearer invalid_token"

# Missing token (should return 401)
curl http://localhost:3000/api/applications
```

### Session Authentication (Web Dashboard)

Session auth requires a logged-in NextAuth session. To test:

1. Start the dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/auth/signin`
3. Sign in with GitHub/Google
4. Session cookie will be set automatically
5. Test endpoints in browser or with cookies

---

## 🧩 Postman/Insomnia Collection

### Environment Variables

Create an environment with:
```json
{
  "base_url": "http://localhost:3000",
  "api_key": "your_api_key_here"
}
```

### Collection

**Folder: Applications**

1. **Upsert Application**
   - Method: `POST`
   - URL: `{{base_url}}/api/applications/upsert`
   - Headers:
     - `Authorization: Bearer {{api_key}}`
     - `X-JobMail-Source: gmail-addon`
     - `Content-Type: application/json`
   - Body: (see cURL example above)

2. **List Applications**
   - Method: `GET`
   - URL: `{{base_url}}/api/applications`
   - Headers:
     - `Authorization: Bearer {{api_key}}`

3. **Get by Thread**
   - Method: `GET`
   - URL: `{{base_url}}/api/applications/by-thread/:threadId`
   - Headers:
     - `Authorization: Bearer {{api_key}}`

4. **Update Status**
   - Method: `PATCH`
   - URL: `{{base_url}}/api/applications/:id/status`
   - Headers:
     - `Authorization: Bearer {{api_key}}`
     - `Content-Type: application/json`
   - Body: (see cURL example above)

**Folder: Events**

5. **Create Event**
   - Method: `POST`
   - URL: `{{base_url}}/api/events`
   - Headers:
     - `Authorization: Bearer {{api_key}}`
     - `Content-Type: application/json`
   - Body: (see cURL example above)

**Folder: System**

6. **Health Check**
   - Method: `GET`
   - URL: `{{base_url}}/api/health`
   - No auth required

---

## 🔍 Testing Checklist

### Idempotency Tests

- [ ] Same `threadId` + `lastEmailId` → No update (200 OK, isNew: false)
- [ ] Same `threadId` + different `lastEmailId` → Update (200 OK, isNew: false)
- [ ] New `threadId` → Create (201 Created, isNew: true)
- [ ] Same `messageId` in Idempotency-Key → Cached response

### Authentication Tests

- [ ] Valid Bearer token → Success
- [ ] Invalid Bearer token → 401 Unauthorized
- [ ] Missing Bearer token (for protected endpoints) → 401
- [ ] Valid session → Success (web dashboard)
- [ ] No session (for session-protected endpoints) → 401

### Validation Tests

- [ ] Missing required fields → 400 Validation Error
- [ ] Invalid status enum → 400 Validation Error
- [ ] Invalid UUID format → 400 Validation Error
- [ ] Invalid date format → 400 Validation Error

### Filtering Tests

- [ ] Filter by status → Returns matching results
- [ ] Filter by company (case-insensitive) → Works
- [ ] Search with `q` parameter → Searches title, company, snippet
- [ ] Date range filter → Returns within range
- [ ] Pagination → Correct page/limit/total

### Error Handling Tests

- [ ] Non-existent resource → 404 Not Found
- [ ] Unique constraint violation → 409 Conflict
- [ ] Database connection error → 500 Internal Server Error
- [ ] Invalid JSON body → 400 Bad Request

---

## 📊 Test Coverage Goals

| Module | Target Coverage |
|--------|----------------|
| API Routes | 90%+ |
| Lib Utilities | 85%+ |
| Validators | 95%+ |
| Auth/Authz | 90%+ |
| Error Handlers | 85%+ |

---

## 🐛 Debugging Tests

### View Console Logs

```bash
npm test -- --reporter=verbose
```

### Debug Specific Test

```bash
npm test -- tests/api/applications-upsert.test.ts --reporter=verbose
```

### Clear Test Cache

```bash
npm test -- --clearCache
```

### Run in Node Inspector

```bash
node --inspect-brk node_modules/.bin/vitest
```

---

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

---

## 📝 Writing New Tests

### Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/your-endpoint/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

describe('GET /api/your-endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', async () => {
    // Mock Prisma
    vi.mocked(prisma.application.findMany).mockResolvedValue([])

    // Create request
    const request = new NextRequest('http://localhost:3000/api/your-endpoint', {
      headers: {
        'Authorization': 'Bearer test_api_key_12345',
      },
    })

    // Call handler
    const response = await GET(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(200)
    expect(data).toEqual(expect.objectContaining({
      // ...
    }))
  })
})
```

---

**Last Updated:** October 8, 2025

