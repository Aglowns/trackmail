"""
Pytest Configuration and Shared Fixtures

This file is automatically loaded by pytest and provides:
- Shared test fixtures (reusable test dependencies)
- Test configuration
- Mock data factories
- Database setup/teardown for tests

Fixtures are a powerful pytest feature that:
- Set up test dependencies
- Provide test data
- Clean up after tests
- Can be composed (fixtures can use other fixtures)
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    """
    Provide a test client for making API requests.
    
    This fixture can be used in any test by adding it as a parameter:
    
    def test_something(client):
        response = client.get("/endpoint")
        assert response.status_code == 200
    
    Returns:
        TestClient: FastAPI test client
    """
    return TestClient(app)


@pytest.fixture
def mock_user_id() -> str:
    """
    Provide a mock user ID for testing.
    
    Returns:
        str: A valid UUID4 string for testing
    """
    return "123e4567-e89b-12d3-a456-426614174000"


@pytest.fixture
def mock_jwt_token() -> str:
    """
    Provide a mock JWT token for testing.
    
    In actual tests, you'll want to mock the token validation,
    but this can be useful for testing token parsing.
    
    Returns:
        str: A fake JWT token string
    """
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.fake"


@pytest.fixture
def auth_headers(mock_jwt_token: str) -> dict[str, str]:
    """
    Provide authentication headers for testing protected endpoints.
    
    Usage:
        def test_protected_endpoint(client, auth_headers):
            response = client.get("/protected", headers=auth_headers)
    
    Args:
        mock_jwt_token: Mock JWT token from fixture
        
    Returns:
        dict: Headers dictionary with Authorization header
    """
    return {
        "Authorization": f"Bearer {mock_jwt_token}"
    }


# Fixtures for Stage 4+ testing:

# @pytest.fixture
# async def db_session():
#     """
#     Provide a database session for testing.
#     
#     This would create a test database or use a transaction
#     that's rolled back after each test.
#     """
#     # Setup: Create test database connection
#     # yield session
#     # Teardown: Rollback or cleanup
#     pass


# @pytest.fixture
# def sample_application():
#     """
#     Provide sample application data for testing.
#     """
#     return {
#         "company": "Acme Corp",
#         "position": "Software Engineer",
#         "status": "applied",
#         "source_url": "https://example.com/job",
#     }


# @pytest.fixture
# def sample_email():
#     """
#     Provide sample email data for testing email parsing.
#     """
#     return {
#         "sender": "jobs@company.com",
#         "subject": "Application Received - Software Engineer",
#         "text_body": "Thank you for your application...",
#     }


# Pytest configuration options
def pytest_configure(config: pytest.Config) -> None:
    """
    Configure pytest with custom markers and settings.
    
    Args:
        config: Pytest configuration object
    """
    config.addinivalue_line(
        "markers",
        "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers",
        "integration: marks tests as integration tests"
    )

