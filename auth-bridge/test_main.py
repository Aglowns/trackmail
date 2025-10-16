"""
Minimal test version of auth-bridge to isolate issues
"""

from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/")
async def root():
    return {
        "message": "TrackMail Auth Bridge Test",
        "status": "running",
        "port": os.getenv("PORT", "8001"),
        "supabase_url_set": bool(os.getenv("SUPABASE_URL")),
        "supabase_key_set": bool(os.getenv("SUPABASE_ANON_KEY"))
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "supabase_configured": bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_ANON_KEY"))
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    print(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
