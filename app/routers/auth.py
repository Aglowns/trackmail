"""
Auth Router

Provides authentication-related endpoints, including token retrieval and API key management for Gmail add-on integration.
"""

import secrets
from typing import Annotated
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from pydantic import BaseModel

from app.deps import get_current_user_token, CurrentUserId
from app.config import settings
from app.db import get_supabase_client

router = APIRouter()


class ApiKeyResponse(BaseModel):
    """Response model for API key creation."""
    api_key: str
    created_at: str
    name: str = "Gmail Add-on Key"
    expires_at: str | None = None


@router.get("/token")
async def get_current_token(
    token: Annotated[str, Depends(get_current_user_token)]
) -> dict[str, str]:
    """
    Get the current user's access token for Gmail add-on integration.
    
    This endpoint extracts the access token from the Authorization header
    and returns it to the frontend. This ensures we always get the actual
    token being used for API requests, avoiding stale session data.
    
    Returns:
        dict: Contains the access_token string
        
    Example Response:
        {
            "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6IjQ0LzFXRVhpWFJmQWlqSEEi..."
        }
    """
    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/installation-token")
async def issue_installation_token(user_id: CurrentUserId) -> dict[str, str]:
    """
    Issue a long-lived installation token for the current user.

    This token is a signed JWT with a long expiration that the Gmail add-on can
    store and use directly in the Authorization header for all API calls.
    """
    supabase = get_supabase_client()

    try:
        user_response = supabase.auth.admin.get_user_by_id(user_id)
        user = user_response.user
    except Exception as exc:  # pragma: no cover - log for observability
        print(f"⚠️ Failed to fetch user info for installation token: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user information for installation token",
        )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    email: str | None = getattr(user, "email", None)
    user_metadata = getattr(user, "user_metadata", None) or {}

    payload = {
        "sub": user_id,
        "type": "installation",
        "aud": settings.jwt_audience,
        "iss": settings.jwt_issuer,
        "role": "authenticated",
        "email": email,
        "user_metadata": user_metadata,
        "app_metadata": {"provider": "installation_token"},
    }

    # 365 days expiration
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    exp = now + timedelta(days=365)
    payload.update({"iat": int(now.timestamp()), "exp": int(exp.timestamp())})

    secret = settings.supabase_jwt_secret or settings.supabase_anon_key
    token = jwt.encode(payload, secret, algorithm="HS256")
    return {"installation_token": token, "token_type": "bearer", "expires_in_days": 365}


@router.post("/api-keys/issue", response_model=ApiKeyResponse)
async def issue_api_key(
    user_id: CurrentUserId,
    name: str = "Gmail Add-on Key",
) -> ApiKeyResponse:
    """
    Issue a long-lived API key for the current user.
    
    API keys are simple, secure tokens that don't expire (unless explicitly set).
    They're perfect for Gmail add-on integration because:
    - No expiration management needed
    - Simple to use (just send in X-API-Key header)
    - Server-side validation only
    - Can be revoked at any time
    
    Args:
        user_id: Current authenticated user ID (from JWT)
        name: Optional name for the API key (default: "Gmail Add-on Key")
        
    Returns:
        ApiKeyResponse with the generated API key
        
    Example:
        POST /v1/api-keys/issue
        Headers: Authorization: Bearer <jwt_token>
        
        Response:
        {
            "api_key": "jobmail_a1b2c3d4e5f6...",
            "created_at": "2024-01-01T00:00:00Z",
            "name": "Gmail Add-on Key",
            "expires_at": null
        }
    """
    supabase = get_supabase_client()
    
    # Generate a secure random API key
    # Format: jobmail_<32 random URL-safe bytes>
    random_bytes = secrets.token_urlsafe(32)
    api_key = f"jobmail_{random_bytes}"
    
    # Insert into database
    now = datetime.now(timezone.utc)
    
    try:
        response = supabase.table("api_keys").insert({
            "user_id": user_id,
            "api_key": api_key,
            "name": name,
            "created_at": now.isoformat(),
            "expires_at": None,  # Never expires by default
        }).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create API key",
            )
        
        created_key = response.data[0]
        
        return ApiKeyResponse(
            api_key=api_key,
            created_at=created_key["created_at"],
            name=created_key["name"],
            expires_at=created_key.get("expires_at"),
        )
        
    except Exception as e:
        print(f"Error creating API key: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create API key",
        )


@router.get("/api-keys")
async def list_api_keys(user_id: CurrentUserId) -> dict:
    """
    List all API keys for the current user.
    
    Returns a list of API keys (without the actual key values for security).
    Only shows metadata like creation date, last used, etc.
    
    Args:
        user_id: Current authenticated user ID (from JWT)
        
    Returns:
        List of API key metadata
    """
    supabase = get_supabase_client()
    
    try:
        # Use user's JWT context to respect RLS
        response = supabase.table("api_keys").select(
            "id, name, created_at, last_used_at, expires_at"
        ).eq("user_id", user_id).order("created_at", desc=True).execute()
        
        return {
            "api_keys": response.data or [],
        }
        
    except Exception as e:
        print(f"Error listing API keys: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list API keys",
        )


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str, user_id: CurrentUserId) -> dict:
    """
    Revoke (delete) an API key.
    
    This immediately invalidates the API key. Any requests using it will fail.
    
    Args:
        key_id: UUID of the API key to revoke
        user_id: Current authenticated user ID (from JWT)
        
    Returns:
        Success message
    """
    supabase = get_supabase_client()
    
    try:
        # Delete the API key (RLS ensures user can only delete their own)
        response = supabase.table("api_keys").delete().eq("id", key_id).eq("user_id", user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found",
            )
        
        return {"message": "API key revoked successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error revoking API key: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke API key",
        )

