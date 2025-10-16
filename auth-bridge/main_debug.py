"""
Debug version to check environment variables
"""

from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/")
async def root():
    return {
        "message": "TrackMail Auth Bridge Debug",
        "status": "running",
        "port": os.getenv("PORT", "8001"),
        "supabase_url": os.getenv("SUPABASE_URL", "NOT_SET"),
        "supabase_key": os.getenv("SUPABASE_ANON_KEY", "NOT_SET")[:20] + "..." if os.getenv("SUPABASE_ANON_KEY") else "NOT_SET",
        "all_env_vars": list(os.environ.keys())
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "supabase_configured": bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_ANON_KEY")),
        "supabase_url_set": bool(os.getenv("SUPABASE_URL")),
        "supabase_key_set": bool(os.getenv("SUPABASE_ANON_KEY")),
        "supabase_url_value": os.getenv("SUPABASE_URL", "NOT_SET"),
        "supabase_key_length": len(os.getenv("SUPABASE_ANON_KEY", ""))
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    print(f"Starting debug server on port {port}")
    print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
    print(f"SUPABASE_ANON_KEY: {'SET' if os.getenv('SUPABASE_ANON_KEY') else 'NOT_SET'}")
    uvicorn.run(app, host="0.0.0.0", port=port)