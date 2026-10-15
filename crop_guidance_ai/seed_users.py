import asyncio
from database import profiles_collection
from auth import get_password_hash
import uuid
from datetime import datetime

async def seed():
    # Farmer Account
    farmer_email = "farmer@agri.com"
    existing_farmer = await profiles_collection.find_one({"email": farmer_email})
    if not existing_farmer:
        farmer_user = {
            "id": str(uuid.uuid4()),
            "email": farmer_email,
            "password": get_password_hash("farmer123"),
            "full_name": "Demo Farmer",
            "role": "farmer",
            "region": "Andhra Pradesh",
            "phone": "9876543210",
            "created_at": datetime.utcnow()
        }
        await profiles_collection.insert_one(farmer_user)
        print("Created Farmer account: farmer@agri.com / farmer123")
    else:
        print("Farmer account already exists.")

    # Consumer Account
    consumer_email = "consumer@agri.com"
    existing_consumer = await profiles_collection.find_one({"email": consumer_email})
    if not existing_consumer:
        consumer_user = {
            "id": str(uuid.uuid4()),
            "email": consumer_email,
            "password": get_password_hash("consumer123"),
            "full_name": "Demo Consumer",
            "role": "consumer",
            "region": "Telangana",
            "phone": "9123456789",
            "created_at": datetime.utcnow()
        }
        await profiles_collection.insert_one(consumer_user)
        print("Created Consumer account: consumer@agri.com / consumer123")
    else:
        print("Consumer account already exists.")

if __name__ == "__main__":
    asyncio.run(seed())
