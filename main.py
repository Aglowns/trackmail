#!/usr/bin/env python3
"""
Main entry point for TrackMail Backend
This is a simple wrapper that imports and runs the FastAPI app
"""
import uvicorn
import os

# Import the FastAPI app
from app.main import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"Starting TrackMail Backend on port {port}")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        workers=1,
        log_level="info",
        access_log=True
    )
