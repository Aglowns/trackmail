#!/usr/bin/env python3
"""
Simple TrackMail Backend - Minimal Working Version
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

# Basic endpoints
@app.get("/")
async def root():
    return {"name": "TrackMail API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "TrackMail Backend is running"}

@app.get("/v1/health")
async def v1_health():
    return {"status": "healthy", "message": "TrackMail Backend is running (v1)"}

@app.post("/v1/ingest/email")
async def ingest_email():
    return {"message": "Email ingest endpoint - ready for implementation"}

@app.post("/ingest/email")
async def ingest_email_no_prefix():
    return {"message": "Email ingest endpoint - ready for implementation"}

@app.get("/v1/test-db")
async def test_database():
    """Test database connection"""
    try:
        import psycopg
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return {"status": "error", "message": "DATABASE_URL not set"}
        
        conn = psycopg.connect(database_url)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM applications")
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return {
            "status": "success", 
            "message": "Database connection successful",
            "applications_count": count
        }
    except Exception as e:
        return {"status": "error", "message": f"Database error: {str(e)}"}

@app.get("/v1/test-supabase")
async def test_supabase():
    """Test Supabase connection"""
    try:
        from supabase import create_client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            return {"status": "error", "message": "Supabase credentials not set"}
        
        supabase = create_client(supabase_url, supabase_key)
        # Test connection by trying to query a table
        result = supabase.table("applications").select("id").limit(1).execute()
        
        return {
            "status": "success", 
            "message": "Supabase connection successful",
            "data": result.data
        }
    except Exception as e:
        return {"status": "error", "message": f"Supabase error: {str(e)}"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    print(f"🚀 Starting TrackMail API on port {port}")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        workers=1,
        log_level="info"
    )