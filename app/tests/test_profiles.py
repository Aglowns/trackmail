from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def test_get_profile_requires_auth():
    client = TestClient(app)
    response = client.get("/v1/profiles/me")
    assert response.status_code in {401, 403}
