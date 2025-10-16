"""
Tests for Application Events Endpoints

These tests verify event tracking functionality:
- Creating events
- Listing application events
- Status updates via events
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from app.main import app

client = TestClient(app)

# Mock IDs for testing
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
TEST_APP_ID = "11111111-1111-1111-1111-111111111111"
TEST_EVENT_ID = "22222222-2222-2222-2222-222222222222"


@pytest.fixture
def mock_jwt():
    """Mock JWT token verification."""
    with patch("app.auth.verify_jwt_token") as mock_verify:
        mock_verify.return_value = {"sub": TEST_USER_ID, "email": "test@example.com"}
        yield mock_verify


def test_get_events_requires_auth():
    """Test that getting events requires authentication."""
    response = client.get(f"/applications/{TEST_APP_ID}/events")
    assert response.status_code == 403


def test_create_event_requires_auth():
    """Test that creating events requires authentication."""
    response = client.post(
        f"/applications/{TEST_APP_ID}/events",
        json={"event_type": "note", "notes": "Test note"}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_application_events(mock_jwt):
    """Test getting events for an application."""
    with patch("app.routers.events.get_supabase_client") as mock_supabase:
        # Mock application existence check
        mock_app_query = AsyncMock()
        mock_app_query.execute.return_value.data = [{"id": TEST_APP_ID}]
        
        # Mock events query
        mock_events_query = AsyncMock()
        mock_events_query.execute.return_value.data = [
            {
                "id": TEST_EVENT_ID,
                "application_id": TEST_APP_ID,
                "event_type": "status_change",
                "status": "interviewing",
                "notes": "Interview scheduled",
                "metadata": {},
                "created_at": "2025-10-13T10:00:00Z"
            }
        ]
        
        # Setup mock chaining
        mock_table = AsyncMock()
        mock_table.select.return_value = mock_app_query
        mock_app_query.eq.return_value = mock_app_query
        
        # For events query
        def table_side_effect(table_name):
            if table_name == "applications":
                return mock_table
            else:  # application_events
                events_table = AsyncMock()
                events_table.select.return_value = mock_events_query
                mock_events_query.eq.return_value = mock_events_query
                mock_events_query.order.return_value = mock_events_query
                return events_table
        
        mock_supabase.return_value.table.side_effect = table_side_effect
        
        response = client.get(
            f"/applications/{TEST_APP_ID}/events",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "event_type" in data[0]


@pytest.mark.asyncio
async def test_create_application_event(mock_jwt):
    """Test creating a new event for an application."""
    with patch("app.routers.events.get_supabase_client") as mock_supabase:
        # Mock application existence check
        mock_app_query = AsyncMock()
        mock_app_query.execute.return_value.data = [{"id": TEST_APP_ID}]
        
        # Mock event creation
        mock_event_query = AsyncMock()
        mock_event_query.execute.return_value.data = [{
            "id": TEST_EVENT_ID,
            "application_id": TEST_APP_ID,
            "event_type": "phone_screen",
            "status": "screening",
            "notes": "Had phone screen with recruiter",
            "metadata": {"interviewer": "Jane Smith"},
            "created_at": "2025-10-13T10:00:00Z"
        }]
        
        # Mock status update
        mock_update_query = AsyncMock()
        mock_update_query.execute.return_value.data = [{}]
        
        # Setup mock chaining
        call_count = [0]
        
        def table_side_effect(table_name):
            call_count[0] += 1
            mock_table = AsyncMock()
            
            if call_count[0] == 1:  # First call: check app exists
                mock_table.select.return_value = mock_app_query
                mock_app_query.eq.return_value = mock_app_query
            elif call_count[0] == 2:  # Second call: insert event
                mock_table.insert.return_value = mock_event_query
            else:  # Third call: update status
                mock_table.update.return_value = mock_update_query
                mock_update_query.eq.return_value = mock_update_query
            
            return mock_table
        
        mock_supabase.return_value.table.side_effect = table_side_effect
        
        response = client.post(
            f"/applications/{TEST_APP_ID}/events",
            headers={"Authorization": "Bearer test-token"},
            json={
                "event_type": "phone_screen",
                "status": "screening",
                "notes": "Had phone screen with recruiter",
                "metadata": {"interviewer": "Jane Smith"}
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["event_type"] == "phone_screen"
        assert data["status"] == "screening"


def test_get_events_for_nonexistent_application(mock_jwt):
    """Test getting events for application that doesn't exist."""
    with patch("app.routers.events.get_supabase_client") as mock_supabase:
        # Mock application not found
        mock_query = AsyncMock()
        mock_query.execute.return_value.data = []
        
        mock_table = AsyncMock()
        mock_table.select.return_value = mock_query
        mock_query.eq.return_value = mock_query
        
        mock_supabase.return_value.table.return_value = mock_table
        
        response = client.get(
            f"/applications/{TEST_APP_ID}/events",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 404


