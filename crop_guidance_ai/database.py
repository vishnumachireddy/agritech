import os
import certifi
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
from dotenv import load_dotenv

load_dotenv()
# Also explicitly load backend directory .env if present
backend_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)

logger = logging.getLogger("agrosmart.database")

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
ALLOW_INSECURE_TLS = os.getenv("MONGO_TLS_INSECURE", "false").lower() in ("true", "1", "yes")

is_mongo_online = True

def mark_mongo_offline():
    global is_mongo_online
    is_mongo_online = False
    logger.warning("MongoDB has been marked OFFLINE. Using in-memory/cache fallback.")

def mark_mongo_online():
    global is_mongo_online
    is_mongo_online = True

# Client options for high-concurrency production connection pooling
client_kwargs = {
    "serverSelectionTimeoutMS": 5000,
    "connectTimeoutMS": 5000,
    "socketTimeoutMS": 5000,
    "maxPoolSize": 100,
    "minPoolSize": 10,
    "maxIdleTimeMS": 45000,
    "retryWrites": True
}

if "mongodb+srv://" in MONGO_URL or "tls=true" in MONGO_URL.lower():
    if ALLOW_INSECURE_TLS:
        client_kwargs["tlsAllowInvalidCertificates"] = True
        client_kwargs["tlsAllowInvalidHostnames"] = True
    else:
        client_kwargs["tlsCAFile"] = certifi.where()

try:
    client = AsyncIOMotorClient(MONGO_URL, **client_kwargs)
except Exception as e:
    logger.error(f"Failed to initialize primary MongoDB client: {e}")
    is_mongo_online = False
    client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)

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
bulk_orders_collection = db.get_collection("bulk_orders")
bulk_requests_collection = db.get_collection("bulk_requests")
farmer_commitments_collection = db.get_collection("farmer_commitments")
farmer_details_collection = db.get_collection("farmer_details")
government_schemes_collection = db.get_collection("government_schemes")
crop_traceability_collection = db.get_collection("crop_traceability")

async def ensure_database_indexes():
    """Ensure all required production indexes exist on startup."""
    global is_mongo_online
    try:
        # Ping cluster to test connection
        await client.admin.command("ping")
        mark_mongo_online()
        logger.info("MongoDB cluster ping successful. Ensuring indexes...")
        
        # 1. Profiles
        await profiles_collection.create_index("id")
        await profiles_collection.create_index("email", unique=True, sparse=True)
        await profiles_collection.create_index("role")

        # 2. Orders
        await orders_collection.create_index("id")
        await orders_collection.create_index([("customer_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)])
        await orders_collection.create_index([("farmer_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)])
        await orders_collection.create_index("status")

        # 3. Crops
        await crops_collection.create_index("id")
        await crops_collection.create_index("farmer_id")
        await crops_collection.create_index("crop_type")

        # 4. Bulk Orders
        await bulk_orders_collection.create_index("id")
        await bulk_orders_collection.create_index("customer_id")
        await bulk_orders_collection.create_index("farmer_id")
        await bulk_orders_collection.create_index("status")

        # 5. Drone Bookings
        await drone_bookings_collection.create_index("id")
        await drone_bookings_collection.create_index("booking_id")
        await drone_bookings_collection.create_index("farmer_id")
        await drone_bookings_collection.create_index("provider_id")
        await drone_bookings_collection.create_index("status")

        # 6. Market Prices
        await market_prices_collection.create_index([("crop_name", pymongo.ASCENDING), ("state", pymongo.ASCENDING)])
        await market_prices_collection.create_index([("date", pymongo.DESCENDING)])

        # 7. Notifications
        await notifications_collection.create_index([("user_id", pymongo.ASCENDING), ("read", pymongo.ASCENDING)])

        # 8. Schemes
        await government_schemes_collection.create_index("category")

        logger.info("MongoDB indexes verified and ready.")
    except Exception as e:
        mark_mongo_offline()
        logger.warning(f"Could not connect to MongoDB cluster for index initialization: {e}")
