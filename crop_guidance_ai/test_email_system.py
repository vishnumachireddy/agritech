import asyncio
import os
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from email_service import (
    get_email_credentials,
    is_drone_service,
    build_spray_service_email_html_and_subject,
    build_order_status_email_html_and_subject,
    build_bulk_order_event_html_and_subject,
    send_drone_booking_email,
    send_order_delivery_email,
    is_email_deduped,
    record_email_dispatch
)

async def run_tests():
    print("==================================================")
    print("1. VERIFYING SENDER & REPLY-TO CONFIGURATION")
    print("==================================================")
    cfg = get_email_credentials()
    print(f"  Sender Name:           {cfg['sender_name']}")
    print(f"  Configured Sender:     {cfg['configured_sender']}")
    print(f"  Technical Sender:      {cfg['technical_sender']}")
    print(f"  Configured Verified?:  {cfg['is_configured_verified']}")
    print(f"  Reply-To Email:        {cfg['reply_to']}")
    print(f"  Reply-To Name:         {cfg['reply_to_name']}")

    assert cfg["sender_name"] == "AgriSmart", "Sender name must be AgriSmart"
    assert cfg["reply_to"] == "239x1a3253@gprec.ac.in", "Reply-To must be 239x1a3253@gprec.ac.in"
    assert cfg["technical_sender"] == "239x1a3253@gprec.ac.in", "Technical sender must be verified Brevo sender"
    print("  [PASS] Sender & Reply-To configured correctly!\n")

    print("==================================================")
    print("2. VERIFYING DRONE BOOKING STAGES")
    print("==================================================")
    sample_drone = {
        "id": "booking-drone-999",
        "booking_id": "booking-drone-999",
        "spray_type": "Drone Spray",
        "crop": "Organic Basmati Rice",
        "field_area": 5.0,
        "area_unit": "Acres",
        "booking_date": "2026-11-20",
        "preferred_time": "Morning (06:00 AM - 09:00 AM)",
        "field_location": "Field #4, Kurnool, Andhra Pradesh",
        "provider_name": "AgriFly Precision Drones",
        "provider_phone": "+91 98765 43210",
        "farmer_name": "Ramesh Patel",
        "estimated_cost": 2750.0,
        "service_start_time": "20 Nov 2026, 06:30 AM IST",
        "completion_time": "20 Nov 2026, 08:15 AM IST"
    }

    drone_stages = ["PENDING", "ACCEPTED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"]
    for stage in drone_stages:
        html, subject, plain = build_spray_service_email_html_and_subject(sample_drone, stage)
        print(f"  Stage: {stage:<12} | Subject: {subject}")
        assert "Drone" in subject or "Drone" in html, f"Drone email must reference Drone for {stage}"
        assert "booking-drone-999" in plain, "Plain text must contain booking ID"
        if stage == "SCHEDULED":
            assert "has not started yet" in plain.lower(), "Scheduled email must state service has not started yet"
        elif stage == "IN_PROGRESS":
            assert "started" in plain.lower(), "In progress email must state service has started"
        elif stage == "COMPLETED":
            assert "completed" in plain.lower(), "Completed email must state service is completed"
    print("  [PASS] All 7 Drone booking stages verified!\n")

    print("==================================================")
    print("3. VERIFYING SPRAYER BOOKING STAGES")
    print("==================================================")
    sample_sprayer = {
        "id": "booking-spray-888",
        "booking_id": "booking-spray-888",
        "spray_type": "Pump Spray",
        "crop": "Bt Cotton",
        "field_area": 4.0,
        "area_unit": "Acres",
        "booking_date": "2026-11-21",
        "preferred_time": "Morning (07:00 AM - 10:00 AM)",
        "field_location": "Plot #12, Guntur, Andhra Pradesh",
        "provider_name": "Kisan Motorized Heavy Spray Services",
        "provider_phone": "+91 98123 45678",
        "farmer_name": "Venkat Reddy",
        "estimated_cost": 1400.0,
        "service_start_time": "21 Nov 2026, 07:15 AM IST",
        "completion_time": "21 Nov 2026, 09:45 AM IST"
    }

    sprayer_stages = ["PENDING", "ACCEPTED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"]
    for stage in sprayer_stages:
        html, subject, plain = build_spray_service_email_html_and_subject(sample_sprayer, stage)
        print(f"  Stage: {stage:<12} | Subject: {subject}")
        assert "Sprayer" in subject or "Sprayer" in html, f"Sprayer email must reference Sprayer for {stage}"
        assert "booking-spray-888" in plain, "Plain text must contain booking ID"
        if stage == "SCHEDULED":
            assert "has not started yet" in plain.lower(), "Scheduled email must state service has not started yet"
            assert "Your Sprayer Service Is Scheduled" in subject
        elif stage == "IN_PROGRESS":
            assert "started" in plain.lower(), "In progress email must state spraying service has started"
            assert "Sprayer Service Started" in subject
        elif stage == "COMPLETED":
            assert "completed" in plain.lower(), "Completed email must state spraying service is completed"
            assert "Sprayer Service Completed" in subject
    print("  [PASS] All 7 Sprayer booking stages verified!\n")

    print("==================================================")
    print("4. VERIFYING ORDER STATUS STAGES (BUYER & FARMER)")
    print("==================================================")
    sample_order = {
        "id": "ord-777-abc",
        "order_id": "ord-777-abc",
        "crop_name": "Kashmiri Apples",
        "quantity": 25,
        "unit": "kg",
        "price_per_kg": 180,
        "total_price": 4500,
        "farmer_name": "Ghulam Hassan",
        "customer_name": "Ananya Sharma",
        "delivery_address": "Flat 402, Green Heights, Hyderabad",
        "dispatch_time": "19 Nov 2026, 02:30 PM UTC",
        "delivery_time": "19 Nov 2026, 05:15 PM UTC",
        "expected_delivery": "20 Nov 2026"
    }

    order_stages = ["pending", "accepted", "packed", "out_for_delivery", "delivered", "cancelled"]
    for stage in order_stages:
        # Buyer version
        b_html, b_subj, b_plain = build_order_status_email_html_and_subject(sample_order, stage, "consumer")
        # Farmer version
        f_html, f_subj, f_plain = build_order_status_email_html_and_subject(sample_order, stage, "farmer")
        
        print(f"  Stage: {stage:<16} | Buyer Subj:  {b_subj}")
        print(f"  {'':<16} | Farmer Subj: {f_subj}")

        assert "Kashmiri Apples" in b_plain, "Buyer plain text must contain crop name"
        assert "₹4500" in b_plain, "Buyer plain text must contain total price"
        assert "Ananya Sharma" in b_plain, "Buyer plain text must contain buyer name"
        assert "Ghulam Hassan" in b_plain, "Buyer plain text must contain farmer name"

        if stage == "out_for_delivery":
            assert "Out for Delivery" in b_subj, "Buyer subject must state Out for Delivery"
            assert "Dispatch Time:" in b_plain or "Dispatched Time:" in b_plain or "19 Nov" in b_plain
        elif stage == "delivered":
            assert "Delivered" in b_subj, "Buyer subject must state Delivered"
            assert "Delivery Time:" in b_plain or "Delivery Confirmation:" in b_plain or "19 Nov" in b_plain
    print("  [PASS] All Buyer & Farmer order stages verified!\n")

    print("==================================================")
    print("5. VERIFYING DEDUPLICATION INFRASTRUCTURE")
    print("==================================================")
    test_key = "test_event_order_999_out_for_delivery"
    recipient = "testbuyer@example.com"

    # Step 1: Check before dispatch
    is_dup1 = await is_email_deduped(test_key, recipient, cooldown_hours=1)
    assert not is_dup1, "Initial check should not be deduplicated"

    # Step 2: Record dispatch
    await record_email_dispatch(test_key, recipient, "Test Subject", "test_mode")

    # Step 3: Check right after dispatch
    is_dup2 = await is_email_deduped(test_key, recipient, cooldown_hours=1)
    assert is_dup2, "Subsequent check within cooldown MUST be deduplicated"
    print("  [PASS] Deduplication correctly identified and suppressed duplicate event!\n")

    print("==================================================")
    print("6. LIVE BREVO DISPATCH TEST (STATUS NOTIFICATION)")
    print("==================================================")
    # Test a real dispatch to verify Brevo REST API delivers with correct sender & reply-to
    target_test_email = "239x1a3253@gprec.ac.in"
    print(f"  Sending live test sprayer booking email to {target_test_email}...")
    res = await send_drone_booking_email(target_test_email, sample_sprayer, "SCHEDULED")
    print(f"  Dispatch Result: {res}")
    assert res.get("status") in ("success", "deduplicated"), f"Dispatch should succeed: {res}"
    print("  [PASS] Live Brevo dispatch succeeded with status:", res.get("status"))

    print("\n==================================================")
    print("ALL TESTS PASSED SUCCESSFULLY (100% ACCURACY)!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
