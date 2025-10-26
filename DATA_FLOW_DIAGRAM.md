# 📊 TrackMail Data Flow Diagram

## Complete Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          GMAIL ADD-ON                                   │
│                    (Google Apps Script)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. User opens email in Gmail                                          │
│  2. TrackMail add-on parses email                                      │
│  3. User clicks "Track This Application"                               │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ fetchEmailData()                                           │       │
│  │ • Gets email content from Gmail API                        │       │
│  │ • Extracts: subject, sender, body, etc.                    │       │
│  │ • Adds user_email: "aglonoop@gmail.com" ← KEY!            │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ ingestEmail(emailData)                                     │       │
│  │ • Calls backend API: POST /v1/ingest/email                │       │
│  │ • Includes user_email in payload                           │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                         │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            │ HTTPS POST Request
                            │ + user_email field
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       BACKEND API (Render)                              │
│                      trackmail-backend1.onrender.com                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  POST /v1/ingest/email                                                 │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ 1. Receive email_data from Gmail add-on                   │       │
│  │    {                                                       │       │
│  │      "subject": "Thank you for applying to GoFundMe",     │       │
│  │      "sender": "no-reply@us.greenhouse-mail.io",          │       │
│  │      "html_body": "...",                                  │       │
│  │      "user_email": "aglonoop@gmail.com" ← IMPORTANT!      │       │
│  │    }                                                       │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ 2. Parse email content                                     │       │
│  │    EmailParser.parse_email()                              │       │
│  │    • Extracts: company, position, status                  │       │
│  │    • Result: { "company": "GoFundMe",                     │       │
│  │               "position": "IT Administrator Intern" }      │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ 3. Look up user by email                                   │       │
│  │    user_id = app_service._get_user_by_email(              │       │
│  │        "aglonoop@gmail.com"                                │       │
│  │    )                                                       │       │
│  │    • Queries Supabase profiles table                      │       │
│  │    • Returns user UUID                                     │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ 4. Create application with user_id                         │       │
│  │    app_service.create_or_update_application({             │       │
│  │        "company": "GoFundMe",                              │       │
│  │        "position": "IT Administrator Intern",              │       │
│  │        "status": "applied",                                │       │
│  │        "user_id": "user-uuid" ← Links to user!            │       │
│  │    })                                                      │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ 5. Return success response                                 │       │
│  │    {                                                       │       │
│  │      "success": true,                                      │       │
│  │      "application_id": "app-uuid",                        │       │
│  │      "message": "Email processed successfully"            │       │
│  │    }                                                       │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                         │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            │ SQL INSERT
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                                  │
│                        (PostgreSQL)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TABLE: applications                                                   │
│  ┌─────────────────────────────────────────────────────────────┐      │
│  │ id          : "550e8400-e29b-41d4-a716-446655440000"        │      │
│  │ user_id     : "user-uuid-from-profiles" ← KEY LINK!         │      │
│  │ company     : "GoFundMe"                                    │      │
│  │ position    : "IT Administrator Intern"                     │      │
│  │ status      : "applied"                                      │      │
│  │ created_at  : "2025-01-21T10:30:00Z"                       │      │
│  │ updated_at  : "2025-01-21T10:30:00Z"                       │      │
│  │ notes       : "Created from email: Thank you for..."        │      │
│  └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  Row Level Security (RLS) Policy:                                      │
│  • Users can only SELECT applications where user_id = auth.uid()       │
│  • This ensures users only see their own applications                  │
│                                                                         │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                            │ API Query
                            │ (authenticated)
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND WEBSITE (Vercel)                          │
│                   trackmail-frontend.vercel.app                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. User logs in with: aglonoop@gmail.com                              │
│  2. Supabase Auth returns JWT token with user_id                       │
│  3. Frontend fetches applications:                                     │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ GET /v1/applications                                       │       │
│  │ Authorization: Bearer <jwt-token>                          │       │
│  │                                                            │       │
│  │ Response:                                                  │       │
│  │ {                                                          │       │
│  │   "applications": [                                        │       │
│  │     {                                                      │       │
│  │       "id": "...",                                         │       │
│  │       "company": "GoFundMe",                               │       │
│  │       "position": "IT Administrator Intern",               │       │
│  │       "status": "applied",                                 │       │
│  │       "user_id": "user-uuid"                              │       │
│  │     }                                                      │       │
│  │   ]                                                        │       │
│  │ }                                                          │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  4. Dashboard displays application card:                               │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │  📧 IT Administrator Intern                                │       │
│  │     GoFundMe                                               │       │
│  │     [Applied] ← blue badge                                 │       │
│  │                                                            │       │
│  │     Created: Jan 21, 2025                                  │       │
│  │     [Edit] [Delete]                                        │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🔑 Key Integration Points

### 1. **Gmail Add-on → Backend**
- **Critical Field:** `user_email`
- **Purpose:** Identifies which user is tracking the application
- **Format:** Email string (e.g., "aglonoop@gmail.com")

### 2. **Backend → Supabase**
- **Critical Field:** `user_id`  
- **Purpose:** Associates application with specific user in database
- **Format:** UUID string (e.g., "550e8400-e29b-41d4-a716-446655440000")

### 3. **Supabase → Frontend**
- **Critical Mechanism:** Row Level Security (RLS) + JWT Auth
- **Purpose:** Ensures users only see their own applications
- **Implementation:** RLS policy filters by `auth.uid() = user_id`

## 🎯 Data Flow Success Criteria

For the integration to work, ALL of these must be true:

- ✅ Gmail add-on sends `user_email` field
- ✅ Backend looks up user by email in `profiles` table
- ✅ Backend finds matching user and gets `user_id`
- ✅ Application created with correct `user_id`
- ✅ Application stored in Supabase `applications` table
- ✅ User signs into frontend with same email
- ✅ Frontend JWT token contains matching `user_id`
- ✅ RLS policy allows user to see their applications
- ✅ Frontend displays the tracked application

## 🔍 Debugging Checklist

If applications don't appear in frontend:

1. **Check Gmail Add-on:**
   ```javascript
   // In fetchEmailData(), verify:
   user_email: userEmail || 'aglonoop@gmail.com'
   ```

2. **Check Backend Logs (Render):**
   ```
   ✅ Found user by email aglonoop@gmail.com: user-uuid
   ✅ Application processed: app-uuid
   ```

3. **Check Supabase Database:**
   - Table: `applications`
   - Check: `user_id` matches your auth user's ID

4. **Check Frontend:**
   - Browser Console → Network tab
   - Check API response includes your application
   - Verify JWT token in Authorization header

## 📊 Example Success Log

```
[Gmail Add-on]
→ Sending: { user_email: "aglonoop@gmail.com", subject: "..." }

[Backend API]
→ Received user_email: aglonoop@gmail.com
→ Looking up user...
→ ✅ Found user: 550e8400-e29b-41d4-a716-446655440000
→ Creating application with user_id...
→ ✅ Application created: app-uuid-123

[Supabase]
→ INSERT INTO applications (user_id, company, position...)
→ ✅ Row inserted with user_id: 550e8400...

[Frontend]
→ User logged in: aglonoop@gmail.com
→ JWT token user_id: 550e8400-e29b-41d4-a716-446655440000
→ Fetching applications...
→ ✅ Found 1 application: GoFundMe - IT Administrator Intern
→ ✅ Displayed on dashboard
```

---

**This completes the full circle!** 🎉

