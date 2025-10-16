"""
Auth Bridge Service for Gmail Add-on

This service acts as a bridge between the Gmail Add-on (Apps Script)
and Supabase authentication. It manages session handles and provides
short-lived JWT tokens to the add-on.

Architecture:
- Gmail Add-on cannot directly use Supabase Auth (no browser context)
- User signs in via this service in a browser window
- Service creates a session and returns a handle to the add-on
- Add-on exchanges session handle for JWT tokens as needed

Security:
- Session handles are random, short-lived (1 hour default)
- Rate limiting on token endpoint to prevent abuse
- Tokens are short-lived (5 minutes)
- Sessions stored in-memory (can be upgraded to Redis for production)
"""

import secrets
import time
from datetime import datetime, timedelta
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException, Request, status, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client
import os

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "3600"))  # 1 hour
TOKEN_TTL_SECONDS = int(os.getenv("TOKEN_TTL_SECONDS", "300"))  # 5 minutes

# Initialize FastAPI app
app = FastAPI(
    title="Auth Bridge for Gmail Add-on",
    description="Authentication bridge between Gmail Add-on and Supabase",
    version="1.0.0"
)

# CORS Configuration - Allow Gmail Add-on to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Gmail Add-on doesn't have a fixed origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates for rendering HTML pages
templates = Jinja2Templates(directory="templates")

# In-memory session store
# Format: {session_handle: {user_id, email, access_token, refresh_token, expires_at}}
sessions: Dict[str, dict] = {}

# Rate limiting store (simple in-memory)
# Format: {session_handle: [timestamp1, timestamp2, ...]}
rate_limit_store: Dict[str, list] = {}


class SessionStartRequest(BaseModel):
    """Request to start a new session after Supabase authentication."""
    access_token: str = Field(..., description="Supabase access token")
    refresh_token: str = Field(..., description="Supabase refresh token")
    user_email: str = Field(..., description="User's email address")
    user_id: str = Field(..., description="User's Supabase user ID")


class SessionStartResponse(BaseModel):
    """Response containing the session handle."""
    session_handle: str = Field(..., description="Unique session handle")
    expires_at: str = Field(..., description="ISO timestamp when session expires")


class TokenResponse(BaseModel):
    """Response containing a short-lived JWT token."""
    access_token: str = Field(..., description="Supabase JWT access token")
    expires_in: int = Field(..., description="Seconds until token expires")
    user_email: str = Field(..., description="User's email address")


def cleanup_expired_sessions():
    """Remove expired sessions from the store."""
    now = time.time()
    expired = [handle for handle, data in sessions.items() if data["expires_at"] < now]
    for handle in expired:
        del sessions[handle]
        if handle in rate_limit_store:
            del rate_limit_store[handle]


def check_rate_limit(session_handle: str, max_requests: int = 20, window_seconds: int = 60) -> bool:
    """
    Check if a session handle has exceeded rate limits.
    
    Args:
        session_handle: The session handle to check
        max_requests: Maximum requests allowed in the time window
        window_seconds: Time window in seconds
        
    Returns:
        True if within rate limits, False if exceeded
    """
    now = time.time()
    
    # Clean up old timestamps
    if session_handle in rate_limit_store:
        rate_limit_store[session_handle] = [
            ts for ts in rate_limit_store[session_handle] 
            if now - ts < window_seconds
        ]
    else:
        rate_limit_store[session_handle] = []
    
    # Check if limit exceeded
    if len(rate_limit_store[session_handle]) >= max_requests:
        return False
    
    # Record this request
    rate_limit_store[session_handle].append(now)
    return True


@app.get("/", response_class=HTMLResponse)
async def landing_page(request: Request):
    """
    Landing page with Supabase sign-in UI.
    
    This page is opened in a browser window when the user clicks
    "Sign In" in the Gmail Add-on. After successful authentication,
    the page creates a session and communicates the session handle
    back to the add-on.
    """
    return templates.TemplateResponse(
        "signin.html",
        {
            "request": request,
            "supabase_url": SUPABASE_URL,
            "supabase_anon_key": SUPABASE_ANON_KEY,
        }
    )


@app.post("/session/start", response_model=SessionStartResponse)
async def start_session(session_data: SessionStartRequest):
    """
    Create a new session after successful Supabase authentication.
    
    This endpoint is called from the sign-in page after the user
    successfully authenticates with Supabase.
    
    Flow:
    1. User signs in via Supabase Auth UI on landing page
    2. Page calls this endpoint with Supabase tokens
    3. Service creates a session and returns a handle
    4. Page communicates handle back to Gmail Add-on
    5. Add-on stores handle for future token requests
    """
    # Clean up expired sessions
    cleanup_expired_sessions()
    
    # Generate a secure random session handle
    session_handle = secrets.token_urlsafe(32)
    
    # Calculate expiration time
    expires_at = time.time() + SESSION_TTL_SECONDS
    
    # Store session data
    sessions[session_handle] = {
        "user_id": session_data.user_id,
        "email": session_data.user_email,
        "access_token": session_data.access_token,
        "refresh_token": session_data.refresh_token,
        "expires_at": expires_at,
        "created_at": time.time(),
    }
    
    return SessionStartResponse(
        session_handle=session_handle,
        expires_at=datetime.fromtimestamp(expires_at).isoformat()
    )


@app.get("/token", response_model=TokenResponse)
async def get_token(handle: str):
    """
    Exchange a session handle for a short-lived JWT token.
    
    This endpoint is called by the Gmail Add-on before each API call
    to get a fresh Supabase JWT token.
    
    Security:
    - Rate limited to prevent token farming
    - Returns tokens with short TTL (5 minutes)
    - Validates session hasn't expired
    
    Args:
        handle: Session handle obtained from /session/start
        
    Returns:
        Short-lived Supabase JWT token
        
    Example:
        GET /token?handle=abc123xyz...
    """
    # Clean up expired sessions
    cleanup_expired_sessions()
    
    # Check if session exists
    if handle not in sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session handle"
        )
    
    # Check rate limits
    if not check_rate_limit(handle):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait before requesting more tokens."
        )
    
    # Get session data
    session = sessions[handle]
    
    # Check if session has expired
    if session["expires_at"] < time.time():
        del sessions[handle]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please sign in again."
        )
    
    # Return the access token
    # Note: In production, you might want to refresh the token if it's close to expiry
    return TokenResponse(
        access_token=session["access_token"],
        expires_in=TOKEN_TTL_SECONDS,
        user_email=session["email"]
    )


@app.delete("/session")
async def end_session(handle: str):
    """
    End a session (sign out).
    
    This endpoint is called when the user signs out from the Gmail Add-on.
    
    Args:
        handle: Session handle to terminate
    """
    if handle in sessions:
        del sessions[handle]
        if handle in rate_limit_store:
            del rate_limit_store[handle]
        return {"message": "Session ended successfully"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Session not found"
    )


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    cleanup_expired_sessions()
    return {
        "status": "healthy",
        "active_sessions": len(sessions),
        "supabase_configured": bool(SUPABASE_URL and SUPABASE_ANON_KEY)
    }


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8001))  # Railway uses PORT env var
    uvicorn.run(app, host="0.0.0.0", port=port)

