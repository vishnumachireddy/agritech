from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from database import db, spray_providers_collection, drone_bookings_collection
from api_routes import manager

spray_router = APIRouter()

# --- Pydantic Request Models ---

class CreateBookingRequest(BaseModel):
    spray_type: str  # "Drone Spray" or "Pump Spray"
    crop: str
    field_area: float = Field(..., gt=0)
    area_unit: str = "Acres"
    booking_date: str
    preferred_time: Optional[str] = "Morning (07:00 AM - 10:00 AM)"
    farmer_contact: str
    field_location: str
    additional_notes: Optional[str] = ""
    provider_id: str
    farmer_id: Optional[str] = "farmer-demo-1"
    farmer_name: Optional[str] = "Farmer"

class UpdateStatusRequest(BaseModel):
    status: str  # ACCEPTED | REJECTED | SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED
    notes: Optional[str] = ""

# --- Allowed Status Transitions ---
VALID_TRANSITIONS = {
    "PENDING": ["ACCEPTED", "REJECTED", "CANCELLED"],
    "ACCEPTED": ["SCHEDULED", "CANCELLED"],
    "SCHEDULED": ["IN_PROGRESS", "CANCELLED"],
    "IN_PROGRESS": ["COMPLETED"],
    "REJECTED": [],
    "COMPLETED": [],
    "CANCELLED": []
}

# --- Routes ---

DEFAULT_PROVIDERS = [
    {
        "id": "provider-sp-101",
        "provider_name": "AgriFly Precision Drones",
        "service_type": "Drone",
        "phone": "+91 98765 43210",
        "rate_per_acre": 550.0,
        "service_region": "Andhra Pradesh",
        "is_available": True,
        "rating": 4.9
    },
    {
        "id": "provider-sp-102",
        "provider_name": "Kisan Motorized Heavy Spray Services",
        "service_type": "Pump",
        "phone": "+91 98123 45678",
        "rate_per_acre": 350.0,
        "service_region": "Andhra Pradesh",
        "is_available": True,
        "rating": 4.7
    }
]

@spray_router.get("/api/spray-providers")
async def get_spray_providers(service_type: Optional[str] = None, region: Optional[str] = None):
    query = {"is_available": True}
    if service_type and service_type != "all":
        query["$or"] = [{"service_type": service_type}, {"service_type": "Both"}]
    if region and region != "all":
        query["service_region"] = region

    try:
        cursor = spray_providers_collection.find(query, {"_id": 0})
        providers = await cursor.to_list(length=100)
    except Exception as e:
        print(f"MongoDB query fallback for spray providers: {e}")
        providers = []
    
    # Fallback default providers if database empty or offline
    if not providers:
        providers = DEFAULT_PROVIDERS
    return providers

# In-memory runtime cache for fallback support when DB connection times out
IN_MEMORY_BOOKINGS = [
    {
        "id": "booking-sp-801",
        "booking_id": "booking-sp-801",
        "farmer_id": "farmer-demo-1",
        "farmer_name": "Ramesh Kumar",
        "farmer_phone": "+91 98765 43210",
        "spray_type": "Drone Spray",
        "crop": "Organic Sona Masoori Rice",
        "field_area": 3.5,
        "area_unit": "Acres",
        "booking_date": "2026-10-02",
        "preferred_time": "Morning (07:00 AM - 10:00 AM)",
        "field_location": "Kurnool, Andhra Pradesh",
        "additional_notes": "Low-altitude uniform spray requested",
        "provider_id": "provider-sp-101",
        "provider_name": "AgriFly Precision Drones",
        "provider_phone": "+91 98765 43210",
        "provider_rate": 550.0,
        "estimated_cost": 1925.0,
        "status": "PENDING",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
]

@spray_router.post("/api/drone-bookings")
async def create_spray_booking(req: CreateBookingRequest):
    if req.field_area <= 0:
        raise HTTPException(status_code=400, detail="Field area must be greater than 0")

    # Fetch authoritative rate from provider record
    provider = None
    try:
        provider = await spray_providers_collection.find_one({"id": req.provider_id}, {"_id": 0})
    except Exception as e:
        print(f"MongoDB query fallback for single provider: {e}")
    
    if not provider:
        provider = next((p for p in DEFAULT_PROVIDERS if p["id"] == req.provider_id), None)
    
    rate_per_acre = provider.get("rate_per_acre", 500.0) if provider else 500.0
    provider_name = provider.get("provider_name", "Regional Spray Operator") if provider else "Regional Spray Operator"
    provider_phone = provider.get("phone", "+91 98765 43210") if provider else "+91 98765 43210"

    # Server-side cost calculation: area * rate
    calculated_cost = round(req.field_area * rate_per_acre, 2)
    booking_id = f"booking-sp-{uuid.uuid4().hex[:6]}"

    booking_doc = {
        "id": booking_id,
        "booking_id": booking_id,
        "farmer_id": req.farmer_id or "farmer-demo-1",
        "farmer_name": req.farmer_name or "Farmer",
        "farmer_phone": req.farmer_contact,
        "spray_type": req.spray_type,
        "crop": req.crop,
        "field_area": req.field_area,
        "area_unit": req.area_unit,
        "booking_date": req.booking_date,
        "preferred_time": req.preferred_time,
        "field_location": req.field_location,
        "additional_notes": req.additional_notes,
        "provider_id": req.provider_id,
        "provider_name": provider_name,
        "provider_phone": provider_phone,
        "provider_rate": rate_per_acre,
        "estimated_cost": calculated_cost,
        "status": "PENDING",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    try:
        await drone_bookings_collection.insert_one(booking_doc)
    except Exception as e:
        print(f"MongoDB insert warning for booking: {e}")

    booking_doc.pop("_id", None)
    IN_MEMORY_BOOKINGS.insert(0, dict(booking_doc))

    # Broadcast WebSocket event live
    await manager.broadcast("drone_bookings", "INSERT")

    return booking_doc

@spray_router.get("/api/drone-bookings")
async def get_spray_bookings(farmer_id: Optional[str] = None, provider_id: Optional[str] = None):
    query = {}
    if farmer_id:
        query["farmer_id"] = farmer_id
    if provider_id:
        query["provider_id"] = provider_id

    bookings = []
    try:
        cursor = drone_bookings_collection.find(query, {"_id": 0}).sort("created_at", -1)
        bookings = await cursor.to_list(length=200)
    except Exception as e:
        print(f"MongoDB query fallback for spray bookings: {e}")
        bookings = []

    # Fallback seed booking for immediate rendering
    if not bookings:
        filtered = IN_MEMORY_BOOKINGS
        if farmer_id:
            filtered = [b for b in filtered if b.get("farmer_id") == farmer_id]
        if provider_id:
            filtered = [b for b in filtered if b.get("provider_id") == provider_id]
        bookings = filtered
    return bookings

@spray_router.get("/api/drone-bookings/{booking_id}")
async def get_single_booking(booking_id: str):
    booking = None
    try:
        booking = await drone_bookings_collection.find_one({"$or": [{"id": booking_id}, {"booking_id": booking_id}]}, {"_id": 0})
    except Exception as e:
        print(f"MongoDB query fallback for single booking: {e}")
    if not booking:
        booking = next((b for b in IN_MEMORY_BOOKINGS if b.get("id") == booking_id or b.get("booking_id") == booking_id), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@spray_router.put("/api/drone-bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, req: UpdateStatusRequest):
    existing = None
    try:
        existing = await drone_bookings_collection.find_one({"$or": [{"id": booking_id}, {"booking_id": booking_id}]}, {"_id": 0})
    except Exception as e:
        print(f"MongoDB query fallback for update status: {e}")
    
    if not existing:
        existing = next((b for b in IN_MEMORY_BOOKINGS if b.get("id") == booking_id or b.get("booking_id") == booking_id), None)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Booking not found")

    current_status = existing.get("status", "PENDING")
    new_status = req.status.upper()

    allowed = VALID_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {current_status} to {new_status}. Allowed: {allowed}"
        )

    now = datetime.utcnow().isoformat()
    try:
        await drone_bookings_collection.update_many(
            {"$or": [{"id": booking_id}, {"booking_id": booking_id}]},
            {"$set": {"status": new_status, "updated_at": now}}
        )
    except Exception as e:
        print(f"MongoDB update warning for status: {e}")

    existing["status"] = new_status
    existing["updated_at"] = now

    # Also update in-memory cache
    for b in IN_MEMORY_BOOKINGS:
        if b.get("id") == booking_id or b.get("booking_id") == booking_id:
            b["status"] = new_status
            b["updated_at"] = now

    # Broadcast WebSocket update event live
    await manager.broadcast("drone_bookings", "UPDATE")

    return existing
