"""
Tests for Email Ingestion Endpoint

These tests verify the email ingestion functionality:
- Email parsing
- Application creation from emails
- Deduplication logic
- Error handling
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from datetime import datetime

from app.main import app
from app.schemas import EmailIngest

client = TestClient(app)

# Mock user ID for testing
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
TEST_APP_ID = "11111111-1111-1111-1111-111111111111"


@pytest.fixture
def mock_jwt():
    """Mock JWT token verification."""
    with patch("app.auth.verify_jwt_token") as mock_verify:
        mock_verify.return_value = {"sub": TEST_USER_ID, "email": "test@example.com"}
        yield mock_verify


@pytest.fixture
def sample_email():
    """Provide a sample email for testing."""
    return {
        "sender": "jobs@acme.com",
        "subject": "Application Received - Software Engineer",
        "text_body": "Thank you for applying to Acme Corp for the Software Engineer position.",
        "html_body": "<p>Thank you for applying...</p>",
        "received_at": "2025-10-13T10:00:00Z"
    }


def test_ingest_email_requires_auth(sample_email):
    """Test that email ingestion requires authentication."""
    response = client.post("/ingest/email", json=sample_email)
    assert response.status_code == 403  # Forbidden without auth


@pytest.mark.asyncio
async def test_ingest_email_success(mock_jwt, sample_email):
    """Test successful email ingestion and application creation."""
    with patch("app.services.emails.check_duplicate_email") as mock_check_dup, \
         patch("app.services.applications.get_supabase_client") as mock_supabase_app, \
         patch("app.services.emails.get_supabase_client") as mock_supabase_email:
        
        # Mock no duplicate
        mock_check_dup.return_value = None
        
        # Mock application creation
        mock_app_query = AsyncMock()
        mock_app_query.execute.return_value.data = [{
            "id": TEST_APP_ID,
            "user_id": TEST_USER_ID,
            "company": "Acme",
            "position": "Software Engineer",
            "status": "applied",
        }]
        mock_app_table = AsyncMock()
        mock_app_table.insert.return_value = mock_app_query
        mock_supabase_app.return_value.table.return_value = mock_app_table
        
        # Mock email storage
        mock_email_query = AsyncMock()
        mock_email_query.execute.return_value.data = [{"id": "email-id"}]
        mock_email_table = AsyncMock()
        mock_email_table.insert.return_value = mock_email_query
        mock_supabase_email.return_value.table.return_value = mock_email_table
        
        response = client.post(
            "/ingest/email",
            headers={"Authorization": "Bearer test-token"},
            json=sample_email
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["duplicate"] is False
        assert "application_id" in data


@pytest.mark.asyncio
async def test_ingest_email_duplicate(mock_jwt, sample_email):
    """Test duplicate email detection."""
    with patch("app.services.emails.check_duplicate_email") as mock_check_dup:
        # Mock existing duplicate
        mock_check_dup.return_value = {
            "id": "existing-email-id",
            "application_id": TEST_APP_ID,
        }
        
        response = client.post(
            "/ingest/email",
            headers={"Authorization": "Bearer test-token"},
            json=sample_email
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["duplicate"] is True
        assert data["application_id"] == TEST_APP_ID


@pytest.mark.asyncio
async def test_ingest_email_parsing_failure(mock_jwt):
    """Test email with insufficient parsing data."""
    with patch("app.services.emails.check_duplicate_email") as mock_check_dup, \
         patch("app.services.emails.get_supabase_client") as mock_supabase:
        
        mock_check_dup.return_value = None
        
        # Mock email storage for unparseable email
        mock_query = AsyncMock()
        mock_query.execute.return_value.data = [{"id": "email-id"}]
        mock_table = AsyncMock()
        mock_table.insert.return_value = mock_query
        mock_supabase.return_value.table.return_value = mock_table
        
        # Email with no useful information
        bad_email = {
            "sender": "noreply@example.com",
            "subject": "FW: Random email",
            "text_body": "Just some text",
        }
        
        response = client.post(
            "/ingest/email",
            headers={"Authorization": "Bearer test-token"},
            json=bad_email
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["application_id"] is None


def test_test_email_parsing(mock_jwt, sample_email):
    """Test the email parsing test endpoint."""
    with patch("app.services.emails.check_duplicate_email") as mock_check_dup:
        mock_check_dup.return_value = None
        
        response = client.post(
            "/ingest/email/test",
            headers={"Authorization": "Bearer test-token"},
            json=sample_email
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "parsed" in data
        assert "email_hash" in data
        assert "would_create_duplicate" in data
        assert data["parsed"]["company"] == "Acme"
        assert data["parsed"]["position"] == "Software Engineer"


def test_parsing_service_extracts_company():
    """Test company extraction from sender email."""
    from app.services.parsing import extract_company_from_sender
    
    assert extract_company_from_sender("jobs@acme.com") == "Acme"
    assert extract_company_from_sender("hr@bigtech.com") == "Bigtech"
    assert extract_company_from_sender("noreply@greenhouse.io") is None  # Platform


def test_parsing_service_extracts_position():
    """Test position extraction from subject."""
    from app.services.parsing import extract_position_from_subject
    
    assert extract_position_from_subject("Application Received - Software Engineer") == "Software Engineer"
    assert extract_position_from_subject("Your application for Senior Developer") == "Senior Developer"


def test_parsing_service_detects_status():
    """Test status detection from email content."""
    from app.services.parsing import detect_status_from_content
    
    assert detect_status_from_content("Application received", "Thank you") == "applied"
    assert detect_status_from_content("Interview scheduled", "We'd like to meet") == "interviewing"
    assert detect_status_from_content("Unfortunately", "not moving forward") == "rejected"
    assert detect_status_from_content("Congratulations!", "pleased to offer") == "offer"


