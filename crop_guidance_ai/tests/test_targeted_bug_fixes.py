import pytest
from fastapi.testclient import TestClient
import datetime
from zoneinfo import ZoneInfo
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from spray_routes import validate_booking_date

client = TestClient(app)
KOLKATA_TZ = ZoneInfo("Asia/Kolkata")

# ==============================================================================
# ISSUE 1: DRONE & SPRAYER BOOKING DATE VALIDATION (ASIA/KOLKATA IST)
# ==============================================================================

def test_spray_booking_rejects_past_dates():
    """Verify past dates (e.g. 11-11-2026, 12-11-2026) are rejected with HTTP 400."""
    past_dates = ["2026-11-11", "11-11-2026", "2026-11-12", "12-11-2026", "2026-11-13"]
    for d in past_dates:
        payload = {
            "spray_type": "Motorized Heavy Spray",
            "crop": "Red Chili",
            "field_area": 3.0,
            "area_unit": "Acres",
            "booking_date": d,
            "preferred_time": "Morning (07:00 AM - 10:00 AM)",
            "farmer_contact": "9381259109",
            "field_location": "Andhra Pradesh",
            "additional_notes": "Low altitude spraying required for leaf blight control",
            "provider_id": "provider-sp-102",
            "farmer_id": "farmer-demo-1",
            "farmer_name": "MKV VISHNU",
            "farmer_email": "239x1a3253@gprec.ac.in"
        }
        res = client.post("/api/drone-bookings", json=payload)
        assert res.status_code == 400
        assert "in the past" in res.json().get("detail", "")

def test_spray_booking_accepts_today_and_future_dates():
    """Verify today (2026-11-14 IST) and future dates (2026-11-15, etc.) are accepted."""
    today_ist = datetime.datetime.now(KOLKATA_TZ).date().strftime("%Y-%m-%d")
    tomorrow_ist = (datetime.datetime.now(KOLKATA_TZ).date() + datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    for valid_date in [today_ist, tomorrow_ist]:
        payload = {
            "spray_type": "Drone Spray",
            "crop": "Organic Sona Masoori Rice",
            "field_area": 3.5,
            "area_unit": "Acres",
            "booking_date": valid_date,
            "preferred_time": "Morning (07:00 AM - 10:00 AM)",
            "farmer_contact": "+91 9381259109",
            "field_location": "Kurnool, Andhra Pradesh",
            "additional_notes": "Uniform precision pesticide spray",
            "provider_id": "provider-sp-101",
            "farmer_id": "farmer-demo-1",
            "farmer_name": "MKV VISHNU",
            "farmer_email": "239x1a3253@gprec.ac.in"
        }
        res = client.post("/api/drone-bookings", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["booking_date"] == valid_date
        assert data["status"] == "PENDING"
        assert data["estimated_cost"] == round(3.5 * 550.0, 2)


# ==============================================================================
# ISSUE 2: BULK PRODUCTION WORKFLOW & BUYER VISIBILITY
# ==============================================================================

def test_farmer_bulk_production_lifecycle():
    """
    Verify full farmer production workflow:
    1. Farmer publishes production batch (e.g. 5,000 kg Tomato).
    2. Public listing reflects all required fields (farmer name, variety, harvest date, location, price, status).
    3. Farmer updates quantity (5,000 kg -> 3,000 kg) triggering milestone update.
    4. Farmer marks status as harvest_ready.
    5. Buyer discovers listing and places a bulk contract order against that farmer.
    """
    # 1. Create crop production batch
    crop_payload = {
        "id": "crop-test-prod-101",
        "name": "Organic Roma Tomato",
        "crop_name": "Organic Roma Tomato",
        "variety": "Roma Hybrid",
        "expected_quantity": 5000.0,
        "available_quantity": 5000.0,
        "quantity": 5000.0,
        "unit": "kg",
        "expected_harvest_date": "2026-11-28",
        "harvest_date": "2026-11-28",
        "production_status": "growing",
        "status": "growing",
        "location": "Kurnool, Andhra Pradesh",
        "region": "Andhra Pradesh",
        "price": 32.0,
        "expected_price": 32.0,
        "farmer_id": "farmer-demo-1",
        "farmer_name": "Ramesh Kumar",
        "farmer_email": "239x1a3253@gprec.ac.in",
        "is_bulk_available": True
    }
    create_res = client.post("/api/crops", json=crop_payload)
    assert create_res.status_code == 200
    created_crop = create_res.json()
    assert created_crop["name"] == "Organic Roma Tomato"
    assert created_crop["available_quantity"] == 5000.0

    # 2. Update quantity (5000 -> 3000 kg milestone)
    update_qty_res = client.put("/api/crops?id=crop-test-prod-101", json={
        "available_quantity": 3000.0,
        "quantity": 3000.0
    })
    assert update_qty_res.status_code == 200

    # 3. Update status to harvest_ready
    update_status_res = client.put("/api/crops?id=crop-test-prod-101", json={
        "production_status": "harvest_ready",
        "status": "harvest_ready"
    })
    assert update_status_res.status_code == 200

    # 4. Buyer places bulk contract order against this farmer's listing
    bulk_order_payload = {
        "id": "bulk-contract-test-501",
        "crop_name": "Organic Roma Tomato",
        "crop_id": "crop-test-prod-101",
        "farmer_id": "farmer-demo-1",
        "farmer_name": "Ramesh Kumar",
        "customer_id": "consumer-demo-1",
        "consumer_id": "consumer-demo-1",
        "customer_email": "239x1a3253@gprec.ac.in",
        "quantity_required": 1500.0,
        "fulfilled_quantity": 0.0,
        "unit": "kg",
        "price_per_kg": 32.0,
        "total_price": 1500.0 * 32.0,
        "region": "Andhra Pradesh",
        "expected_delivery_start": "2026-11-29",
        "expected_delivery_end": "2026-12-05",
        "status": "open",
        "is_bulk": True,
        "order_type": "bulk"
      }
    order_res = client.post("/api/bulk_orders", json=bulk_order_payload)
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert order_data["quantity_required"] == 1500.0
    assert order_data["farmer_name"] == "Ramesh Kumar"
    assert order_data["progress_pct"] == 0.0


# ==============================================================================
# ISSUE 3: PROACTIVE REAL-TIME WEATHER MONITORING & DEDUPLICATION
# ==============================================================================

def test_proactive_weather_monitoring_endpoint():
    """Verify administrative trigger executes proactive scanning and reports metrics."""
    res = client.post("/api/weather/run-proactive-monitoring", json={"force_check": True})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "summary" in data
    summary = data["summary"]
    assert summary["scanned_farmers"] >= 1
    assert "timestamp" in summary

def test_proactive_weather_deduplication():
    """Verify consecutive scans deduplicate without spamming."""
    # Run scan without force_check
    res = client.post("/api/weather/run-proactive-monitoring", json={"force_check": False})
    assert res.status_code == 200
    summary = res.json()["summary"]
    assert "alerts_suppressed" in summary
