from fastapi import APIRouter, HTTPException, Depends, Header, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from collections import defaultdict
import uuid
import json
from auth import verify_password, get_password_hash, create_access_token, decode_access_token
from database import db, profiles_collection, crops_collection, orders_collection, is_mongo_online, mark_mongo_offline

router = APIRouter()

# --- Realtime WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, table: str, event_type: str, data: dict = None):
        message = {"table": table, "event": event_type, "data": data or {}}
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws/db-events")
async def websocket_db_events(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            text = await websocket.receive_text()
            try:
                msg = json.loads(text)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                pass
    except (WebSocketDisconnect, Exception):
        manager.disconnect(websocket)

# --- Auth Routes ---

IN_MEMORY_USERS = [
    {
        "id": "farmer-demo-1",
        "email": "farmer@agri.com",
        "password": get_password_hash("farmer123"),
        "full_name": "Ramesh Kumar",
        "role": "farmer",
        "region": "Andhra Pradesh",
        "phone": "+91 9876543210",
        "created_at": "2026-01-01T00:00:00"
    },
    {
        "id": "farmer-demo-2",
        "email": "suresh@agri.com",
        "password": get_password_hash("farmer123"),
        "full_name": "Suresh Patel",
        "role": "farmer",
        "region": "Maharashtra",
        "phone": "+91 9812345678",
        "created_at": "2026-01-01T00:00:00"
    },
    {
        "id": "farmer-demo-3",
        "email": "balwinder@agri.com",
        "password": get_password_hash("farmer123"),
        "full_name": "Balwinder Singh",
        "role": "farmer",
        "region": "Punjab",
        "phone": "+91 9823456789",
        "created_at": "2026-01-01T00:00:00"
    },
    {
        "id": "farmer-demo-4",
        "email": "venkat@agri.com",
        "password": get_password_hash("farmer123"),
        "full_name": "Venkat Reddy",
        "role": "farmer",
        "region": "Telangana",
        "phone": "+91 9834567890",
        "created_at": "2026-01-01T00:00:00"
    },
    {
        "id": "farmer-demo-5",
        "email": "mallesh@agri.com",
        "password": get_password_hash("farmer123"),
        "full_name": "Mallesh Yadav",
        "role": "farmer",
        "region": "Telangana",
        "phone": "+91 9845678901",
        "created_at": "2026-01-01T00:00:00"
    },
    {
        "id": "farmer-demo-6",
        "email": "basavaraj@agri.com",
        "password": get_password_hash("farmer123"),
        "full_name": "Basavaraj Gowda",
        "role": "farmer",
        "region": "Karnataka",
        "phone": "+91 9856789012",
        "created_at": "2026-01-01T00:00:00"
    },
    {
        "id": "consumer-demo-1",
        "email": "consumer@agri.com",
        "password": get_password_hash("consumer123"),
        "full_name": "Anita Sharma",
        "role": "consumer",
        "region": "Telangana",
        "phone": "+91 9123456789",
        "created_at": "2026-01-01T00:00:00"
    }
]

IN_MEMORY_TABLES: Dict[str, List[dict]] = defaultdict(list)
IN_MEMORY_TABLES["profiles"] = IN_MEMORY_USERS

IN_MEMORY_TABLES["farmer_details"] = [
    {
        "id": "fd-1",
        "user_id": "farmer-demo-1",
        "primary_crop": "Rice",
        "secondary_crop": "Cotton",
        "land_area": 5.5,
        "total_yield": 4500,
        "monthly_production": 400,
        "expected_price": 65,
        "water_availability": "High",
        "farming_type": "Organic",
        "harvest_cycle": "Seasonal",
        "region": "Andhra Pradesh"
    },
    {
        "id": "fd-2",
        "user_id": "farmer-demo-2",
        "primary_crop": "Cotton",
        "secondary_crop": "Soybean",
        "land_area": 7.0,
        "total_yield": 6200,
        "monthly_production": 550,
        "expected_price": 85,
        "water_availability": "Medium",
        "farming_type": "Traditional",
        "harvest_cycle": "Seasonal",
        "region": "Maharashtra"
    },
    {
        "id": "fd-3",
        "user_id": "farmer-demo-3",
        "primary_crop": "Wheat",
        "secondary_crop": "Rice",
        "land_area": 12.0,
        "total_yield": 12000,
        "monthly_production": 1000,
        "expected_price": 75,
        "water_availability": "High",
        "farming_type": "Commercial",
        "harvest_cycle": "Seasonal",
        "region": "Punjab"
    },
    {
        "id": "fd-4",
        "user_id": "farmer-demo-4",
        "primary_crop": "Cotton",
        "secondary_crop": "Maize",
        "land_area": 4.8,
        "total_yield": 3800,
        "monthly_production": 350,
        "expected_price": 60,
        "water_availability": "Medium",
        "farming_type": "Organic",
        "harvest_cycle": "Seasonal",
        "region": "Telangana"
    },
    {
        "id": "fd-5",
        "user_id": "farmer-demo-5",
        "primary_crop": "Rice",
        "secondary_crop": "Maize",
        "land_area": 6.2,
        "total_yield": 5100,
        "monthly_production": 450,
        "expected_price": 58,
        "water_availability": "High",
        "farming_type": "Traditional",
        "harvest_cycle": "Seasonal",
        "region": "Telangana"
    },
    {
        "id": "fd-6",
        "user_id": "farmer-demo-6",
        "primary_crop": "Sugarcane",
        "secondary_crop": "Maize",
        "land_area": 8.5,
        "total_yield": 15000,
        "monthly_production": 1200,
        "expected_price": 90,
        "water_availability": "High",
        "farming_type": "Organic",
        "harvest_cycle": "Annual",
        "region": "Karnataka"
    }
]

IN_MEMORY_TABLES["government_schemes"] = [
    {
        "id": "scheme-1",
        "title": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "category": "Financial",
        "description": "Income support of ₹6,000/- per year in three equal installments to all landholding farmer families.",
        "benefits": ["₹6,000 direct bank transfer per year", "Direct Benefit Transfer (DBT)", "100% Central Govt Funded"],
        "official_url": "https://pmkisan.gov.in/",
        "icon_name": "Landmark",
        "created_at": "2026-01-01T00:00:00"
    },
    {
        "id": "scheme-2",
        "title": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "category": "Insurance",
        "description": "Comprehensive risk insurance coverage to farmers suffering crop loss or damage arising out of natural calamities.",
        "benefits": ["Low premium rate: 1.5% Rabi & 2% Kharif", "Full sum insured protection for calamities", "Fast tech-enabled claim settlement"],
        "official_url": "https://pmfby.gov.in/",
        "icon_name": "ShieldCheck",
        "created_at": "2026-01-02T00:00:00"
    },
    {
        "id": "scheme-3",
        "title": "Paramparagat Krishi Vikas Yojana (PKVY)",
        "category": "Organic",
        "description": "Promotes organic agriculture through cluster approach and Participatory Guarantee System (PGS) certification.",
        "benefits": ["₹50,000/ha financial assistance over 3 years", "Free organic certification support", "Direct market linkage for organic produce"],
        "official_url": "https://pgsindia-ncof.gov.in/",
        "icon_name": "Leaf",
        "created_at": "2026-01-03T00:00:00"
    },
    {
        "id": "scheme-4",
        "title": "Soil Health Card Scheme",
        "category": "Infrastructure",
        "description": "Issues soil health cards to farmers with customized 12-parameter nutrient and fertilizer recommendations.",
        "benefits": ["12-parameter scientific soil testing", "Targeted nutrient dosage guidance", "Lowers fertilizer costs & increases crop yield"],
        "official_url": "https://soilhealth.dac.gov.in/",
        "icon_name": "Building",
        "created_at": "2026-01-04T00:00:00"
    },
    {
        "id": "scheme-5",
        "title": "Kisan Credit Card (KCC) Scheme",
        "category": "Financial",
        "description": "Provides timely and flexible institutional credit to farmers for agriculture and allied activities.",
        "benefits": ["Concessional interest rate at 4% per annum", "Collateral-free loan up to ₹1.60 Lakh", "Flexible repayment schedule matching harvests"],
        "official_url": "https://myscheme.gov.in/schemes/kcc",
        "icon_name": "Landmark",
        "created_at": "2026-01-05T00:00:00"
    },
    {
        "id": "scheme-6",
        "title": "e-NAM (National Agriculture Market)",
        "category": "Marketing",
        "description": "Pan-India electronic trading portal networking APMC mandis to create a unified national agricultural marketplace.",
        "benefits": ["Transparent online electronic price discovery", "Direct market access to bulk buyers nationwide", "Instant online payment settlements"],
        "official_url": "https://enam.gov.in/",
        "icon_name": "BarChart3",
        "created_at": "2026-01-06T00:00:00"
    },
    {
        "id": "scheme-7",
        "title": "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)",
        "category": "Infrastructure",
        "description": "End-to-end irrigation solution with focus on Per Drop More Crop micro-irrigation systems.",
        "benefits": ["Up to 55% subsidy on drip and sprinkler sets", "Water source sustainability & farm ponds", "Drastic reduction in electricity and water wastage"],
        "official_url": "https://pmksy.gov.in/",
        "icon_name": "Shield",
        "created_at": "2026-01-07T00:00:00"
    }
]

IN_MEMORY_TABLES["orders"] = [
    {
        "id": "order-501",
        "consumer_id": "consumer-demo-1",
        "customer_id": "consumer-demo-1",
        "farmer_id": "farmer-demo-1",
        "crop_id": "crop-101",
        "crop_name": "Organic Sona Masoori Rice",
        "quantity": 50,
        "price_per_kg": 55,
        "total_price": 2750,
        "status": "pending",
        "consumer_name": "Anita Sharma",
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": "order-502",
        "consumer_id": "consumer-demo-1",
        "customer_id": "consumer-demo-1",
        "farmer_id": "farmer-demo-1",
        "crop_id": "crop-102",
        "crop_name": "Raw Organic Cotton Bales",
        "quantity": 100,
        "price_per_kg": 120,
        "total_price": 12000,
        "status": "delivered",
        "consumer_name": "Anita Sharma",
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": "ord-801",
        "consumer_id": "consumer-demo-1",
        "customer_id": "consumer-demo-1",
        "farmer_id": "farmer-demo-1",
        "crop_id": "crop-101",
        "crop_name": "Organic Sona Masoori Rice",
        "quantity": 50,
        "price_per_kg": 55,
        "total_price": 2750,
        "status": "pending",
        "consumer_name": "Anita Sharma",
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": "c3fd72de-2a8c-4a53-8b9a-d6326843435c",
        "consumer_id": "consumer-demo-1",
        "customer_id": "consumer-demo-1",
        "farmer_id": "farmer-demo-1",
        "crop_id": "crop-101",
        "crop_name": "Organic Sona Masoori Rice",
        "quantity": 10,
        "price_per_kg": 55,
        "total_price": 550,
        "status": "pending",
        "consumer_name": "Anita Sharma",
        "created_at": datetime.utcnow().isoformat()
    }
]

IN_MEMORY_TABLES["bulk_orders"] = [
    {
        "id": "bulk-901",
        "customer_id": "consumer-demo-1",
        "consumer_id": "consumer-demo-1",
        "farmer_id": "farmer-demo-1",
        "farmer_name": "Ramesh Kumar",
        "crop_name": "Organic Sona Masoori Rice",
        "quantity_required": 1000,
        "fulfilled_quantity": 250,
        "total_committed": 250,
        "remaining_quantity": 750,
        "progress_pct": 25.0,
        "unit": "kg",
        "region": "Andhra Pradesh",
        "expected_delivery_start": "2026-03-01",
        "expected_delivery_end": "2026-03-15",
        "status": "open",
        "order_type": "bulk",
        "is_bulk": True,
        "created_at": datetime.utcnow().isoformat()
    }
]

IN_MEMORY_TABLES["farmer_commitments"] = [
    {
        "id": "commit-init-1",
        "demand_id": "bulk-901",
        "bulk_order_id": "bulk-901",
        "farmer_id": "farmer-demo-1",
        "farmer_name": "Ramesh Kumar",
        "committed_quantity": 250,
        "status": "committed",
        "created_at": datetime.utcnow().isoformat()
    }
]

IN_MEMORY_TABLES["crops"] = [
    {
        "id": "crop-101",
        "farmer_id": "farmer-demo-1",
        "farmer_name": "Ramesh Kumar",
        "name": "Organic Sona Masoori Rice",
        "crop_type": "Rice",
        "description": "Premium organic unpolished Sona Masoori rice harvested fresh.",
        "price": 55,
        "quantity": 1200,
        "unit": "kg",
        "location": "Andhra Pradesh",
        "grade": "A+",
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": "crop-102",
        "farmer_id": "farmer-demo-2",
        "farmer_name": "Suresh Patel",
        "name": "Raw Organic Cotton Bales",
        "crop_type": "Cotton",
        "description": "High fiber long staple organic cotton.",
        "price": 120,
        "quantity": 800,
        "unit": "kg",
        "location": "Maharashtra",
        "grade": "Super",
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": "crop-103",
        "farmer_id": "farmer-demo-3",
        "farmer_name": "Balwinder Singh",
        "name": "Golden Sharbati Wheat",
        "crop_type": "Wheat",
        "description": "Nutrient-rich golden grain Sharbati wheat.",
        "price": 42,
        "quantity": 2500,
        "unit": "kg",
        "location": "Punjab",
        "grade": "A",
        "created_at": datetime.utcnow().isoformat()
    }
]

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    region: Optional[str] = ""
    phone: Optional[str] = ""
    primary_crop: Optional[str] = ""
    secondary_crop: Optional[str] = ""
    land_area: Optional[float] = 0.0
    total_yield: Optional[float] = 0.0
    monthly_production: Optional[float] = 0.0
    expected_price: Optional[float] = 0.0
    water_availability: Optional[str] = "Medium"
    farming_type: Optional[str] = "Mixed"
    harvest_cycle: Optional[str] = "Seasonal"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    phone_number: Optional[str] = None
    region: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    primary_crop: Optional[str] = None
    primary_crops: Optional[str] = None
    secondary_crop: Optional[str] = None
    land_area: Optional[float] = None
    total_land_area: Optional[float] = None
    total_yield: Optional[float] = None
    monthly_production: Optional[float] = None
    expected_price: Optional[float] = None
    water_availability: Optional[str] = None
    farming_type: Optional[str] = None
    harvest_cycle: Optional[str] = None
    avatar_url: Optional[str] = None
    farm_name: Optional[str] = None
    irrigation_type: Optional[str] = None
    soil_type: Optional[str] = None
    years_of_experience: Optional[float] = None
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    preferred_crops: Optional[str] = None
    purchase_volume_capacity: Optional[float] = None

    class Config:
        extra = "allow"

@router.post("/api/auth/register")
async def register(req: RegisterRequest):
    existing = None
    try:
        existing = await profiles_collection.find_one({"email": req.email})
    except Exception as e:
        print(f"MongoDB query fallback for existing user: {e}")

    if not existing:
        existing = next((u for u in IN_MEMORY_USERS if u["email"] == req.email), None)

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_pw = get_password_hash(req.password)
    
    new_user = {
        "id": user_id,
        "email": req.email,
        "password": hashed_pw,
        "full_name": req.full_name,
        "role": req.role,
        "region": req.region,
        "phone": req.phone,
        "primary_crop": req.primary_crop,
        "secondary_crop": req.secondary_crop,
        "land_area": req.land_area,
        "total_yield": req.total_yield,
        "monthly_production": req.monthly_production,
        "expected_price": req.expected_price,
        "water_availability": req.water_availability,
        "farming_type": req.farming_type,
        "harvest_cycle": req.harvest_cycle,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "created_at": datetime.utcnow().isoformat()
    }

    try:
        await profiles_collection.insert_one(dict(new_user))
    except Exception as e:
        print(f"MongoDB insert warning for user profile: {e}")

    user_dict = dict(new_user)
    user_dict.pop("_id", None)
    IN_MEMORY_USERS.append(user_dict)

    try:
        await manager.broadcast("profiles", "INSERT")
    except Exception:
        pass

    token = create_access_token({"sub": user_id, "role": req.role})
    safe_user = {k: v for k, v in user_dict.items() if k != "password"}
    return {"token": token, "user": safe_user}

@router.post("/api/auth/login")
async def login(req: LoginRequest):
    user = None
    try:
        user = await profiles_collection.find_one({"email": req.email})
    except Exception as e:
        print(f"MongoDB query fallback for login: {e}")

    if not user:
        user = next((u for u in IN_MEMORY_USERS if u["email"] == req.email), None)

    if not user or not verify_password(req.password, user.get("password", "")):
        raise HTTPException(status_code=400, detail="Invalid credentials. Please check email and password.")

    token = create_access_token({"sub": user["id"], "role": user["role"]})
    safe_user = {k: v for k, v in user.items() if k not in ("password", "_id")}
    return {"token": token, "user": safe_user}

@router.get("/api/auth/me")
async def get_me(authorization: Optional[str] = Header(None), user_id: Optional[str] = None):
    target_id = user_id
    if not target_id and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload:
            target_id = payload.get("sub")

    if not target_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = None
    try:
        user = await profiles_collection.find_one({"id": target_id}, {"_id": 0, "password": 0})
    except Exception as e:
        print(f"MongoDB query fallback for me endpoint: {e}")

    if not user:
        user = next((u for u in IN_MEMORY_USERS if u["id"] == target_id), None)

    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")

    safe_user = {k: v for k, v in user.items() if k not in ("password", "_id")}
    return safe_user

@router.put("/api/auth/profile")
async def update_profile(req: ProfileUpdateRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    target_id = payload["sub"]
    update_data = {k: v for k, v in req.dict().items() if v is not None}

    if update_data:
        try:
            await profiles_collection.update_one({"id": target_id}, {"$set": update_data})
        except Exception as e:
            print(f"MongoDB update warning for profile: {e}")

        for u in IN_MEMORY_USERS:
            if u["id"] == target_id:
                u.update(update_data)

    return await get_me(authorization=authorization)

# --- Specific RPC Endpoints ---

@router.api_route("/api/rpc/{func_name}", methods=["GET", "POST"])
async def call_rpc(func_name: str, request: Request):
    try:
        if func_name == "get_public_farmer_profiles":
            cursor = profiles_collection.find({"role": "farmer"}, {"_id": 0, "password": 0})
            farmers = await cursor.to_list(length=1000)
            if farmers:
                return farmers
        if func_name in ("count_farmers", "count_farmers_rpc"):
            count = await profiles_collection.count_documents({"role": "farmer"})
            return count
        if func_name == "count_consumers":
            count = await profiles_collection.count_documents({"role": "consumer"})
            return count
    except Exception as e:
        print(f"MongoDB RPC fallback for {func_name}: {e}")

    if func_name == "get_public_farmer_profiles":
        return [u for u in IN_MEMORY_USERS if u.get("role") == "farmer"]
    if func_name in ("count_farmers", "count_farmers_rpc"):
        return len([u for u in IN_MEMORY_USERS if u.get("role") == "farmer"])
    if func_name == "count_consumers":
        return len([u for u in IN_MEMORY_USERS if u.get("role") == "consumer"])
    if func_name == "get_avg_market_price":
        return 2100.50
        
    return []

# --- Generic REST Endpoints for Supabase Mocking ---

@router.get("/api/tables/{table}")
async def get_tables_alias(table: str, request: Request):
    return await get_records(table, request)

@router.get("/api/{table}")
async def get_records(table: str, request: Request):
    query_params = dict(request.query_params)
    results = []
    if is_mongo_online:
        try:
            collection = db.get_collection(table)
            filter_query = {}
            for k, v in query_params.items():
                if k not in ("select", "order", "limit"):
                    if k in ("consumer_id", "customer_id"):
                        filter_query["$or"] = [{"consumer_id": v}, {"customer_id": v}]
                    elif "," in v:
                        filter_query[k] = {"$in": v.split(",")}
                    else:
                        filter_query[k] = v

            cursor = collection.find(filter_query, {"_id": 0})
            
            if "order" in query_params:
                cursor = cursor.sort(query_params["order"], -1)
                
            if "limit" in query_params:
                try:
                    limit = int(query_params["limit"])
                    cursor = cursor.limit(limit)
                except:
                    pass

            results = await cursor.to_list(length=1000)
        except Exception as e:
            mark_mongo_offline()
            print(f"MongoDB get_records fallback for table {table}: {e}")

    if not results and table in IN_MEMORY_TABLES:
        mem_records = IN_MEMORY_TABLES.get(table, [])
        filtered = []
        for r in mem_records:
            match = True
            for k, v in query_params.items():
                if k not in ("select", "order", "limit"):
                    if k in ("consumer_id", "customer_id"):
                        if str(r.get("consumer_id")) != str(v) and str(r.get("customer_id")) != str(v):
                            match = False
                            break
                    elif str(r.get(k)) != str(v):
                        match = False
                        break
            if match:
                clean_r = {k: v for k, v in r.items() if k != "_id"}
                filtered.append(clean_r)
        return filtered

    return results

ALLOWED_ORDER_STATUSES = {"pending", "accepted", "packed", "out_for_delivery", "delivered", "rejected", "cancelled"}

@router.post("/api/{table}")
async def create_record(table: str, request: Request):
    data = await request.json()
    if not isinstance(data, dict):
        data = {}
        
    if "id" not in data:
        data["id"] = str(uuid.uuid4())
        
    data["created_at"] = datetime.utcnow().isoformat()
    
    # Normalize consumer_id and customer_id
    if "consumer_id" in data and "customer_id" not in data:
        data["customer_id"] = data["consumer_id"]
    elif "customer_id" in data and "consumer_id" not in data:
        data["consumer_id"] = data["customer_id"]

    # Bulk order calculations - calculate exact progress using (fulfilled / total) * 100
    if table == "bulk_orders" or data.get("is_bulk") or data.get("order_type") == "bulk":
        qty_req = float(data.get("quantity_required", data.get("quantity", 100)))
        fulfilled = float(data.get("fulfilled_quantity", 0))
        # Clamp between 0 and qty_req to prevent negative or invalid values
        fulfilled = max(0.0, min(qty_req, fulfilled))
        remaining = max(0.0, qty_req - fulfilled)
        progress = round((fulfilled / qty_req) * 100, 1) if qty_req > 0 else 0.0

        data["quantity_required"] = qty_req
        data["fulfilled_quantity"] = fulfilled
        data["total_committed"] = fulfilled
        data["remaining_quantity"] = remaining
        data["progress_pct"] = progress

    if is_mongo_online:
        try:
            collection = db.get_collection(table)
            await collection.insert_one(dict(data))
        except Exception as e:
            mark_mongo_offline()
            print(f"MongoDB create_record fallback for table {table}: {e}")

    record_copy = dict(data)
    record_copy.pop("_id", None)
    IN_MEMORY_TABLES[table].append(record_copy)

    # Cross-sync bulk orders between tables
    if table == "orders" and (data.get("order_type") == "bulk" or data.get("is_bulk")):
        bulk_record = {
            "id": data.get("bulk_order_id") or data["id"],
            "order_id": data["id"],
            "customer_id": data.get("consumer_id") or data.get("customer_id"),
            "consumer_id": data.get("consumer_id") or data.get("customer_id"),
            "farmer_id": data.get("farmer_id"),
            "farmer_name": data.get("farmer_name", "Farmer"),
            "crop_name": data.get("crop_name", "Bulk Crop"),
            "quantity_required": data.get("quantity_required", data.get("quantity", 100)),
            "fulfilled_quantity": data.get("fulfilled_quantity", 0),
            "total_committed": data.get("fulfilled_quantity", 0),
            "remaining_quantity": data.get("remaining_quantity", data.get("quantity", 100)),
            "progress_pct": data.get("progress_pct", 0.0),
            "unit": "kg",
            "region": data.get("region", "Andhra Pradesh"),
            "status": data.get("status", "open"),
            "order_type": "bulk",
            "is_bulk": True,
            "created_at": data["created_at"]
        }
        if is_mongo_online:
            try:
                await db.get_collection("bulk_orders").update_one({"id": bulk_record["id"]}, {"$set": bulk_record}, upsert=True)
            except Exception:
                pass
        IN_MEMORY_TABLES["bulk_orders"].append(bulk_record)
        try:
            await manager.broadcast("bulk_orders", "INSERT", bulk_record)
        except Exception:
            pass

    elif table == "bulk_orders":
        order_record = {
            "id": data["id"],
            "consumer_id": data.get("customer_id") or data.get("consumer_id"),
            "customer_id": data.get("customer_id") or data.get("consumer_id"),
            "farmer_id": data.get("farmer_id", "open-demand"),
            "farmer_name": data.get("farmer_name", "Market Demand"),
            "crop_name": data.get("crop_name", "Bulk Crop"),
            "quantity": data.get("quantity_required", 100),
            "quantity_required": data.get("quantity_required", 100),
            "fulfilled_quantity": data.get("fulfilled_quantity", 0),
            "total_committed": data.get("fulfilled_quantity", 0),
            "remaining_quantity": data.get("remaining_quantity", data.get("quantity_required", 100)),
            "progress_pct": data.get("progress_pct", 0.0),
            "price_per_kg": 50,
            "total_price": float(data.get("quantity_required", 100)) * 50,
            "status": data.get("status", "open"),
            "order_type": "bulk",
            "is_bulk": True,
            "bulk_order_id": data["id"],
            "region": data.get("region", "Andhra Pradesh"),
            "created_at": data["created_at"]
        }
        if is_mongo_online:
            try:
                await db.get_collection("orders").update_one({"id": order_record["id"]}, {"$set": order_record}, upsert=True)
            except Exception:
                pass
        IN_MEMORY_TABLES["orders"].append(order_record)
        try:
            await manager.broadcast("orders", "INSERT", order_record)
        except Exception:
            pass

    elif table == "farmer_commitments":
        # Synchronize commitment with corresponding bulk order
        target_demand_id = data.get("demand_id") or data.get("bulk_order_id")
        committed_qty = float(data.get("committed_quantity", data.get("quantity", 0)))
        if target_demand_id and committed_qty > 0:
            for bo in IN_MEMORY_TABLES.get("bulk_orders", []):
                if str(bo.get("id")) == str(target_demand_id) or str(bo.get("bulk_order_id")) == str(target_demand_id):
                    current_committed = float(bo.get("total_committed", bo.get("fulfilled_quantity", 0)))
                    new_committed = current_committed + committed_qty
                    req_qty = float(bo.get("quantity_required", 100))
                    bo["total_committed"] = new_committed
                    bo["fulfilled_quantity"] = new_committed
                    bo["remaining_quantity"] = max(0.0, req_qty - new_committed)
                    bo["progress_pct"] = round((new_committed / req_qty) * 100, 1) if req_qty > 0 else 0.0
                    if bo["remaining_quantity"] <= 0:
                        bo["status"] = "fulfilled"
                    elif bo.get("status") == "open":
                        bo["status"] = "in_progress"

                    if is_mongo_online:
                        try:
                            await db.get_collection("bulk_orders").update_one(
                                {"id": bo["id"]},
                                {"$set": {
                                    "total_committed": bo["total_committed"],
                                    "fulfilled_quantity": bo["fulfilled_quantity"],
                                    "remaining_quantity": bo["remaining_quantity"],
                                    "progress_pct": bo["progress_pct"],
                                    "status": bo["status"]
                                }},
                                upsert=True
                            )
                        except Exception:
                            pass
                    try:
                        await manager.broadcast("bulk_orders", "UPDATE", bo)
                    except Exception:
                        pass
                    break

    try:
        await manager.broadcast(table, "INSERT", record_copy)
    except Exception:
        pass

    return record_copy

@router.put("/api/{table}")
async def update_record(table: str, request: Request):
    query_params = dict(request.query_params)
    data = await request.json()
    
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON update payload")

    # 1. Status Validation for Orders
    if table == "orders" and "status" in data:
        normalized_status = str(data["status"]).strip().lower()
        if normalized_status not in ALLOWED_ORDER_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid order status '{data['status']}'. Allowed statuses are: {', '.join(sorted(ALLOWED_ORDER_STATUSES))}"
            )
        data["status"] = normalized_status
        data["updated_at"] = datetime.utcnow().isoformat()

    # 2. Bulk Orders Quantity & Progress Recalculation
    if table == "bulk_orders" or "fulfilled_quantity" in data or "total_committed" in data or "quantity_required" in data:
        if "fulfilled_quantity" in data or "total_committed" in data or "quantity_required" in data:
            current_target = None
            if table == "bulk_orders":
                # Find current record to obtain base values
                if is_mongo_online:
                    try:
                        current_target = await db.get_collection("bulk_orders").find_one(query_params, {"_id": 0})
                    except Exception:
                        pass
                if not current_target:
                    current_target = next((r for r in IN_MEMORY_TABLES.get("bulk_orders", []) if all(str(r.get(k)) == str(v) for k, v in query_params.items())), None)
                
                base_req = float(data.get("quantity_required") or (current_target.get("quantity_required") if current_target else 100))
                base_fulfilled = float(data.get("fulfilled_quantity") if "fulfilled_quantity" in data else data.get("total_committed") if "total_committed" in data else (current_target.get("fulfilled_quantity", 0) if current_target else 0))
                
                # Formula: Progress (%) = (Fulfilled quantity / Total ordered quantity) * 100
                clamped_fulfilled = max(0.0, min(base_req, base_fulfilled))
                remaining = max(0.0, base_req - clamped_fulfilled)
                progress = round((clamped_fulfilled / base_req) * 100, 1) if base_req > 0 else 0.0
                
                data["quantity_required"] = base_req
                data["fulfilled_quantity"] = clamped_fulfilled
                data["total_committed"] = clamped_fulfilled
                data["remaining_quantity"] = remaining
                data["progress_pct"] = progress
                
                # Consistent status transition: Only mark fulfilled when 100% completed
                if clamped_fulfilled >= base_req and base_req > 0 and data.get("status") not in ("cancelled", "rejected"):
                    data["status"] = "fulfilled"
                elif clamped_fulfilled > 0 and data.get("status") == "open":
                    data["status"] = "in_progress"

    if query_params:
        target_id = query_params.get("id")

        # 3. Synchronize with corresponding crop / yield record
        if table == "orders" and "status" in data:
            new_status = data["status"]
            # Look up order details
            target_order = None
            if is_mongo_online:
                try:
                    target_order = await db.get_collection("orders").find_one(query_params, {"_id": 0})
                except Exception:
                    pass
            if not target_order:
                target_order = next((r for r in IN_MEMORY_TABLES.get("orders", []) if all(str(r.get(k)) == str(v) for k, v in query_params.items())), None)

            if target_order:
                crop_name = target_order.get("crop_name")
                crop_id = target_order.get("crop_id")
                qty = float(target_order.get("quantity", 0))

                crop_filter = {}
                if crop_id:
                    crop_filter["id"] = crop_id
                elif crop_name:
                    crop_filter["name"] = crop_name

                if crop_filter:
                    crop_update = {
                        "last_order_status": new_status,
                        "last_updated": datetime.utcnow().isoformat()
                    }
                    if new_status in ("accepted", "packed", "delivered"):
                        crop_update["yield_status"] = new_status
                    if is_mongo_online:
                        try:
                            await db.get_collection("crops").update_many(crop_filter, {"$set": crop_update})
                        except Exception:
                            pass
                    for c in IN_MEMORY_TABLES.get("crops", []):
                        if (crop_id and str(c.get("id")) == str(crop_id)) or (crop_name and str(c.get("name")) == str(crop_name)):
                            c.update(crop_update)

        if is_mongo_online:
            try:
                collection = db.get_collection(table)
                update_res = await collection.update_many(query_params, {"$set": data})
                
                # If document was not yet in MongoDB (e.g. from in-memory seeds), persist the full record!
                if update_res.matched_count == 0:
                    mem_match = next((r for r in IN_MEMORY_TABLES.get(table, []) if all(str(r.get(k)) == str(v) for k, v in query_params.items())), None)
                    if mem_match:
                        merged = dict(mem_match)
                        merged.update(data)
                        await collection.insert_one(dict(merged))
                    elif target_id:
                        merged = dict(query_params)
                        merged.update(data)
                        merged.setdefault("created_at", datetime.utcnow().isoformat())
                        await collection.insert_one(dict(merged))

                cursor = collection.find(query_params, {"_id": 0})
                results = await cursor.to_list(length=100)
                
                # Cross-table synchronization for status & quantity updates on bulk orders
                if "status" in data or "fulfilled_quantity" in data:
                    sync_fields = {}
                    if "status" in data: sync_fields["status"] = data["status"]
                    if "fulfilled_quantity" in data:
                        sync_fields["fulfilled_quantity"] = data["fulfilled_quantity"]
                        sync_fields["total_committed"] = data["fulfilled_quantity"]
                        sync_fields["remaining_quantity"] = data["remaining_quantity"]
                        sync_fields["progress_pct"] = data["progress_pct"]

                    if table == "orders":
                        sync_query = {"$or": [{"id": target_id}, {"order_id": target_id}, {"bulk_order_id": target_id}]} if target_id else query_params
                        await db.get_collection("bulk_orders").update_many(sync_query, {"$set": sync_fields})
                        await db.get_collection("bulk_requests").update_many(sync_query, {"$set": sync_fields})
                    elif table == "bulk_orders":
                        sync_query = {"$or": [{"id": target_id}, {"order_id": target_id}, {"bulk_order_id": target_id}]} if target_id else query_params
                        await db.get_collection("orders").update_many(sync_query, {"$set": sync_fields})

                if results:
                    payload_data = results[0] if len(results) > 0 else data
                    try:
                        await manager.broadcast(table, "UPDATE", payload_data)
                        if target_id:
                            if table == "orders":
                                await manager.broadcast("bulk_orders", "UPDATE", {**payload_data, "id": target_id, **data})
                                await manager.broadcast("bulk_requests", "UPDATE", {**payload_data, "id": target_id, **data})
                            elif table == "bulk_orders":
                                await manager.broadcast("orders", "UPDATE", {**payload_data, "id": target_id, **data})
                    except Exception:
                        pass
                    return results
            except HTTPException:
                raise
            except Exception as e:
                mark_mongo_offline()
                print(f"MongoDB update_record fallback for table {table}: {e}")

        updated_items = []
        for r in IN_MEMORY_TABLES.get(table, []):
            match = True
            for k, v in query_params.items():
                if str(r.get(k)) != str(v):
                    match = False
                    break
            if match:
                r.update(data)
                clean_r = {k: v for k, v in r.items() if k != "_id"}
                updated_items.append(clean_r)

        # Cross-table in-memory synchronization
        if target_id and ("status" in data or "fulfilled_quantity" in data):
            sync_fields = {}
            if "status" in data: sync_fields["status"] = data["status"]
            if "fulfilled_quantity" in data:
                sync_fields["fulfilled_quantity"] = data["fulfilled_quantity"]
                sync_fields["total_committed"] = data["fulfilled_quantity"]
                sync_fields["remaining_quantity"] = data["remaining_quantity"]
                sync_fields["progress_pct"] = data["progress_pct"]

            if table == "orders":
                for r in IN_MEMORY_TABLES.get("bulk_orders", []):
                    if r.get("id") == target_id or r.get("order_id") == target_id:
                        r.update(sync_fields)
                for r in IN_MEMORY_TABLES.get("bulk_requests", []):
                    if r.get("id") == target_id or r.get("order_id") == target_id:
                        r.update(sync_fields)
            elif table == "bulk_orders":
                for r in IN_MEMORY_TABLES.get("orders", []):
                    if r.get("id") == target_id or r.get("bulk_order_id") == target_id:
                        r.update(sync_fields)

        try:
            fallback_data = updated_items[0] if len(updated_items) > 0 else data
            await manager.broadcast(table, "UPDATE", fallback_data)
            if target_id:
                if table == "orders":
                    await manager.broadcast("bulk_orders", "UPDATE", {**fallback_data, "id": target_id, **data})
                    await manager.broadcast("bulk_requests", "UPDATE", {**fallback_data, "id": target_id, **data})
                elif table == "bulk_orders":
                    await manager.broadcast("orders", "UPDATE", {**fallback_data, "id": target_id, **data})
        except Exception:
            pass

        return updated_items
    return []

@router.delete("/api/{table}")
async def delete_record(table: str, request: Request):
    query_params = dict(request.query_params)
    if query_params:
        try:
            collection = db.get_collection(table)
            await collection.delete_many(query_params)
        except Exception as e:
            print(f"MongoDB delete_record fallback for table {table}: {e}")

        IN_MEMORY_TABLES[table] = [
            r for r in IN_MEMORY_TABLES[table]
            if not all(str(r.get(k)) == str(v) for k, v in query_params.items())
        ]

        try:
            await manager.broadcast(table, "DELETE", query_params)
        except Exception:
            pass

    return {"status": "deleted"}

