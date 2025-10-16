"""
Tests for Health Check Endpoints

These tests verify that the health check endpoints are working correctly.

Testing in FastAPI:
- Use TestClient to make requests without running a server
- Tests are isolated - each test runs independently
- Mock external dependencies to avoid side effects
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

# Create a test client
# This allows us to make requests to the app without running a server
client = TestClient(app)


def test_root_endpoint() -> None:
    """
    Test the root endpoint returns API information.
    
    This is a simple test that verifies:
    - The endpoint returns 200 OK
    - The response contains expected fields
    """
    response = client.get("/")
    
    assert response.status_code == 200
    
    data = response.json()
    assert "name" in data
    assert "version" in data
    assert "docs" in data
    assert data["name"] == "TrackMail API"


def test_health_check() -> None:
    """
    Test the basic health check endpoint.
    
    Health checks are crucial for:
    - Load balancers to verify service is up
    - Monitoring systems to detect outages
    - Deployment verification
    """
    response = client.get("/health")
    
    assert response.status_code == 200
    
    data = response.json()
    assert data["status"] == "ok"


def test_detailed_health_check() -> None:
    """
    Test the detailed health check endpoint.
    
    The detailed health check should provide status
    of various components (database, external services, etc.)
    """
    response = client.get("/health/detailed")
    
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    assert "checks" in data
    assert isinstance(data["checks"], dict)


@pytest.mark.asyncio
async def test_health_endpoint_is_public() -> None:
    """
    Test that health endpoints don't require authentication.
    
    Health checks must be public so monitoring systems
    can access them without credentials.
    """
    # Make request without Authorization header
    response = client.get("/health")
    
    # Should succeed without authentication
    assert response.status_code == 200


def test_health_response_format() -> None:
    """
    Test that health check response follows expected format.
    
    This ensures API consumers can rely on consistent response structure.
    """
    response = client.get("/health")
    data = response.json()
    
    # Verify response structure
    assert isinstance(data, dict)
    assert "status" in data
    assert isinstance(data["status"], str)

