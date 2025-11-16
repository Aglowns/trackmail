"""
JobMail FastAPI Application

Main entry point for the TrackMail backend API.
"""

from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import applications, events, ingest, health, profiles, auth, subscription


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: D401
    """Manage application startup and shutdown."""
    print(f"ðŸš€ JobMail API starting in {settings.environment} mode")
    print("ðŸ“ Docs available at /docs")
    try:
        yield
    finally:
        print("ðŸ‘‹ JobMail API shutting down")


app = FastAPI(
    title="JobMail API",
    description="Job application tracking system with email parsing",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CacheControlMiddleware(BaseHTTPMiddleware):
    """Add cache headers to GET requests for better performance."""
    
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        
        # Add cache headers for GET requests (except auth endpoints)
        if request.method == "GET" and not request.url.path.startswith("/v1/auth"):
            # Cache subscription status for 5 minutes
            if "/subscription/status" in request.url.path:
                response.headers["Cache-Control"] = "private, max-age=300"
            # Cache health checks for 30 seconds
            elif "/health" in request.url.path:
                response.headers["Cache-Control"] = "public, max-age=30"
            # Cache application lists for 1 minute
            elif "/applications" in request.url.path and "?" in str(request.url):
                response.headers["Cache-Control"] = "private, max-age=60"
        
        # Add performance headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        
        return response


app.add_middleware(CacheControlMiddleware)


app.include_router(health.router, tags=["Health"])
app.include_router(health.router, prefix="/v1", tags=["Health"])
app.include_router(auth.router, prefix="/v1", tags=["Auth"])
app.include_router(applications.router, prefix="/v1", tags=["Applications"])
app.include_router(events.router, prefix="/v1", tags=["Events"])
app.include_router(ingest.router, prefix="/v1", tags=["Email Ingestion"])
app.include_router(profiles.router, prefix="/v1", tags=["Profiles"])
app.include_router(subscription.router, prefix="/v1", tags=["Subscription"])


@app.get("/")
async def root() -> dict[str, str]:
    """Return basic API information."""
    return {
        "name": "JobMail API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }
