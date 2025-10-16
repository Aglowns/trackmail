#!/usr/bin/env python3
"""
Simple TrackMail Backend Entry Point
"""
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create the main app
app = FastAPI(
    title="TrackMail API",
    description="Job application tracking system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add basic health endpoint first
@app.get("/health")
async def basic_health():
    return {"status": "healthy", "message": "TrackMail Backend is running"}

@app.get("/")
async def root():
    return {"name": "TrackMail API", "version": "1.0.0", "status": "running"}

# Import and include the main TrackMail app
print("🔄 Attempting to load TrackMail main app...")
try:
    print("📦 Importing app.main...")
    from app.main import app as trackmail_app
    print("✅ Successfully imported app.main")
    
    # Include the main app routes instead of mounting
    print("🔗 Including main app routes...")
    app.include_router(trackmail_app.router, prefix="/v1")
    print("✅ Successfully loaded TrackMail main app")
    
except ImportError as e:
    print(f"❌ Could not import main app: {e}")
    print("📋 Setting up fallback routes...")
    # Fallback routes
    @app.get("/v1/health")
    async def health():
        return {"status": "healthy", "message": "Backend is running (fallback mode)"}
    
    @app.post("/v1/ingest/email")
    async def ingest_email():
        return {"message": "Email ingest endpoint - not implemented yet (fallback mode)"}
    
    @app.post("/ingest/email")
    async def ingest_email_no_prefix():
        return {"message": "Email ingest endpoint - not implemented yet (fallback mode)"}
    
except Exception as e:
    print(f"❌ Error loading main app: {e}")
    print("📋 Setting up fallback routes...")
    # Fallback routes
    @app.get("/v1/health")
    async def health():
        return {"status": "healthy", "message": "Backend is running (fallback mode)"}
    
    @app.post("/v1/ingest/email")
    async def ingest_email():
        return {"message": "Email ingest endpoint - not implemented yet (fallback mode)"}
    
    @app.post("/ingest/email")
    async def ingest_email_no_prefix():
        return {"message": "Email ingest endpoint - not implemented yet (fallback mode)"}

print("🎉 App setup complete!")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))  # Cloud Run uses 8080
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        workers=1,
        log_level="info"
    )
