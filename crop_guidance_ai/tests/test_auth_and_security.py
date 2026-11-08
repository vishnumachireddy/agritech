import sys
import os
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from auth import get_password_hash, verify_password, create_access_token, decode_access_token

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

# --- Auth & Password Security Tests ---

def test_password_hashing_and_verification():
    raw_pass = "SecurePass2026!"
    hashed = get_password_hash(raw_pass)
    assert hashed.startswith("$2b$")
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_legacy_sha256_backward_compatibility():
    # Legacy hash of 'farmer123' with salt 'agri_assist_static_salt_2026'
    legacy_hash = "b122cc4c8d5e1b0f16ab534e8934b5066a704f8b196e4ab70253b4773ea0ab71"
    assert verify_password("farmer123", legacy_hash) is True
    assert verify_password("wrong_password", legacy_hash) is False

def test_jwt_token_creation_and_decoding():
    payload = {"sub": "test-farmer-01", "role": "farmer"}
    token = create_access_token(payload)
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "test-farmer-01"
    assert decoded["role"] == "farmer"
    assert "exp" in decoded

def test_invalid_jwt_token_rejection():
    assert decode_access_token("invalid.token.structure") is None

def test_health_endpoints(client: TestClient):
    res = client.get("/healthz")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "components" in data

def test_request_correlation_id_header(client: TestClient):
    custom_id = "test-req-corr-12345"
    res = client.get("/readyz", headers={"X-Request-ID": custom_id})
    assert res.status_code == 200
    assert res.headers.get("X-Request-ID") == custom_id
    assert "X-Process-Time" in res.headers
