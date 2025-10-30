"""
Auth Router

Provides authentication-related endpoints, including token retrieval for Gmail add-on integration.
"""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.deps import get_current_user_token

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

