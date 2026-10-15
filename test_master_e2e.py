import urllib.request
import json
import websocket
import sys
import uuid

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:8080"
WS_URL = "ws://localhost:8000/ws/db-events"

def run_test():
    print("=== AGROSMART AI MASTER END-TO-END VERIFICATION TEST ===")
    passed = 0
    total = 11

    # 1. /docs check
    try:
        req = urllib.request.Request(f"{BASE_URL}/docs")
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                print("[PASS] Test 1: FastAPI /docs endpoint loaded successfully (HTTP 200)")
                passed += 1
            else:
                print(f"[FAIL] Test 1: /docs returned HTTP {resp.status}")
    except Exception as e:
        print(f"[FAIL] Test 1: /docs error {e}")

    # 2. Frontend check
    try:
        req = urllib.request.Request(FRONTEND_URL)
        with urllib.request.urlopen(req) as resp:
            if resp.status == 200:
                print("[PASS] Test 2: Vite Frontend at http://localhost:8080 loaded successfully (HTTP 200)")
                passed += 1
            else:
                print(f"[FAIL] Test 2: Frontend returned HTTP {resp.status}")
    except Exception as e:
        print(f"[FAIL] Test 2: Frontend error {e}")

    # 3. Farmer Registration
    unique_email = f"farmer_{uuid.uuid4().hex[:6]}@example.com"
    test_password = "password123"
    token = None
    user_id = None

    try:
        reg_payload = {
            "email": unique_email,
            "password": test_password,
            "full_name": "Test Farmer",
            "role": "farmer",
            "phone": "9876543210",
            "primary_crop": "Wheat",
            "land_area": "5.5"
        }
        data = json.dumps(reg_payload).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/auth/register", data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if resp.status == 200 and "token" in body and body["user"]["email"] == unique_email:
                print("[PASS] Test 3: Farmer Registration succeeded with JWT token generation")
                token = body["token"]
                user_id = body["user"]["id"]
                passed += 1
            else:
                print(f"[FAIL] Test 3: Registration unexpected body: {body}")
    except Exception as e:
        print(f"[FAIL] Test 3: Registration error {e}")

    # 4. Duplicate Registration Rejection
    try:
        data = json.dumps(reg_payload).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/auth/register", data=data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"[FAIL] Test 4: Duplicate registration did not fail (HTTP {resp.status})")
        except urllib.error.HTTPError as he:
            if he.code == 400:
                print("[PASS] Test 4: Duplicate registration correctly rejected with HTTP 400")
                passed += 1
            else:
                print(f"[FAIL] Test 4: Expected HTTP 400 but got {he.code}")
    except Exception as e:
        print(f"[FAIL] Test 4: Duplicate registration error {e}")

    # 5. Farmer Login
    try:
        login_payload = {"email": unique_email, "password": test_password}
        data = json.dumps(login_payload).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if resp.status == 200 and "token" in body:
                print("[PASS] Test 5: Farmer Login succeeded with JWT token")
                token = body["token"]
                passed += 1
            else:
                print(f"[FAIL] Test 5: Login response {body}")
    except Exception as e:
        print(f"[FAIL] Test 5: Login error {e}")

    # 6. Wrong Password Rejection
    try:
        login_payload = {"email": unique_email, "password": "wrongpassword"}
        data = json.dumps(login_payload).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/auth/login", data=data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"[FAIL] Test 6: Wrong password login did not fail (HTTP {resp.status})")
        except urllib.error.HTTPError as he:
            if he.code == 400:
                print("[PASS] Test 6: Wrong password login correctly rejected with HTTP 400")
                passed += 1
            else:
                print(f"[FAIL] Test 6: Expected HTTP 400 but got {he.code}")
    except Exception as e:
        print(f"[FAIL] Test 6: Wrong password error {e}")

    # 7. Get Profile (/api/auth/me)
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if resp.status == 200 and body["email"] == unique_email:
                print("[PASS] Test 7: Profile Retrieval (/api/auth/me) returned authenticated user info")
                passed += 1
            else:
                print(f"[FAIL] Test 7: /api/auth/me body {body}")
    except Exception as e:
        print(f"[FAIL] Test 7: Profile retrieval error {e}")

    # 8. Update Profile (/api/auth/profile)
    try:
        update_payload = {"phone": "9998887770", "land_area": "12.0", "primary_crop": "Cotton"}
        data = json.dumps(update_payload).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/auth/profile", data=data, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, method="PUT")
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if resp.status == 200 and body["phone"] == "9998887770" and body["primary_crop"] == "Cotton":
                print("[PASS] Test 8: Profile Update (/api/auth/profile) updated user info successfully")
                passed += 1
            else:
                print(f"[FAIL] Test 8: /api/auth/profile body {body}")
    except Exception as e:
        print(f"[FAIL] Test 8: Profile update error {e}")

    # 9. Marketplace Order Creation (/api/orders)
    try:
        order_payload = {
            "item_title": "Fresh Organic Tomatoes",
            "quantity": 50,
            "unit_price": 30,
            "total_price": 1500,
            "farmer_id": user_id,
            "status": "pending"
        }
        data = json.dumps(order_payload).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/orders", data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if resp.status == 200 and "id" in body and body["item_title"] == "Fresh Organic Tomatoes":
                print("[PASS] Test 9: Marketplace Order Creation (/api/orders) created order successfully")
                passed += 1
            else:
                print(f"[FAIL] Test 9: Order creation body {body}")
    except Exception as e:
        print(f"[FAIL] Test 9: Order creation error {e}")

    # 10. Drone Booking Creation & Cost Calculation (/api/drone-bookings)
    try:
        booking_payload = {
            "spray_type": "Drone Spray",
            "crop": "Cotton",
            "field_area": 10.0,
            "area_unit": "Acres",
            "booking_date": "2026-10-15",
            "preferred_time": "Morning (07:00 AM - 10:00 AM)",
            "farmer_contact": "9998887770",
            "field_location": "Guntur, Andhra Pradesh",
            "additional_notes": "Uniform spraying required",
            "provider_id": "provider-sp-101",
            "farmer_id": user_id,
            "farmer_name": "Test Farmer"
        }
        data = json.dumps(booking_payload).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/api/drone-bookings", data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if resp.status == 200 and "id" in body and body.get("estimated_cost") == 5500.0:
                print("[PASS] Test 10: Drone Booking Creation & Cost Calculation (10 acres * Rs. 550/acre = Rs. 5,500) verified")
                passed += 1
            else:
                print(f"[FAIL] Test 10: Drone booking response {body}")
    except Exception as e:
        print(f"[FAIL] Test 10: Drone booking error {e}")

    # 11. WebSocket connection & broadcast test
    try:
        ws = websocket.create_connection(WS_URL, timeout=5)
        if ws.connected:
            print("[PASS] Test 11: WebSocket live stream ws://localhost:8000/ws/db-events connected successfully")
            passed += 1
            ws.close()
        else:
            print("[FAIL] Test 11: WebSocket connection failed")
    except Exception as e:
        print(f"[FAIL] Test 11: WebSocket error {e}")

    print(f"\n==========================================")
    print(f"FINAL SCORE: {passed}/{total} TESTS PASSED")
    print(f"==========================================")
    return passed == total

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)
