import asyncio
from database import db, profiles_collection, crops_collection, orders_collection, market_prices_collection
from auth import get_password_hash
import uuid
from datetime import datetime

async def seed_full_demo():
    print("Seeding full demo data...")
    
    # 1. Farmers
    farmers = [
        {
            "id": "farmer-demo-1",
            "email": "farmer@agri.com",
            "password": get_password_hash("farmer123"),
            "full_name": "Ramesh Kumar",
            "role": "farmer",
            "region": "Andhra Pradesh",
            "phone": "+91 9876543210",
            "created_at": datetime.utcnow()
        },
        {
            "id": "farmer-demo-2",
            "email": "suresh@agri.com",
            "password": get_password_hash("farmer123"),
            "full_name": "Suresh Patel",
            "role": "farmer",
            "region": "Maharashtra",
            "phone": "+91 9812345678",
            "created_at": datetime.utcnow()
        }
    ]
    for f in farmers:
        await profiles_collection.update_one({"email": f["email"]}, {"$set": f}, upsert=True)
        
    # 2. Farmer Details
    farmer_details_col = db.get_collection("farmer_details")
    await farmer_details_col.update_one(
        {"user_id": "farmer-demo-1"},
        {"$set": {
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
            "latitude": 15.7747,
            "longitude": 78.0557
        }},
        upsert=True
    )
    
    # 3. Consumers
    consumers = [
        {
            "id": "consumer-demo-1",
            "email": "consumer@agri.com",
            "password": get_password_hash("consumer123"),
            "full_name": "Anita Sharma",
            "role": "consumer",
            "region": "Telangana",
            "phone": "+91 9123456789",
            "created_at": datetime.utcnow()
        }
    ]
    for c in consumers:
        await profiles_collection.update_one({"email": c["email"]}, {"$set": c}, upsert=True)

    # 4. Crops for Sale (Marketplace)
    demo_crops = [
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
            "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",
            "grade": "A+",
            "harvest_date": "2026-02-15",
            "created_at": datetime.utcnow()
        },
        {
            "id": "crop-102",
            "farmer_id": "farmer-demo-1",
            "farmer_name": "Ramesh Kumar",
            "name": "Raw Organic Cotton Bales",
            "crop_type": "Cotton",
            "description": "High fiber long staple organic cotton.",
            "price": 120,
            "quantity": 800,
            "unit": "kg",
            "location": "Andhra Pradesh",
            "image_url": "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=500&auto=format&fit=crop&q=60",
            "grade": "A",
            "harvest_date": "2026-02-10",
            "created_at": datetime.utcnow()
        },
        {
            "id": "crop-103",
            "farmer_id": "farmer-demo-2",
            "farmer_name": "Suresh Patel",
            "name": "Fresh Harvest Sharbati Wheat",
            "crop_type": "Wheat",
            "description": "Golden Sharbati wheat grains directly from Nashik farms.",
            "price": 42,
            "quantity": 2500,
            "unit": "kg",
            "location": "Maharashtra",
            "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=60",
            "grade": "A+",
            "harvest_date": "2026-02-20",
            "created_at": datetime.utcnow()
        }
    ]
    for crop in demo_crops:
        await crops_collection.update_one({"id": crop["id"]}, {"$set": crop}, upsert=True)
        
    # 5. Orders
    demo_orders = [
        {
            "id": "order-501",
            "consumer_id": "consumer-demo-1",
            "farmer_id": "farmer-demo-1",
            "crop_id": "crop-101",
            "crop_name": "Organic Sona Masoori Rice",
            "quantity": 50,
            "total_price": 2750,
            "status": "pending",
            "created_at": datetime.utcnow()
        },
        {
            "id": "order-502",
            "consumer_id": "consumer-demo-1",
            "farmer_id": "farmer-demo-1",
            "crop_id": "crop-102",
            "crop_name": "Raw Organic Cotton Bales",
            "quantity": 100,
            "total_price": 12000,
            "status": "delivered",
            "created_at": datetime.utcnow()
        }
    ]
    for order in demo_orders:
        await orders_collection.update_one({"id": order["id"]}, {"$set": order}, upsert=True)
        
    # 6. Bulk Orders
    bulk_orders_col = db.get_collection("bulk_orders")
    demo_bulk = [
        {
            "id": "bulk-901",
            "customer_id": "consumer-demo-1",
            "crop_name": "Organic Sona Masoori Rice",
            "quantity_required": 5000,
            "unit": "kg",
            "region": "Andhra Pradesh",
            "expected_delivery_start": "2026-03-01",
            "expected_delivery_end": "2026-03-15",
            "status": "open",
            "created_at": datetime.utcnow()
        }
    ]
    for b in demo_bulk:
        await bulk_orders_col.update_one({"id": b["id"]}, {"$set": b}, upsert=True)

    # 7. Traceability
    traceability_col = db.get_collection("crop_traceability")
    demo_trace = [
        {
            "id": "trace-701",
            "order_id": "order-501",
            "crop_name": "Organic Sona Masoori Rice",
            "sowing_date": "2025-11-01",
            "harvest_date": "2026-02-10",
            "packaging_date": "2026-02-12",
            "farm_location": "Andhra Pradesh",
            "soil_type": "Black Alluvial",
            "fertilizer_used": "Organic Compost & Neem Cake",
            "pesticide_used": "Biopesticides Only",
            "certification_type": "Organic"
        }
    ]
    for t in demo_trace:
        await traceability_col.update_one({"id": t["id"]}, {"$set": t}, upsert=True)

    # 8. Government Schemes
    schemes_col = db.get_collection("government_schemes")
    demo_schemes = [
        {
            "id": "scheme-1",
            "title": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
            "category": "Financial",
            "description": "Income support of ₹6,000/- per year in three equal installments to all landholding farmer families.",
            "benefits": ["₹6,000 direct bank transfer per year", "Direct Benefit Transfer (DBT)", "100% Central Govt Funded"],
            "official_url": "https://pmkisan.gov.in/",
            "icon_name": "Landmark",
            "created_at": datetime.utcnow()
        },
        {
            "id": "scheme-2",
            "title": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            "category": "Insurance",
            "description": "Financial support to farmers suffering crop loss/damage arising out of unforeseen natural calamities.",
            "benefits": ["Low premium rate of 1.5% for Rabi & 2% for Kharif", "Full insured amount for natural disasters", "Fast claim settlement via tech"],
            "official_url": "https://pmfby.gov.in/",
            "icon_name": "ShieldCheck",
            "created_at": datetime.utcnow()
        },
        {
            "id": "scheme-3",
            "title": "Paramparagat Krishi Vikas Yojana (PKVY)",
            "category": "Organic",
            "description": "Promotes organic farming through cluster approach and Participatory Guarantee System (PGS) certification.",
            "benefits": ["₹50,000 per hectare financial assistance", "Free organic certification support", "Direct market linkage for organic produce"],
            "official_url": "https://pgsindia-ncof.gov.in/",
            "icon_name": "Leaf",
            "created_at": datetime.utcnow()
        },
        {
            "id": "scheme-4",
            "title": "Soil Health Card Scheme",
            "category": "Infrastructure",
            "description": "Issues soil health cards to farmers with crop-wise recommendations of nutrients and fertilizers.",
            "benefits": ["Comprehensive 12-parameter soil testing", "Customized fertilizer dosage advice", "Lowers input cost & improves yield"],
            "official_url": "https://soilhealth.dac.gov.in/",
            "icon_name": "Building",
            "created_at": datetime.utcnow()
        }
    ]
    for s in demo_schemes:
        await schemes_col.update_one({"id": s["id"]}, {"$set": s}, upsert=True)

    print("Full demo data successfully seeded into MongoDB Atlas!")

if __name__ == "__main__":
    asyncio.run(seed_full_demo())
