import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

is_mongo_online = True

def mark_mongo_offline():
    global is_mongo_online
    is_mongo_online = False

try:
    client = AsyncIOMotorClient(
        MONGO_URL,
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True,
        serverSelectionTimeoutMS=500,
        connectTimeoutMS=500,
        socketTimeoutMS=500
    )
except Exception:
    is_mongo_online = False
    client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=500, connectTimeoutMS=500, socketTimeoutMS=500)

# Database Name
db = client.agri_db

# Collections
profiles_collection = db.get_collection("profiles")
crops_collection = db.get_collection("crops")
orders_collection = db.get_collection("orders")
market_prices_collection = db.get_collection("market_prices")
notifications_collection = db.get_collection("notifications")
historical_prices_collection = db.get_collection("historical_prices")
demand_supply_collection = db.get_collection("demand_supply_index")
market_trends_collection = db.get_collection("market_trends")
spray_providers_collection = db.get_collection("spray_providers")
drone_bookings_collection = db.get_collection("drone_bookings")
