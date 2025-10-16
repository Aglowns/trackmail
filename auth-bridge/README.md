# Auth Bridge Service

Authentication bridge between Gmail Add-on and Supabase.

## Overview

The Gmail Add-on runs in Apps Script context and cannot directly use browser-based Supabase Auth. This service provides a bridge:

1. User opens this service in a browser and signs in with Supabase
2. Service creates a session and returns a session handle
3. User pastes the session handle into the Gmail Add-on
4. Add-on exchanges the session handle for JWT tokens as needed

## Setup

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Run the service:**
   ```bash
   uvicorn main:app --reload --port 8001
   ```

4. **Open in browser:**
   ```
   http://localhost:8001
   ```

### Production Deployment

#### Option 1: Docker

```bash
docker build -t auth-bridge .
docker run -p 8001:8001 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_ANON_KEY=your-key \
  auth-bridge
```

#### Option 2: Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

#### Option 3: Cloud Run

```bash
gcloud run deploy auth-bridge \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=your-url,SUPABASE_ANON_KEY=your-key
```

## API Endpoints

### `GET /`
Landing page with sign-in UI. Opens in browser for user authentication.

### `POST /session/start`
Create a new session after Supabase authentication.

**Request:**
```json
{
  "access_token": "supabase-jwt-token",
  "refresh_token": "supabase-refresh-token",
  "user_email": "user@example.com",
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "session_handle": "random-secure-handle",
  "expires_at": "2025-10-13T12:00:00Z"
}
```

### `GET /token?handle=<handle>`
Exchange session handle for a fresh JWT token.

**Response:**
```json
{
  "access_token": "jwt-token",
  "expires_in": 300,
  "user_email": "user@example.com"
}
```

### `DELETE /session?handle=<handle>`
End a session (sign out).

### `GET /health`
Health check endpoint.

## Security Features

- **Session handles:** Random 32-byte tokens, not guessable
- **TTL:** Sessions expire after 1 hour (configurable)
- **Rate limiting:** Max 20 token requests per minute per session
- **Short-lived tokens:** JWT tokens valid for 5 minutes only
- **In-memory storage:** Sessions cleared on restart (use Redis for production)

## Production Considerations

1. **Redis for session storage:** Replace in-memory dict with Redis for multi-instance deployments
2. **HTTPS only:** Always use HTTPS in production
3. **Environment variables:** Never commit .env file
4. **Monitoring:** Add logging and error tracking (Sentry, etc.)
5. **Rate limiting:** Consider using nginx or a service like Cloudflare
6. **Token refresh:** Implement automatic token refresh before expiry

## Integration with Gmail Add-on

The Gmail Add-on will:

1. Show a "Sign In" button that opens this service in a new window
2. User completes sign-in and copies the session handle
3. User pastes session handle into add-on
4. Add-on stores handle in `PropertiesService.getUserProperties()`
5. Before each API call, add-on calls `/token` to get fresh JWT
6. Add-on uses JWT as Bearer token for backend API calls

