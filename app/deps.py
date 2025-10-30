"""
Shared Dependencies

This module contains reusable dependency functions for FastAPI routes.

Dependencies are functions that run before route handlers to:
- Validate authentication
- Check permissions
- Provide shared resources (database connections, etc.)
- Parse and validate common parameters

Benefits:
- DRY (Don't Repeat Yourself) - write once, use everywhere
- Testability - easy to mock dependencies in tests
- Clean code - keeps route handlers focused on business logic
"""

from typing import Annotated

from fastapi import Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth import get_current_user_id

# Re-export auth dependencies for convenience
CurrentUserId = Annotated[str, Depends(get_current_user_id)]

# HTTP Bearer token scheme for extracting raw token
_token_security = HTTPBearer()


async def get_current_user_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_token_security)]
) -> str:
    """
    Extract the raw access token from the Authorization header.
    
    This is useful for endpoints that need to return the token,
    such as for Gmail add-on integration.
    
    Args:
        credentials: Automatically extracted from Authorization header
        
    Returns:
        The raw JWT token string
    """
    return credentials.credentials


# Common Query Parameters
# These are reusable query parameter dependencies

class PaginationParams:
    """
    Reusable pagination parameters.
    
    Use this dependency when you need pagination in a route:
    
    @router.get("/items")
    async def list_items(pagination: PaginationParams = Depends()):
        skip = pagination.skip
        limit = pagination.limit
        ...
    """
    
    def __init__(
        self,
        skip: Annotated[int, Query(ge=0, description="Number of items to skip")] = 0,
        limit: Annotated[int, Query(ge=1, le=100, description="Max items to return")] = 20,
    ):
        """
        Initialize pagination parameters.
        
        Args:
            skip: Number of items to skip (offset)
            limit: Maximum number of items to return (max 100)
        """
        self.skip = skip
        self.limit = limit


class FilterParams:
    """
    Reusable filter parameters for applications.
    """

    def __init__(
        self,
        status: Annotated[
            str | None,
            Query(description="Filter by application status")
        ] = None,
        company: Annotated[
            str | None,
            Query(description="Filter by company name (partial match)")
        ] = None,
        position: Annotated[
            str | None,
            Query(description="Filter by position title (partial match)")
        ] = None,
        source: Annotated[
            str | None,
            Query(description="Filter by application source")
        ] = None,
        confidence: Annotated[
            str | None,
            Query(description="Filter by confidence level")
        ] = None,
        date_from: Annotated[
            str | None,
            Query(description="Filter applications applied on/after this date (ISO format)")
        ] = None,
        date_to: Annotated[
            str | None,
            Query(description="Filter applications applied on/before this date (ISO format)")
        ] = None,
        search: Annotated[
            str | None,
            Query(description="Search company or position")
        ] = None,
    ):
        self.status = status
        self.company = company
        self.position = position
        self.source = source
        self.confidence = confidence
        self.date_from = date_from
        self.date_to = date_to
        self.search = search


# Dependency examples for future use:

async def get_db_session():
    """
    Dependency to provide a database session.
    
    TODO: Implement when needed for Stage 4+
    
    This would create and yield a database session,
    ensuring it's properly closed after use.
    
    Example:
        @router.get("/items")
        async def get_items(db = Depends(get_db_session)):
            # Use db connection
            ...
    """
    # async with get_db_connection() as conn:
    #     yield conn
    pass


async def require_admin():
    """
    Dependency to require admin role.
    
    TODO: Implement when role-based access control is needed
    
    Example:
        @router.delete("/admin/users/{user_id}")
        async def delete_user(
            user_id: str,
            _: None = Depends(require_admin)  # Underscore = unused
        ):
            # Only admins can reach this endpoint
            ...
    """
    # user = await get_current_user()
    # if user.get("role") != "admin":
    #     raise HTTPException(status_code=403, detail="Admin access required")
    pass

