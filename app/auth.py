"""
JWT Authentication System

This module handles JWT (JSON Web Token) validation for protected API routes.

What is JWT?
- A secure way to transmit information between parties as a JSON object
- Digitally signed, so you can verify it's authentic
- Contains claims (pieces of information) like user ID, expiration time
- Supabase Auth generates JWTs when users log in

How it works in JobMail:
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

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings
from app.db import get_supabase_client

JWT_SECRET = settings.supabase_jwt_secret or settings.supabase_anon_key
if settings.supabase_jwt_secret is None:
    import logging

    logging.getLogger(__name__).warning(
        "SUPABASE_JWT_SECRET not set; falling back to anon key. Set SUPABASE_JWT_SECRET for stricter auth validation."
    )

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
            JWT_SECRET,
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


# ============================================================================
# API KEY AUTHENTICATION
# ============================================================================

async def validate_api_key(api_key: str) -> str:
    """
    Validate an API key and return the associated user ID.
    
    API keys are simple, long-lived tokens that don't expire.
    They're stored in the database and validated server-side.
    
    Args:
        api_key: The API key string to validate
        
    Returns:
        User ID (UUID as string) associated with the API key
        
    Raises:
        HTTPException: 401 if API key is invalid or expired
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is required",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    supabase = get_supabase_client()
    
    try:
        # Query the API keys table using service role to bypass RLS
        response = supabase.table("api_keys").select("user_id, expires_at, last_used_at").eq("api_key", api_key).maybe_single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key",
                headers={"WWW-Authenticate": "ApiKey"},
            )
        
        api_key_data = response.data
        user_id = api_key_data.get("user_id")
        expires_at = api_key_data.get("expires_at")
        
        # Check if API key has expired
        if expires_at:
            from datetime import datetime, timezone
            expire_time = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            if expire_time < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="API key has expired",
                    headers={"WWW-Authenticate": "ApiKey"},
                )
        
        # Update last_used_at timestamp
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()
        supabase.table("api_keys").update({"last_used_at": now}).eq("api_key", api_key).execute()
        
        return user_id
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error validating API key: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )


async def get_user_id_from_api_key(
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None
) -> str | None:
    """
    Extract and validate API key from X-API-Key header.
    
    This is used as a dependency to support API key authentication.
    Returns None if no API key is provided (fallback to JWT).
    
    Args:
        x_api_key: API key from X-API-Key header
        
    Returns:
        User ID if API key is valid, None otherwise
    """
    if not x_api_key:
        return None
    
    try:
        return await validate_api_key(x_api_key)
    except HTTPException:
        # Re-raise auth errors
        raise


async def get_current_user_id_flexible(
    # Try API key first (from header)
    api_key_user_id: Annotated[str | None, Depends(get_user_id_from_api_key)] = None,
    # Fallback to JWT (from Authorization header)
    jwt_credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(HTTPBearer(auto_error=False))] = None,
) -> str:
    """
    Unified authentication dependency that supports both API keys and JWT tokens.
    
    Priority:
    1. API key (X-API-Key header) - if present, use it
    2. JWT token (Authorization: Bearer <token>) - fallback
    
    This allows endpoints to accept either authentication method,
    making it easy to migrate from JWT to API keys.
    
    Args:
        api_key_user_id: User ID from API key (if provided)
        jwt_credentials: JWT credentials from Authorization header (if provided)
        
    Returns:
        User ID (UUID as string)
        
    Raises:
        HTTPException: 401 if neither authentication method is valid
    """
    # Try API key first
    if api_key_user_id:
        return api_key_user_id
    
    # Fallback to JWT
    if jwt_credentials:
        payload = verify_jwt_token(jwt_credentials.credentials)
        user_id = payload.get("sub")
        if user_id:
            return user_id
    
    # Neither method provided or both failed
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide either X-API-Key header or Authorization Bearer token.",
        headers={"WWW-Authenticate": "Bearer, ApiKey"},
    )


# Type aliases for cleaner dependency injection
# Use these in route handlers for better type hints

# Original JWT-only dependencies (for backward compatibility)
CurrentUserId = Annotated[str, Depends(get_current_user_id)]
CurrentUser = Annotated[dict, Depends(get_current_user)]

# New flexible dependency (supports both API key and JWT)
FlexibleUserId = Annotated[str, Depends(get_current_user_id_flexible)]

