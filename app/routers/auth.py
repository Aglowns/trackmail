"""
Auth Router

Provides authentication-related endpoints, including token retrieval for Gmail add-on integration.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from jose import jwt

from app.deps import get_current_user_token, CurrentUserId
from app.config import settings

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
    payload = {
        "sub": user_id,
        "type": "installation",
        "aud": settings.jwt_audience,
        "iss": settings.jwt_issuer,
    }

    # 365 days expiration
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    exp = now + timedelta(days=365)
    payload.update({"iat": int(now.timestamp()), "exp": int(exp.timestamp())})

    token = jwt.encode(payload, settings.supabase_jwt_secret or settings.supabase_anon_key, algorithm="HS256")
    return {"installation_token": token, "token_type": "bearer", "expires_in_days": 365}

