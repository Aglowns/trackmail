"""
Health Check Router

This router provides endpoints for monitoring the API's health and status.

Health checks are important for:
- Load balancers to know if the service is up
- Monitoring systems to detect outages
- Deployment verification
- Debugging connectivity issues
"""

from fastapi import APIRouter

# Create a router for health-related endpoints
router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """
    Basic health check endpoint.
    
    This endpoint returns a simple response to indicate the API is running.
    It doesn't check database connectivity or other dependencies - that's
    what the detailed health endpoint is for.
    
    Returns:
        dict: Status message
        
    Example Response:
        {
            "status": "ok"
        }
    """
    return {"status": "ok"}


@router.get("/health/detailed")
async def detailed_health_check() -> dict[str, str | dict[str, str]]:
    """
    Detailed health check with dependency status.
    
    In a production system, this would check:
    - Database connectivity
    - External API availability
    - Redis/cache status
    - File system access
    
    For now, it's a placeholder for future enhancement.
    
    Returns:
        dict: Detailed status information
        
    Example Response:
        {
            "status": "ok",
            "checks": {
                "database": "ok",
                "supabase": "ok"
            }
        }
    """
    # TODO: Add actual health checks in Stage 4+
    # Example:
    # try:
    #     supabase = get_supabase_client()
    #     supabase.table("profiles").select("id").limit(1).execute()
    #     database_status = "ok"
    # except Exception:
    #     database_status = "error"
    
    return {
        "status": "ok",
        "checks": {
            "database": "not_implemented",
            "supabase": "not_implemented",
        }
    }

