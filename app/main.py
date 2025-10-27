"""
TrackMail FastAPI Application

This is the main entry point for the TrackMail backend API.

FastAPI is a modern, fast web framework for building APIs with Python.
Key features we use:
- Automatic OpenAPI documentation (visit /docs when running)
- Request/response validation using Pydantic
- Dependency injection for clean code organization
- Async support for better performance
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import applications, events, ingest, health, profiles


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: D401
    """Manage application startup and shutdown."""
    print(f"🚀 TrackMail API starting in {settings.environment} mode")
    print("📝 Docs available at /docs")
    print("🔧 Backend redeployed - checking connectivity...")
    print("🚀 Route fix applied - status-groups should work now")
    try:
        yield
    finally:
        print("👋 TrackMail API shutting down")

# Create FastAPI application instance
app = FastAPI(
    title="TrackMail API",
    description="Job application tracking system with email parsing",
    version="0.1.0",
    # OpenAPI documentation configuration
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc alternative UI
    lifespan=lifespan,
)

# Configure CORS (Cross-Origin Resource Sharing)
# This allows frontend applications from different origins to access the API
app.add_middleware(
    CORSMiddleware,
    # Which origins (frontend URLs) can access the API
    allow_origins=settings.get_cors_origins_list(),
    # Allow cookies and authentication headers
    allow_credentials=True,
    # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_methods=["*"],
    # Allow all headers
    allow_headers=["*"],
)

# Include routers
# Routers organize endpoints by domain (health, applications, etc.)
# Order matters: specific routes before general routes

# Public routers (no authentication required)
app.include_router(health.router, tags=["Health"])
app.include_router(health.router, prefix="/v1", tags=["Health"])

# Protected routers (authentication required)
# All these endpoints will require a valid JWT token
# Include with /v1 prefix for API versioning
app.include_router(applications.router, prefix="/v1", tags=["Applications"])
app.include_router(events.router, prefix="/v1", tags=["Events"])
app.include_router(ingest.router, prefix="/v1", tags=["Email Ingestion"])
app.include_router(profiles.router, prefix="/v1", tags=["Profiles"])


# Root endpoint - provides basic API information
@app.get("/")
async def root() -> dict[str, str]:
    """
    Root endpoint that provides basic API information.
    
    This is useful for:
    - Verifying the API is running
    - Checking the deployed version
    - Providing entry point documentation
    
    Returns:
        dict: API name, version, and documentation URL
    """
    return {
        "name": "TrackMail API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }

