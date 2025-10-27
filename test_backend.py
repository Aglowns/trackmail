#!/usr/bin/env python3
"""
Quick backend test script to check if the API is working locally.
"""

import asyncio
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.main import app
from fastapi.testclient import TestClient

def test_backend():
    """Test the backend endpoints locally."""
    client = TestClient(app)
    
    print("🧪 Testing TrackMail Backend...")
    
    # Test root endpoint
    print("\n1. Testing root endpoint...")
    response = client.get("/")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test health endpoint
    print("\n2. Testing health endpoint...")
    response = client.get("/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test v1 health endpoint
    print("\n3. Testing v1 health endpoint...")
    response = client.get("/v1/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test applications endpoint (should require auth)
    print("\n4. Testing applications endpoint (should require auth)...")
    response = client.get("/v1/applications/")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test status-groups endpoint (should require auth)
    print("\n5. Testing status-groups endpoint (should require auth)...")
    response = client.get("/v1/applications/status-groups")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    print("\n✅ Backend test completed!")

if __name__ == "__main__":
    test_backend()
