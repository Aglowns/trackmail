# Quick Start: Test Phase 2 with Swagger UI

## 🚀 3-Minute Quick Test

### 1. Start Backend
```bash
uvicorn app.main:app --reload
```

### 2. Open Swagger UI
Go to: **http://localhost:8000/docs**

### 3. Get JWT Token
- Supabase Dashboard → Authentication → Users → Copy Access Token

### 4. Authorize
- Click **🔒 Authorize** button (top right)
- Enter: `Bearer YOUR_TOKEN_HERE`
- Click **Authorize** → **Close**

### 5. Test Status
- Find **`GET /v1/subscription/status`**
- Click **Try it out** → **Execute**
- Note your `applications_count`

### 6. Create Application
- Find **`POST /v1/applications`**
- Click **Try it out**
- Use this body:
```json
{
  "company": "Test Company",
  "position": "Software Engineer",
  "status": "applied",
  "location": "Remote"
}
```
- Click **Execute**
- Should return `201 Created`

### 7. Test Limit (if at 25+ apps)
- Create another application
- Should return `403 Forbidden` with:
  ```json
  {
    "detail": {
      "error": "limit_exceeded",
      "upgrade_required": true,
      "current_count": 25,
      "limit": 25
    }
  }
  ```

## ✅ Success = 403 when limit exceeded!

## 📝 Full Guide
See `SWAGGER_UI_TESTING_GUIDE.md` for detailed steps


