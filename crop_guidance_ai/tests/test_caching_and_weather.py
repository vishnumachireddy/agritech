import sys
import os
import asyncio
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from cache_service import cache_service

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_cache_service_fallback_and_stats():
    # Verify cache service stats structure
    stats = cache_service.get_stats()
    assert "hits" in stats
    assert "misses" in stats
    assert "hit_ratio_pct" in stats

    # Verify cache-aside with fetcher using asyncio.run
    call_count = 0
    async def sample_fetcher():
        nonlocal call_count
        call_count += 1
        return {"data": "cached_data_item"}

    res = asyncio.run(cache_service.get_or_set("test_ns", "key_1", sample_fetcher, ttl_seconds=60))
    assert res == {"data": "cached_data_item"}
    assert call_count == 1

def test_weather_endpoint(client: TestClient):
    payload = {"region": "Andhra Pradesh", "lat": 15.8281, "lon": 78.0373}
    res = client.post("/api/weather", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "location" in data
    assert "current" in data
    assert "forecast" in data
    assert len(data["forecast"]) > 0

def test_crop_recommendation_endpoint(client: TestClient):
    payload = {
        "soil_type": "Loamy",
        "nitrogen": 50.0,
        "phosphorus": 25.0,
        "potassium": 30.0,
        "temperature": 28.5,
        "humidity": 65.0,
        "rainfall": 120.0,
        "ph": 6.5,
        "season": "Kharif"
    }
    res = client.post("/api/crop-guidance/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "recommended_crop" in data
    assert "confidence_score" in data
    assert "ai_explanation" in data
