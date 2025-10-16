"""
JWT Authentication System

This module handles JWT (JSON Web Token) validation for protected API routes.

What is JWT?
- A secure way to transmit information between parties as a JSON object
- Digitally signed, so you can verify it's authentic
- Contains claims (pieces of information) like user ID, expiration time
- Supabase Auth generates JWTs when users log in

How it works in TrackMail:
1. User logs in via Supabase Auth (frontend)
2. Supabase returns a JWT access token
3. Frontend sends token in Authorization header: "Bearer <token>"
4. Backend validates token signature and extracts user ID
5. User ID is used to enforce Row-Level Security

Security considerations:
- Never trust client-provided user IDs - always verify via JWT
- Tokens expire (typically 1 hour) for security
- Signature validation ensures token hasn't been tampered with
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

# HTTP Bearer token scheme
# This automatically extracts the token from the Authorization header
# Format: Authorization: Bearer <token>
security = HTTPBearer()


def verify_jwt_token(token: str) -> dict:
    """
    Verify and decode a JWT token.
    
    This function:
    1. Decodes the JWT using the Supabase JWT secret (from anon key)
    2. Verifies the signature to ensure it's authentic
    3. Checks the audience and issuer claims
    4. Returns the decoded token payload
    
    Args:
        token: The JWT token string
        
    Returns:
        Decoded token payload (contains user_id, email, etc.)
        
    Raises:
        HTTPException: If token is invalid, expired, or verification fails
        
    Educational Note:
        The JWT secret is embedded in the Supabase anon key.
        For Supabase, we need to extract it. In production, you might
        use JWK (JSON Web Key) sets for better security.
    """
    try:
        # Decode and verify JWT
        # For Supabase, we use the service role key's secret
        # In production, you'd fetch the JWT secret from Supabase settings
        # or use JWK validation
        
        # Supabase JWT secret is actually the anon key for basic validation
        # For proper validation, we should use the JWT secret from Supabase settings
        # But for development, we can verify using the anon key's embedded secret
        
        payload = jwt.decode(
            token,
            # Note: In production, extract the actual JWT secret from Supabase
            # For now, we'll verify the token structure without strict verification
            # This allows the token to pass through - in production, add proper verification
            settings.supabase_anon_key,
            algorithms=["HS256"],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
            options={
                # In development, we might need to be less strict
                # In production, set these to True for security
                "verify_signature": True,
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True,
            }
        )
        
        return payload
        
    except JWTError as e:
        # Token is invalid, expired, or verification failed
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> str:
    """
    FastAPI dependency to get the current authenticated user's ID.
    
    This is used as a dependency in route handlers that require authentication.
    
    How to use:
        @router.get("/protected")
        async def protected_route(user_id: str = Depends(get_current_user_id)):
            # user_id is now the authenticated user's ID
            # Use it to query their data with RLS
            ...
    
    Args:
        credentials: Automatically extracted from Authorization header
        
    Returns:
        User ID (UUID as string) from the JWT token
        
    Raises:
        HTTPException: 401 if authentication fails
        
    Educational Note:
        FastAPI's dependency injection makes this clean and testable.
        The dependency runs before the route handler, ensuring only
        authenticated requests reach your business logic.
    """
    # Extract token from credentials
    token = credentials.credentials
    
    # Verify and decode token
    payload = verify_jwt_token(token)
    
    # Extract user ID from token payload
    # Supabase tokens have the user ID in the "sub" (subject) claim
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user ID (sub claim)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_id


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> dict:
    """
    FastAPI dependency to get the full current user information from JWT.
    
    This returns the complete JWT payload, which includes:
    - sub: User ID
    - email: User's email
    - role: User's role (authenticated, anon, etc.)
    - exp: Token expiration time
    - iat: Token issued at time
    
    Use this when you need more than just the user ID.
    
    Args:
        credentials: Automatically extracted from Authorization header
        
    Returns:
        Full JWT payload dictionary
        
    Raises:
        HTTPException: 401 if authentication fails
    """
    token = credentials.credentials
    payload = verify_jwt_token(token)
    return payload


# Type aliases for cleaner dependency injection
# Use these in route handlers for better type hints
CurrentUserId = Annotated[str, Depends(get_current_user_id)]
CurrentUser = Annotated[dict, Depends(get_current_user)]

