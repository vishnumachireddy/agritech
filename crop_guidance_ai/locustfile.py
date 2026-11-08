import json
import random
from locust import HttpUser, task, between

class AgroSmartFarmerUser(HttpUser):
    weight = 3
    wait_time = between(1.0, 3.0)

    @task(4)
    def fetch_government_schemes(self):
        """High frequency read of government schemes (verifies Redis cache hit)."""
        self.client.get("/api/government_schemes", name="[GET] /api/government_schemes")

    @task(3)
    def fetch_spray_providers(self):
        """Read spray providers listing (verifies Redis cache hit)."""
        self.client.get("/api/spray-providers", name="[GET] /api/spray-providers")

    @task(3)
    def fetch_market_prices(self):
        """Read indexed market prices."""
        self.client.get("/api/market_prices?limit=50", name="[GET] /api/market_prices")

    @task(2)
    def fetch_weather(self):
        """Weather endpoint with geo-caching."""
        payload = {
            "region": "Andhra Pradesh",
            "lat": 15.8281,
            "lon": 78.0373
        }
        self.client.post("/api/weather", json=payload, name="[POST] /api/weather")

    @task(1)
    def crop_recommendation(self):
        """Crop recommendation inference."""
        payload = {
            "soil_type": "Loamy",
            "nitrogen": 45.0,
            "phosphorus": 20.0,
            "potassium": 30.0,
            "temperature": 27.5,
            "humidity": 65.0,
            "rainfall": 110.0,
            "ph": 6.5,
            "season": "Kharif"
        }
        self.client.post("/api/crop-guidance/recommend", json=payload, name="[POST] /api/crop-guidance/recommend")

class AgroSmartConsumerUser(HttpUser):
    weight = 2
    wait_time = between(1.0, 3.0)

    @task(4)
    def browse_marketplace(self):
        """Browse crop listings."""
        self.client.get("/api/crops", name="[GET] /api/crops")

    @task(3)
    def check_bulk_orders(self):
        """Check active pooled bulk orders."""
        self.client.get("/api/bulk_orders", name="[GET] /api/bulk_orders")

    @task(2)
    def check_demand_trends(self):
        """Check demand and supply aggregates."""
        self.client.get("/api/demand_supply_index", name="[GET] /api/demand_supply_index")

    @task(1)
    def health_check(self):
        """Health check endpoint."""
        self.client.get("/healthz", name="[GET] /healthz")
