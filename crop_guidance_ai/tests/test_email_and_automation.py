import pytest
from fastapi.testclient import TestClient
from main import app
from api_routes import OTP_STORE

client = TestClient(app)

def test_otp_generation_verification_and_expiry():
    email = "farmer_otp_test@agri.com"
    # 1. Request OTP
    res = client.post("/api/auth/send-otp", json={"email": email, "purpose": "registration"})
    assert res.status_code == 200
    assert res.json()["success"] is True

    # 2. Verify with wrong OTP
    res_bad = client.post("/api/auth/verify-otp", json={"email": email, "otp": "000000"})
    assert res_bad.status_code == 400

    # 3. Verify with correct OTP
    correct_otp = OTP_STORE.get(email, {}).get("otp")
    assert correct_otp is not None
    assert len(correct_otp) == 6

    res_good = client.post("/api/auth/verify-otp", json={"email": email, "otp": correct_otp})
    assert res_good.status_code == 200
    assert res_good.json()["verified"] is True

def test_password_reset_with_otp():
    email = "farmer@agri.com"
    # 1. Send OTP
    client.post("/api/auth/send-otp", json={"email": email, "purpose": "password_reset"})
    otp = OTP_STORE.get(email, {}).get("otp")
    assert otp is not None

    # 2. Reset password
    res = client.post("/api/auth/reset-password", json={
        "email": email,
        "otp": otp,
        "new_password": "NewSecretPassword2026!"
    })
    assert res.status_code == 200
    assert res.json()["success"] is True

    # 3. Test login with newly updated password
    res_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "NewSecretPassword2026!"
    })
    assert res_login.status_code == 200
    assert "token" in res_login.json()

def test_automated_weather_defense_scan():
    res = client.post("/api/weather/automated-defense-scan", json={
        "location_name": "Kurnool, Andhra Pradesh",
        "force_alert": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["automated_alert_triggered"] is True
    assert data["severity"] in ("WARNING", "CRITICAL")
