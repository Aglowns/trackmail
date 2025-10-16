#!/usr/bin/env python3
"""
Minimal FastAPI app for testing Railway deployment
"""
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

print("🚀 Starting minimal FastAPI app...")

# Create FastAPI app
app = FastAPI(
    title="Minimal TrackMail API",
    description="A minimal backend for testing",
    version="1.0.0"
)

print("✅ FastAPI app created")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("✅ CORS middleware added")

@app.get("/")
async def root():
    print("📡 Root endpoint called")
    return {"message": "Minimal TrackMail API is running!", "status": "success"}

@app.get("/health")
async def health():
    print("🏥 Health endpoint called")
    return {"status": "healthy", "message": "Minimal backend is running"}

@app.get("/v1/health")
async def v1_health():
    print("🏥 V1 Health endpoint called")
    return {"status": "healthy", "message": "TrackMail Backend is running (v1)"}

@app.post("/v1/ingest/email")
async def ingest_email():
    print("📧 Email ingest endpoint called")
    return {"message": "Email ingest endpoint - ready for implementation"}

@app.post("/ingest/email")
async def ingest_email_no_prefix():
    print("📧 Email ingest endpoint (no prefix) called")
    return {"message": "Email ingest endpoint - ready for implementation"}

@app.get("/test-env")
async def test_env():
    print("🔧 Testing environment variables...")
    return {
        "PORT": os.getenv("PORT", "NOT_SET"),
        "SUPABASE_URL": os.getenv("SUPABASE_URL", "NOT_SET")[:30] + "..." if os.getenv("SUPABASE_URL") else "NOT_SET",
        "DATABASE_URL": "SET" if os.getenv("DATABASE_URL") else "NOT_SET"
    }

print("✅ All routes defined")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    print(f"🚀 Starting minimal TrackMail API on port {port}")
    print(f"🌐 Server will be available at http://0.0.0.0:{port}")
    uvicorn.run(
        "minimal_app:app",
        host="0.0.0.0",
        port=port,
        workers=1,
        log_level="info",
        reload=False
    )
