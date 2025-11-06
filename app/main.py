"""
JobMail FastAPI Application

Main entry point for the TrackMail backend API.
"""

from contextlib import asynccontextmanager

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
