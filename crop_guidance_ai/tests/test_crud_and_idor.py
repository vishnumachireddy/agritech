import sys
import os
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from auth import create_access_token

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_table_allowlist_rejection(client: TestClient):
    # Attempting to read an unallowed table must be rejected with HTTP 400
    res = client.get("/api/forbidden_system_config")
    assert res.status_code == 400
    assert "not permitted" in res.text

def test_profiles_password_field_never_leaked(client: TestClient):
    # Password field must be stripped from profiles responses
    res = client.get("/api/profiles")
    assert res.status_code == 200
    profiles = res.json()
    assert isinstance(profiles, list)
    for p in profiles:
        assert "password" not in p, f"Security Violation: Password exposed in profile {p.get('email')}"

def test_order_status_validation(client: TestClient):
    # Invalid order status must be rejected
    invalid_payload = {"status": "INVALID_HACKED_STATUS"}
    res = client.put("/api/orders?id=test-order-999", json=invalid_payload)
    assert res.status_code == 400
    assert "Invalid order status" in res.text

def test_profile_update_idor_protection(client: TestClient):
    # User A attempting to update User B's profile must be rejected with 403 Forbidden
    token_user_a = create_access_token({"sub": "user-a-111", "role": "farmer"})
    res = client.put(
        "/api/profiles?id=user-b-222",
        json={"full_name": "Attacker Name"},
        headers={"Authorization": f"Bearer {token_user_a}"}
    )
    assert res.status_code == 403
    assert "Cannot modify another user's profile" in res.text

def test_spray_providers_endpoint(client: TestClient):
    res = client.get("/api/spray-providers")
    assert res.status_code == 200
    providers = res.json()
    assert len(providers) > 0
    assert "provider_name" in providers[0]
    assert "rate_per_acre" in providers[0]
