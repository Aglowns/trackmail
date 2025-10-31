"""
Auth Router

Provides authentication-related endpoints, including token retrieval for Gmail add-on integration.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt

from app.deps import get_current_user_token, CurrentUserId
from app.config import settings
from app.db import get_supabase_client

router = APIRouter()


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

