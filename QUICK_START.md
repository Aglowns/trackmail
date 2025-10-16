# 🚀 TrackMail API - Quick Start Guide

## ✅ Current Status

Your TrackMail backend is **fully operational**!

- ✅ Supabase connected and working
- ✅ All database tables created
- ✅ API server running
- ✅ 16 endpoints ready to use

## 🌐 Access Your API

The server should now be running. Open these URLs:

### 📖 Interactive API Documentation
**http://localhost:8000/docs**
- Test all endpoints interactively
- See request/response examples
- Try the "Test Email Parsing" endpoint (no auth needed!)

### 📚 Alternative Documentation
**http://localhost:8000/redoc**
- Clean, searchable documentation
- Better for reading and understanding

### 🏥 Health Check
**http://localhost:8000/health**
- Quick status check
- Returns: `{"status": "ok"}`

## 🧪 Test Without Authentication

### 1. Test Email Parsing (No Auth Required!)

Go to: http://localhost:8000/docs

1. Find **POST /ingest/email/test** endpoint
2. Click "Try it out"
3. Use this example:

```json
{
  "sender": "jobs@google.com",
  "subject": "Application Received - Senior Software Engineer",
  "text_body": "Thank you for applying to Google for the Senior Software Engineer position. We'll review your application and get back to you soon.",
  "html_body": null,
  "received_at": "2025-10-13T10:00:00Z"
}
```

4. Click "Execute"
5. See the parsed result:

```json
{
  "parsed": {
    "company": "Google",
    "position": "Senior Software Engineer",
    "status": "applied",
    "confidence": 0.67
  },
  "email_hash": "...",
  "would_create_duplicate": false,
  "note": "This is a test - no data was stored"
}
```

## 🔐 Test With Authentication

To test protected endpoints (applications CRUD), you need a JWT token:

### Option 1: Create Test User in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** → **"Create new user"**
4. Enter:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
5. Click **"Create user"**

### Option 2: Get JWT Token

**Method A: Use Supabase Dashboard**
1. In Supabase Dashboard → Authentication → Users
2. Click on your test user
3. Copy the **"Access Token"** (this is your JWT)

**Method B: Use JavaScript** (in browser console or Node.js)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'TestPassword123!'
})

console.log('JWT Token:', data.session.access_token)
```

### Option 3: Test in Swagger UI

1. Go to http://localhost:8000/docs
2. Click the **🔒 Authorize** button (top right)
3. Enter: `Bearer YOUR_JWT_TOKEN_HERE`
4. Click **"Authorize"**
5. Now try protected endpoints like:
   - **POST /applications** - Create an application
   - **GET /applications** - List your applications

## 📝 Example API Calls

### Create an Application

```bash
curl -X POST http://localhost:8000/applications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Google",
    "position": "Senior Software Engineer",
    "status": "applied",
    "location": "Mountain View, CA",
    "source_url": "https://careers.google.com/jobs/123",
    "notes": "Applied via LinkedIn referral"
  }'
```

### List Applications

```bash
curl -X GET "http://localhost:8000/applications?status=applied&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Ingest an Email (Creates Application Automatically)

```bash
curl -X POST http://localhost:8000/ingest/email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "jobs@microsoft.com",
    "subject": "Application Received - Product Manager",
    "text_body": "Thank you for your application to Microsoft.",
    "received_at": "2025-10-13T10:00:00Z"
  }'
```

## 🎯 Quick Test Workflow

1. **Test Parsing** (no auth)
   - Go to `/docs`
   - Try **POST /ingest/email/test**
   - See how emails are parsed

2. **Create User** (in Supabase Dashboard)
   - Add a test user
   - Get JWT token

3. **Test CRUD** (with auth)
   - Authorize in Swagger UI
   - Create an application
   - List applications
   - Update status
   - Get event history

4. **Test Ingestion** (with auth)
   - Send email to `/ingest/email`
   - Check if application was created
   - View in `/applications` list

## 🎨 What You Can Do Now

### Immediate Actions (No Setup)
- ✅ Browse API docs at `/docs`
- ✅ Test email parsing (no auth needed)
- ✅ See all available endpoints
- ✅ View request/response schemas

### With Supabase User
- ✅ Create job applications manually
- ✅ List and filter applications
- ✅ Update application status
- ✅ Track events and timeline
- ✅ Ingest emails (auto-create applications)

### Next Steps
- 📱 Build a frontend (React/Next.js)
- 📧 Create Gmail Add-on
- 🚀 Deploy to production
- 🤖 Add AI-powered parsing (GPT/Claude)
- 📊 Add analytics dashboard

## 🔥 Pro Tips

1. **Use the Test Endpoint First**
   - `/ingest/email/test` doesn't require auth
   - Test different email formats
   - See what gets extracted

2. **Check Confidence Scores**
   - Higher confidence = better extraction
   - Add manual review for low confidence

3. **Use Events for Timeline**
   - Create events for interviews, calls, etc.
   - Build a timeline view in frontend

4. **Leverage Filters**
   - Filter by status, company, position
   - Great for dashboard views

5. **Read the Comments**
   - Every function has detailed docstrings
   - Learn from the educational comments

## 📞 Need Help?

- **API Docs**: http://localhost:8000/docs
- **README**: See `README.md` for full guide
- **Setup Guide**: See `SUPABASE_SETUP.md`
- **Implementation Details**: See `IMPLEMENTATION_COMPLETE.md`

## 🎉 You're All Set!

Your TrackMail backend is running and ready to track job applications!

---

**Happy job hunting! 🚀**


