"""
Tests for Application CRUD Endpoints

These tests verify the application management functionality:
- Creating applications
- Listing applications with filters and pagination
- Getting single applications
- Updating applications
- Deleting applications
- Authentication and authorization
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from app.main import app

client = TestClient(app)

# Mock user ID for testing
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
TEST_APP_ID = "11111111-1111-1111-1111-111111111111"


def mock_auth_dependency():
    """Mock the authentication dependency for testing."""
    return TEST_USER_ID


@pytest.fixture
def auth_headers():
    """Provide authentication headers for testing."""
    return {"Authorization": "Bearer test-token"}


@pytest.fixture
def mock_jwt():
    """Mock JWT token verification."""
    with patch("app.auth.verify_jwt_token") as mock_verify:
        mock_verify.return_value = {"sub": TEST_USER_ID, "email": "test@example.com"}
        yield mock_verify


def test_list_applications_requires_auth():
    """Test that listing applications requires authentication."""
    response = client.get("/applications/")
    assert response.status_code == 403  # Forbidden without auth


def test_create_application_requires_auth():
    """Test that creating applications requires authentication."""
    response = client.post("/applications/", json={
        "company": "Test Corp",
        "position": "Software Engineer"
    })
    assert response.status_code == 403  # Forbidden without auth


@pytest.mark.asyncio
async def test_create_application(mock_jwt):
    """Test creating a new application."""
    # Mock the Supabase client
    with patch("app.services.applications.get_supabase_client") as mock_supabase:
        # Mock the insert operation
        mock_table = AsyncMock()
        mock_table.insert.return_value.execute.return_value.data = [{
            "id": TEST_APP_ID,
            "user_id": TEST_USER_ID,
            "company": "Test Corp",
            "position": "Software Engineer",
            "status": "applied",
            "created_at": "2025-10-13T10:00:00Z",
            "updated_at": "2025-10-13T10:00:00Z",
        }]
        mock_supabase.return_value.table.return_value = mock_table
        
        # Make request
        response = client.post(
            "/applications/",
            headers={"Authorization": "Bearer test-token"},
            json={
                "company": "Test Corp",
                "position": "Software Engineer",
                "status": "applied",
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["company"] == "Test Corp"
        assert data["position"] == "Software Engineer"


@pytest.mark.asyncio
async def test_list_applications_with_pagination(mock_jwt):
    """Test listing applications with pagination."""
    with patch("app.services.applications.get_supabase_client") as mock_supabase:
        # Mock query response
        mock_query = AsyncMock()
        mock_query.execute.return_value.data = [
            {
                "id": TEST_APP_ID,
                "company": "Test Corp",
                "position": "Engineer",
                "status": "applied",
            }
        ]
        mock_query.execute.return_value.count = 1
        
        mock_table = AsyncMock()
        mock_table.select.return_value = mock_query
        mock_query.eq.return_value = mock_query
        mock_query.ilike.return_value = mock_query
        mock_query.range.return_value = mock_query
        mock_query.order.return_value = mock_query
        
        mock_supabase.return_value.table.return_value = mock_table
        
        response = client.get(
            "/applications/?skip=0&limit=10",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["skip"] == 0
        assert data["limit"] == 10


@pytest.mark.asyncio
async def test_list_applications_with_filters(mock_jwt):
    """Test listing applications with status filter."""
    with patch("app.services.applications.get_supabase_client") as mock_supabase:
        mock_query = AsyncMock()
        mock_query.execute.return_value.data = []
        mock_query.execute.return_value.count = 0
        
        mock_table = AsyncMock()
        mock_table.select.return_value = mock_query
        mock_query.eq.return_value = mock_query
        mock_query.range.return_value = mock_query
        mock_query.order.return_value = mock_query
        
        mock_supabase.return_value.table.return_value = mock_table
        
        response = client.get(
            "/applications/?status=applied",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200


def test_get_application_not_found(mock_jwt):
    """Test getting a non-existent application."""
    with patch("app.services.applications.get_supabase_client") as mock_supabase:
        mock_query = AsyncMock()
        mock_query.execute.return_value.data = []
        
        mock_table = AsyncMock()
        mock_table.select.return_value = mock_query
        mock_query.eq.return_value = mock_query
        
        mock_supabase.return_value.table.return_value = mock_table
        
        response = client.get(
            f"/applications/{TEST_APP_ID}",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 404


def test_update_application_partial(mock_jwt):
    """Test partial update of an application."""
    with patch("app.services.applications.get_supabase_client") as mock_supabase:
        mock_query = AsyncMock()
        mock_query.execute.return_value.data = [{
            "id": TEST_APP_ID,
            "company": "Test Corp",
            "position": "Engineer",
            "status": "interviewing",  # Updated status
        }]
        
        mock_table = AsyncMock()
        mock_table.update.return_value = mock_query
        mock_query.eq.return_value = mock_query
        
        mock_supabase.return_value.table.return_value = mock_table
        
        response = client.patch(
            f"/applications/{TEST_APP_ID}",
            headers={"Authorization": "Bearer test-token"},
            json={"status": "interviewing"}
        )
        
        assert response.status_code == 200


def test_delete_application(mock_jwt):
    """Test deleting an application."""
    with patch("app.services.applications.get_supabase_client") as mock_supabase:
        mock_query = AsyncMock()
        mock_query.execute.return_value.data = [{"id": TEST_APP_ID}]
        
        mock_table = AsyncMock()
        mock_table.delete.return_value = mock_query
        mock_query.eq.return_value = mock_query
        
        mock_supabase.return_value.table.return_value = mock_table
        
        response = client.delete(
            f"/applications/{TEST_APP_ID}",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 204


