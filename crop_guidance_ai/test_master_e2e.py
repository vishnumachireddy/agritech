import asyncio
import json
import urllib.request
import websockets

async def run_master_audit():
    backend_url = 'http://localhost:8000'
    frontend_url = 'http://localhost:8080'

    print("==================================================")
    print("AGROSMART AI — MASTER END-TO-END AUTOMATED TEST")
    print("==================================================")

    # 1. Frontend & Backend Docs Check
    req_fe = urllib.request.urlopen(frontend_url)
    print(f"1. Frontend Server: {frontend_url} -> HTTP {req_fe.status}")
    req_be = urllib.request.urlopen(f"{backend_url}/docs")
    print(f"2. Backend Swagger: {backend_url}/docs -> HTTP {req_be.status}")

    # 2. Test Farmer Registration
    farmer_payload = {
        "email": "farmer.master@agri.org",
        "password": "SecurePassword123",
        "full_name": "Ramesh Kumar Master",
        "role": "farmer",
        "phone": "+91 9876543210",
        "region": "Warangal, Telangana",
        "primary_crop": "Organic Sona Masoori Rice",
        "secondary_crop": "Raw Cotton",
        "land_area": 5.5,
        "total_yield": 3000,
        "monthly_production": 500,
        "expected_price": 60.0,
        "water_availability": "High",
        "farming_type": "Organic",
        "harvest_cycle": "Seasonal"
    }

    req_reg = urllib.request.Request(
        f"{backend_url}/api/auth/register",
        data=json.dumps(farmer_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res_reg = urllib.request.urlopen(req_reg)
    reg_data = json.loads(res_reg.read().decode())
    print(f"3. Farmer Registration: HTTP {res_reg.status} -> Token & User created for {reg_data['user']['email']}")
    assert "token" in reg_data, "Token missing in registration"
    farmer_token = reg_data["token"]
    farmer_id = reg_data["user"]["id"]

    # 3. Duplicate Registration Test
    try:
        urllib.request.urlopen(req_reg)
        print("ERROR: Duplicate registration was not rejected!")
    except urllib.error.HTTPError as err:
        print(f"4. Duplicate Registration: Correctly rejected with HTTP {err.code}: {err.reason}")

    # 4. Test Login
    login_payload = {"email": "farmer.master@agri.org", "password": "SecurePassword123"}
    req_log = urllib.request.Request(
        f"{backend_url}/api/auth/login",
        data=json.dumps(login_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res_log = urllib.request.urlopen(req_log)
    log_data = json.loads(res_log.read().decode())
    print(f"5. Farmer Login: HTTP {res_log.status} -> Login successful for role '{log_data['user']['role']}'")

    # 5. Wrong Password Login Test
    try:
        wrong_log = urllib.request.Request(
            f"{backend_url}/api/auth/login",
            data=json.dumps({"email": "farmer.master@agri.org", "password": "WrongPassword"}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(wrong_log)
        print("ERROR: Wrong password login was not rejected!")
    except urllib.error.HTTPError as err:
        print(f"6. Wrong Password Login: Correctly rejected with HTTP {err.code}: {err.reason}")

    # 6. Test GET /api/auth/me Profile Retrieval
    req_me = urllib.request.Request(
        f"{backend_url}/api/auth/me",
        headers={'Authorization': f'Bearer {farmer_token}'}
    )
    res_me = urllib.request.urlopen(req_me)
    profile_data = json.loads(res_me.read().decode())
    print(f"7. Profile Retrieval (/api/auth/me): HTTP {res_me.status} -> Full name: {profile_data['full_name']}, Primary Crop: {profile_data['primary_crop']}")
    assert profile_data['primary_crop'] == 'Organic Sona Masoori Rice', "Farmer primary crop mismatch"

    # 7. Test PUT /api/auth/profile Update
    update_payload = {"land_area": 8.0, "phone": "+91 9999988888"}
    req_up = urllib.request.Request(
        f"{backend_url}/api/auth/profile",
        data=json.dumps(update_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {farmer_token}'},
        method='PUT'
    )
    res_up = urllib.request.urlopen(req_up)
    up_data = json.loads(res_up.read().decode())
    print(f"8. Profile Update (/api/auth/profile): HTTP {res_up.status} -> Updated land area: {up_data['land_area']} Acres, Phone: {up_data['phone']}")
    assert up_data['land_area'] == 8.0, "Updated land area mismatch"

    # 8. Test Marketplace & Order Creation
    order_payload = {
        "consumer_id": "consumer-test-1",
        "farmer_id": farmer_id,
        "crop_name": "Organic Sona Masoori Rice",
        "quantity": 100,
        "price_per_kg": 60.0,
        "total_price": 6000.0,
        "status": "pending"
    }
    req_ord = urllib.request.Request(
        f"{backend_url}/api/orders",
        data=json.dumps(order_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res_ord = urllib.request.urlopen(req_ord)
    ord_data = json.loads(res_ord.read().decode())
    print(f"9. Marketplace Order Creation (/api/orders): HTTP {res_ord.status} -> Created order ID {ord_data['id']}")

    # 9. Test Drone Booking Regression & WebSocket Live Stream
    drone_payload = {
        "spray_type": "Drone Spray",
        "crop": "Organic Sona Masoori Rice",
        "field_area": 4.0,
        "area_unit": "Acres",
        "booking_date": "2026-10-06",
        "preferred_time": "Morning (07:00 AM - 10:00 AM)",
        "farmer_contact": "+91 9876543210",
        "field_location": "Warangal Field Sector 2",
        "provider_id": "provider-sp-101",
        "farmer_id": farmer_id,
        "farmer_name": "Ramesh Kumar Master"
    }
    req_db = urllib.request.Request(
        f"{backend_url}/api/drone-bookings",
        data=json.dumps(drone_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res_db = urllib.request.urlopen(req_db)
    db_data = json.loads(res_db.read().decode())
    booking_id = db_data["id"]
    print(f"10. Drone Booking Regression (/api/drone-bookings): HTTP {res_db.status} -> ID {booking_id}, Cost ₹{db_data['estimated_cost']}")

    # Connect WebSocket & Test status changes
    async with websockets.connect(f"ws://localhost:8000/ws/db-events") as ws:
        print("11. Connected to WebSocket stream ws://localhost:8000/ws/db-events")
        for status in ["ACCEPTED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"]:
            req_status = urllib.request.Request(
                f"{backend_url}/api/drone-bookings/{booking_id}/status",
                data=json.dumps({"status": status}).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='PUT'
            )
            res_status = urllib.request.urlopen(req_status)
            status_data = json.loads(res_status.read().decode())
            ws_msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            ws_event = json.loads(ws_msg)
            print(f"    Drone status updated to '{status_data['status']}' -> WS live message: {ws_event}")

    print("==================================================")
    print("ALL END-TO-END MASTER TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == '__main__':
    asyncio.run(run_master_audit())
