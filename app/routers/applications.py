"""
Applications Router

This router handles all job application CRUD operations:
- Create new application
- List user's applications with filtering and pagination
- Get single application details
- Update application
- Delete application

All endpoints require authentication via JWT token.
Row-Level Security ensures users only access their own data.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import CurrentUserId, FilterParams, PaginationParams
from app.schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
    PaginatedResponse,
)
from app.services import applications as app_service

# Create router for application-related endpoints
# All routes will be prefixed with /applications
router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("/", response_model=PaginatedResponse)
async def list_applications(
    user_id: CurrentUserId,
    pagination: PaginationParams = Depends(),
    filters: FilterParams = Depends(),
) -> PaginatedResponse:
    """
    List all applications for the authenticated user.
    
    Supports filtering by:
    - status: Filter by application status (e.g., "applied", "interviewing")
    - company: Filter by company name (case-insensitive partial match)
    - position: Filter by position title (case-insensitive partial match)
    
    Supports pagination:
    - skip: Number of items to skip (default 0)
    - limit: Maximum items to return (default 20, max 100)
    
    Args:
        user_id: Automatically extracted from JWT token
        pagination: Pagination parameters from query string
        filters: Filter parameters from query string
        
    Returns:
        Paginated list of applications
        
    Example Request:
        GET /applications?status=applied&company=acme&skip=0&limit=10
    """
    # Get applications from service layer
    applications, total = await app_service.get_user_applications(
        user_id=user_id,
        skip=pagination.skip,
        limit=pagination.limit,
        status=filters.status,
        company=filters.company,
        position=filters.position,
    )
    
    return PaginatedResponse(
        items=applications,
        total=total,
        skip=pagination.skip,
        limit=pagination.limit,
    )


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    data: ApplicationCreate,
    user_id: CurrentUserId,
) -> ApplicationResponse:
    """
    Create a new job application.
    
    The application will be associated with the authenticated user.
    Row-Level Security ensures the user_id is set correctly.
    
    Args:
        data: Application data (company, position, status, etc.)
        user_id: Automatically extracted from JWT token
        
    Returns:
        Created application with generated ID and timestamps
        
    Example Request:
        POST /applications
        {
            "company": "Acme Corp",
            "position": "Senior Software Engineer",
            "status": "applied",
            "location": "San Francisco, CA",
            "source_url": "https://acme.com/jobs/123",
            "notes": "Found via LinkedIn"
        }
    """
    # Create application via service layer
    application = await app_service.create_application(user_id=user_id, data=data)
    
    return ApplicationResponse(**application)


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: str,
    user_id: CurrentUserId,
) -> ApplicationResponse:
    """
    Get a single application by ID.
    
    RLS ensures the user can only access their own applications.
    
    Args:
        application_id: UUID of the application
        user_id: Automatically extracted from JWT token
        
    Returns:
        Application details
        
    Raises:
        404: Application not found or user doesn't have access
    """
    application = await app_service.get_application_by_id(
        application_id=application_id,
        user_id=user_id
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    return ApplicationResponse(**application)


@router.patch("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: str,
    data: ApplicationUpdate,
    user_id: CurrentUserId,
) -> ApplicationResponse:
    """
    Update an application.
    
    Only updates fields that are provided (partial update).
    RLS ensures the user can only update their own applications.
    
    Args:
        application_id: UUID of the application to update
        data: Updated fields (only provided fields will be updated)
        user_id: Automatically extracted from JWT token
        
    Returns:
        Updated application
        
    Raises:
        404: Application not found or user doesn't have access
        
    Example Request:
        PATCH /applications/123e4567-e89b-12d3-a456-426614174000
        {
            "status": "interviewing",
            "notes": "First round interview scheduled for Monday"
        }
    """
    application = await app_service.update_application(
        application_id=application_id,
        user_id=user_id,
        data=data
    )
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    return ApplicationResponse(**application)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: str,
    user_id: CurrentUserId,
) -> None:
    """
    Delete an application.
    
    This is a hard delete - the application and all associated events/emails
    will be permanently removed (handled by CASCADE on database level).
    
    RLS ensures the user can only delete their own applications.
    
    Args:
        application_id: UUID of the application to delete
        user_id: Automatically extracted from JWT token
        
    Raises:
        404: Application not found or user doesn't have access
    """
    success = await app_service.delete_application(
        application_id=application_id,
        user_id=user_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

