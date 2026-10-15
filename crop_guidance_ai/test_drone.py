import asyncio
import json
import urllib.request
import websockets

async def run_full_test():
    base_url = 'http://localhost:8000'
    
    # 1. /docs check
    req = urllib.request.urlopen(f'{base_url}/docs')
    print('1. /docs status:', req.status)
    
    # 2. Get spray providers
    req_prov = urllib.request.urlopen(f'{base_url}/api/spray-providers')
    provs = json.loads(req_prov.read().decode())
    print('2. /api/spray-providers status:', req_prov.status, f'Count: {len(provs)}')
    prov_id = provs[0]['id']
    prov_rate = provs[0]['rate_per_acre']
    
    # 3. Create real booking
    booking_payload = {
        'spray_type': 'Drone Spray',
        'crop': 'Organic Sona Masoori Rice',
        'field_area': 3.5,
        'area_unit': 'Acres',
        'booking_date': '2026-10-05',
        'preferred_time': 'Morning (07:00 AM - 10:00 AM)',
        'farmer_contact': '+91 98765 43210',
        'field_location': 'Kurnool Sector 4, Andhra Pradesh',
        'additional_notes': 'End-to-end automated test',
        'provider_id': prov_id,
        'farmer_id': 'farmer-test-1',
        'farmer_name': 'Ramesh Kumar'
    }
    
    req_post = urllib.request.Request(
        f'{base_url}/api/drone-bookings',
        data=json.dumps(booking_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res_post = urllib.request.urlopen(req_post)
    created_booking = json.loads(res_post.read().decode())
    booking_id = created_booking['id']
    expected_cost = round(3.5 * prov_rate, 2)
    
    print('3. POST /api/drone-bookings status:', res_post.status)
    print(f"   Booking ID: {booking_id}")
    print(f"   Area: {created_booking['field_area']} Acres x Rs.{prov_rate}/acre")
    print(f"   Calculated Cost: Rs.{created_booking['estimated_cost']} (Expected: Rs.{expected_cost})")
    assert created_booking['estimated_cost'] == expected_cost, 'Cost calculation mismatch!'
    
    # 4. Connect to WebSocket
    ws_uri = 'ws://localhost:8000/ws/db-events'
    async with websockets.connect(ws_uri) as ws:
        print('4. Connected to WebSocket at ws://localhost:8000/ws/db-events')
        
        # Helper to update status and listen for WS event
        async def update_and_verify_ws(target_status):
            req_put = urllib.request.Request(
                f'{base_url}/api/drone-bookings/{booking_id}/status',
                data=json.dumps({'status': target_status}).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='PUT'
            )
            res_put = urllib.request.urlopen(req_put)
            updated = json.loads(res_put.read().decode())
            
            # Wait for WS message
            ws_msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
            ws_data = json.loads(ws_msg)
            print(f"   State changed to: {updated['status']} -> WS event received: {ws_data}")
            assert updated['status'] == target_status, f'Failed status transition to {target_status}'
            assert ws_data['table'] == 'drone_bookings', 'WS table mismatch'
            assert ws_data['event'] == 'UPDATE', 'WS event mismatch'

        print('5. Testing status state machine & WebSocket live broadcasts...')
        await update_and_verify_ws('ACCEPTED')
        await update_and_verify_ws('SCHEDULED')
        await update_and_verify_ws('IN_PROGRESS')
        await update_and_verify_ws('COMPLETED')
        
    # 5. Test invalid state transition (COMPLETED -> ACCEPTED)
    try:
        req_invalid = urllib.request.Request(
            f'{base_url}/api/drone-bookings/{booking_id}/status',
            data=json.dumps({'status': 'ACCEPTED'}).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='PUT'
        )
        urllib.request.urlopen(req_invalid)
        print('ERROR: Invalid transition was incorrectly accepted!')
    except urllib.error.HTTPError as err:
        print(f'6. Invalid transition test correctly rejected with HTTP {err.code}: {err.reason}')

if __name__ == '__main__':
    asyncio.run(run_full_test())
