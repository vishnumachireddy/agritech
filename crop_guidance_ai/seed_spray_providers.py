import asyncio
from database import db

providers_collection = db.get_collection("spray_providers")

providers_data = [
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
  },
  {
    "id": "provider-sp-103",
    "provider_name": "SkyCrop AeroSprayers & Hybrid Tech",
    "service_type": "Both",
    "phone": "+91 97654 32109",
    "rate_per_acre": 500.0,
    "service_region": "Maharashtra",
    "is_available": True,
    "rating": 4.8
  },
  {
    "id": "provider-sp-104",
    "provider_name": "GreenShield Field Pump Operators",
    "service_type": "Pump",
    "phone": "+91 96543 21098",
    "rate_per_acre": 300.0,
    "service_region": "Maharashtra",
    "is_available": True,
    "rating": 4.6
  }
]

async def seed_spray_providers():
    print("Seeding spray providers into MongoDB Atlas...")
    for p in providers_data:
        await providers_collection.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
    print("Spray providers successfully seeded!")

if __name__ == "__main__":
    asyncio.run(seed_spray_providers())
