"""
Application Events Router

This router handles application event tracking:
- Get event history for an application
- Add custom events manually
- Filter events by type

Events track the status history and timeline of job applications.

Educational Note:
Events provide an audit trail of everything that happened with an application.
This is useful for:
- Showing timeline visualizations
- Understanding application progression
- Debugging issues
- Analytics and reporting
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import CurrentUserId
from app.db import get_supabase_client
from app.schemas import EventCreate, EventResponse

# Create router for event-related endpoints
router = APIRouter(tags=["Events"])


@router.get("/applications/{application_id}/events", response_model=list[EventResponse])
async def get_application_events(
    application_id: str,
    user_id: CurrentUserId,
) -> list[EventResponse]:
    """
    Get all events for a specific application.
    
    Events are returned in chronological order (oldest first) to show
    the progression of the application over time.
    
    RLS ensures the user can only access events for their own applications.
    
    Args:
        application_id: UUID of the application
        user_id: Automatically extracted from JWT token
        
    Returns:
        List of events with timestamps
        
    Example Response:
        [
            {
                "id": "uuid",
                "application_id": "uuid",
                "event_type": "application_submitted",
                "status": "applied",
                "notes": "Application submitted via website",
                "metadata": {"source": "email"},
                "created_at": "2025-01-15T10:00:00Z"
            },
            {
                "id": "uuid",
                "application_id": "uuid",
                "event_type": "status_change",
                "status": "interviewing",
                "notes": "Interview scheduled",
                "metadata": {},
                "created_at": "2025-01-20T14:30:00Z"
            }
        ]
    """
    supabase = get_supabase_client()
    
    # First check if application exists and user has access
    app_result = (
        supabase.table("applications")
        .select("id")
        .eq("id", application_id)
        .execute()
    )
    
    if not app_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Get events for the application
    result = (
        supabase.table("application_events")
        .select("*")
        .eq("application_id", application_id)
        .order("created_at", desc=False)  # Chronological order
        .execute()
    )
    
    return [EventResponse(**event) for event in result.data]


@router.post(
    "/applications/{application_id}/events",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_application_event(
    application_id: str,
    data: EventCreate,
    user_id: CurrentUserId,
) -> EventResponse:
    """
    Manually create an event for an application.
    
    Useful for tracking events that don't come from emails:
    - Phone screens
    - In-person interviews
    - Networking conversations
    - Follow-ups
    - Notes about the application
    
    Args:
        application_id: UUID of the application
        data: Event data (type, status, notes, metadata)
        user_id: Automatically extracted from JWT token
        
    Returns:
        Created event with generated ID and timestamp
        
    Raises:
        404: Application not found or user doesn't have access
        
    Example Request:
        POST /applications/{app_id}/events
        {
            "event_type": "phone_screen",
            "status": "screening",
            "notes": "Had 30min call with recruiter. Next step is technical interview.",
            "metadata": {
                "interviewer": "Jane Smith",
                "scheduled_date": "2025-01-25"
            }
        }
    """
    supabase = get_supabase_client()
    
    # First check if application exists and user has access
    app_result = (
        supabase.table("applications")
        .select("id")
        .eq("id", application_id)
        .execute()
    )
    
    if not app_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Prepare event data
    event_data = {
        "application_id": application_id,
        "event_type": data.event_type,
        "status": data.status,
        "notes": data.notes,
        "metadata": data.metadata or {},
    }
    
    # Insert event
    result = supabase.table("application_events").insert(event_data).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create event"
        )
    
    # If status was provided, update the application status
    if data.status:
        supabase.table("applications").update(
            {"status": data.status}
        ).eq("id", application_id).execute()
    
    return EventResponse(**result.data[0])
