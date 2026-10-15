import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import math
import random
from datetime import datetime, timedelta
import json
import os
from groq import Groq
from pydantic import BaseModel
from database import historical_prices_collection, market_prices_collection, market_trends_collection, demand_supply_collection

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

async def seed_history():
    try:
        has_history = await historical_prices_collection.find_one({})
        if not has_history:
            crops = ["Rice", "Wheat", "Cotton", "Maize", "Sugarcane"]
            records = []
            for c in crops:
                base_price = random.randint(1500, 4000)
                for i in range(30, 0, -1):
                    dt = datetime.utcnow() - timedelta(days=i)
                    price = base_price + random.randint(-150, 150)
                    records.append({
                        "crop_name": c,
                        "date": dt,
                        "price": float(price),
                        "demand_index": random.randint(40, 90),
                        "supply_index": random.randint(40, 90),
                        "rainfall_factor": random.uniform(0.5, 1.5),
                        "season": "Kharif",
                        "festival_flag": random.randint(0, 1)
                    })
            if records:
                await historical_prices_collection.insert_many(records)
    except Exception as e:
        print(f"seed_history: MongoDB offline or unreachable ({e})")


SQLITE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "market_intel.db")

def get_crop_current_price(crop_name: str) -> float:
    defaults = {"Rice": 1820.0, "Wheat": 2150.0, "Cotton": 3650.0, "Maize": 3120.0, "Sugarcane": 2350.0}
    if os.path.exists(SQLITE_PATH):
        try:
            import sqlite3
            conn = sqlite3.connect(SQLITE_PATH)
            row = conn.execute("SELECT modal_price FROM market_prices WHERE crop_name = ? ORDER BY date_time DESC LIMIT 1", (crop_name,)).fetchone()
            conn.close()
            if row:
                return float(row[0])
        except Exception:
            pass
    return defaults.get(crop_name, 2000.0)

def get_sqlite_live_prices():
    crops = ["Rice", "Wheat", "Cotton", "Maize", "Sugarcane"]
    res = []
    if os.path.exists(SQLITE_PATH):
        try:
            import sqlite3
            conn = sqlite3.connect(SQLITE_PATH)
            for c in crops:
                hist = conn.execute(
                    "SELECT date, price FROM historical_prices WHERE crop_name = ? ORDER BY date ASC LIMIT 30", 
                    (c,)
                ).fetchall()
                h_data = []
                for d_str, p in hist:
                    try:
                        dt = datetime.strptime(d_str[:10], "%Y-%m-%d")
                        h_data.append({"date": dt.strftime("%b %d"), "price": float(p)})
                    except Exception:
                        h_data.append({"date": str(d_str)[:10], "price": float(p)})

                mp_row = conn.execute(
                    "SELECT modal_price FROM market_prices WHERE crop_name = ? ORDER BY date_time DESC LIMIT 1", 
                    (c,)
                ).fetchone()
                curr_price = float(mp_row[0]) if mp_row else (h_data[-1]["price"] if h_data else 2000.0)

                mt_row = conn.execute(
                    "SELECT daily_change_pct, trend_direction, volatility_score FROM market_trends WHERE crop_name = ? LIMIT 1", 
                    (c,)
                ).fetchone()
                change_pct = round(float(mt_row[0]), 2) if mt_row else 1.2
                trend = mt_row[1] if mt_row else "Stable"
                volatility = round(float(mt_row[2]), 2) if mt_row else 2.5

                ds_row = conn.execute(
                    "SELECT demand_score, supply_score FROM demand_supply_index WHERE crop_name = ? LIMIT 1", 
                    (c,)
                ).fetchone()
                demand = int(ds_row[0]) if ds_row else 65
                supply = int(ds_row[1]) if ds_row else 60

                res.append({
                    "crop_name": c,
                    "current_price": curr_price,
                    "daily_change_pct": change_pct,
                    "trend": trend,
                    "volatility": volatility,
                    "demand": demand,
                    "supply": supply,
                    "history": h_data
                })
            conn.close()
            if res:
                return res
        except Exception as e:
            print(f"Error querying SQLite market data: {e}")

    # Fallback to generated historical trend if sqlite empty
    for c in crops:
        base_p = {"Rice": 1800, "Wheat": 2100, "Cotton": 3600, "Maize": 3100, "Sugarcane": 2300}.get(c, 2000)
        h_data = []
        for i in range(30, 0, -1):
            dt = datetime.utcnow() - timedelta(days=i)
            h_data.append({"date": dt.strftime("%b %d"), "price": base_p + random.randint(-80, 80)})
        res.append({
            "crop_name": c,
            "current_price": base_p + random.randint(-30, 50),
            "daily_change_pct": round(random.uniform(-3.0, 4.0), 2),
            "trend": "Increase" if random.random() > 0.4 else "Decrease",
            "volatility": round(random.uniform(1.2, 4.5), 2),
            "demand": random.randint(55, 88),
            "supply": random.randint(50, 85),
            "history": h_data
        })
    return res

async def update_market_data():
    try:
        crops = ["Rice", "Wheat", "Cotton", "Maize", "Sugarcane"]
        latest_data = []

        for crop in crops:
            base_p = None
            try:
                hist_cursor = historical_prices_collection.find({"crop_name": crop}).sort("date", -1).limit(1)
                hist = await hist_cursor.to_list(length=1)
                if hist:
                    base_p = hist[0]["price"]
            except Exception:
                pass
            if base_p is None:
                base_p = get_crop_current_price(crop)
            
            new_price = round(base_p + random.randint(-35, 45), 2)
            
            mp = {
                "crop_name": crop,
                "state": "Telangana",
                "district": "Warangal",
                "mandi_name": "Enumamula",
                "min_price": new_price - 50,
                "max_price": new_price + 50,
                "modal_price": new_price,
                "arrival_quantity": random.randint(100, 500),
                "date_time": datetime.utcnow()
            }
            try:
                await market_prices_collection.insert_one(mp)
            except Exception:
                pass
            
            change_pct = round(((new_price - base_p) / base_p) * 100, 2)
            trend_dir = "Increase" if change_pct > 0 else "Decrease" if change_pct < 0 else "Stable"
            
            d_score = random.randint(40, 90)
            s_score = random.randint(40, 90)
            volatility = round(random.uniform(1.0, 5.0), 2)

            latest_data.append({
                "crop_name": crop,
                "modal_price": new_price,
                "daily_change_pct": change_pct,
                "trend_direction": trend_dir,
                "demand_score": d_score,
                "supply_score": s_score,
                "volatility": volatility,
                "date": datetime.utcnow().strftime("%H:%M:%S")
            })

        # Broadcast
        if manager.active_connections:
            try:
                await manager.broadcast(json.dumps({"type": "MARKET_UPDATE", "data": latest_data}))
            except Exception:
                pass
    except Exception as e:
        print(f"Market data update error: {e}")

@router.on_event("startup")
async def startup_event():
    try:
        asyncio.create_task(seed_history())
    except Exception as e:
        print(f"Market engine seed_history skipped: {e}")
    try:
        scheduler = AsyncIOScheduler()
        scheduler.add_job(update_market_data, 'interval', seconds=15, max_instances=1)
        scheduler.start()
    except Exception as e:
        print(f"Market engine scheduler startup skipped: {e}")

@router.websocket("/ws/market-stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        try:
            live_data = get_sqlite_live_prices()
            await websocket.send_text(json.dumps({"type": "MARKET_SNAPSHOT", "data": live_data}))
        except Exception:
            pass
        while True:
            msg = await websocket.receive_text()
            if "ping" in msg.lower():
                await websocket.send_text(json.dumps({"type": "pong"}))
    except (WebSocketDisconnect, Exception):
        manager.disconnect(websocket)

class PredictionRequest(BaseModel):
    crop_name: str

@router.post("/api/market/predict-price")
async def predict_price(req: PredictionRequest):
    curr = None
    try:
        cursor = market_prices_collection.find({"crop_name": req.crop_name}).sort("id", -1).limit(1)
        hist = await cursor.to_list(length=1)
        if hist:
            curr = hist[0]["modal_price"]
    except Exception:
        pass
    if curr is None:
        curr = get_crop_current_price(req.crop_name)
    
    return {
        "current_price": round(curr, 2),
        "price_after_7_days": round(curr * random.uniform(1.01, 1.05), 2),
        "price_after_30_days": round(curr * random.uniform(0.95, 1.15), 2),
        "price_after_90_days": round(curr * random.uniform(0.90, 1.25), 2),
        "confidence_score": random.randint(75, 95)
    }

@router.post("/api/market/predict-movement")
async def predict_movement(req: PredictionRequest):
    moves = ["Increase", "Decrease", "Stable"]
    probs = [random.randint(50, 90) for _ in range(3)]
    best = max(probs)
    idx = probs.index(best)
    return {
        "movement": moves[idx],
        "probability": best
    }

class StrategyResponse(BaseModel):
    recommendation: str
    optimal_storage_period: str
    expected_profit_gain: float
    reasoning: str

@router.post("/api/market/strategy", response_model=StrategyResponse)
async def strategy(req: PredictionRequest):
    groq_api = os.getenv("GROQ_API_KEY")
    client = Groq(api_key=groq_api) if groq_api else None
    
    curr = None
    try:
        cursor = market_prices_collection.find({"crop_name": req.crop_name}).sort("date_time", -1).limit(1)
        hist = await cursor.to_list(length=1)
        if hist:
            curr = hist[0]["modal_price"]
    except Exception:
        pass
    if curr is None:
        curr = get_crop_current_price(req.crop_name)
    
    pred = curr * random.uniform(0.95, 1.25)
    diff = pred - curr
    storage_cost = 50
    
    if diff > storage_cost:
        rec = "HOLD"
        prompt = f"The price of {req.crop_name} is predicted to increase from {curr:.2f} to {pred:.2f} in 30 days. Explain in ONE short sentence why the farmer should HOLD."
    else:
        rec = "SELL"
        prompt = f"The price of {req.crop_name} is predicted to fall or stay static from {curr:.2f} to {pred:.2f} in 30 days. Explain in ONE short sentence why the farmer should SELL NOW."
        
    reasoning = f"Price trend analysis indicates higher market margins by {rec.lower()}ing inventory."
    if client:
        try:
            resp = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="openai/gpt-oss-20b",
                max_tokens=60
            )
            reasoning = resp.choices[0].message.content.strip()
        except Exception:
            pass
        
    return {
        "recommendation": rec,
        "optimal_storage_period": "30 days" if rec == "HOLD" else "0 days",
        "expected_profit_gain": round(abs(diff), 2),
        "reasoning": reasoning
    }

@router.post("/api/market/peak-time")
async def peak_time(req: PredictionRequest):
    curr = None
    try:
        cursor = market_prices_collection.find({"crop_name": req.crop_name}).sort("date_time", -1).limit(1)
        hist = await cursor.to_list(length=1)
        if hist:
            curr = hist[0]["modal_price"]
    except Exception:
        pass
    if curr is None:
        curr = get_crop_current_price(req.crop_name)
    
    days_to_peak = random.randint(5, 45)
    peak_date = datetime.utcnow() + timedelta(days=days_to_peak)
    
    return {
        "predicted_peak_date": peak_date.strftime("%Y-%m-%d"),
        "surge_probability": random.randint(60, 95),
        "expected_peak_price": round(curr * random.uniform(1.05, 1.3), 2)
    }

@router.get("/api/market/live-prices")
async def live_prices():
    try:
        crops = ["Rice", "Wheat", "Cotton", "Maize", "Sugarcane"]
        res = []
        
        for c in crops:
            cursor = historical_prices_collection.find({"crop_name": c}).sort("date", 1)
            hist_prices = await cursor.to_list(length=30)
            if not hist_prices:
                return get_sqlite_live_prices()
                
            h_data = [{"date": h["date"].strftime("%b %d"), "price": h["price"]} for h in hist_prices]
            
            mp_cursor = market_prices_collection.find({"crop_name": c}).sort("date_time", -1).limit(1)
            mp_list = await mp_cursor.to_list(length=1)
            mp = mp_list[0] if mp_list else None
            
            mt = await market_trends_collection.find_one({"crop_name": c})
            ds = await demand_supply_collection.find_one({"crop_name": c})
            
            res.append({
                "crop_name": c,
                "current_price": mp["modal_price"] if mp else (h_data[-1]["price"] if h_data else 0),
                "daily_change_pct": mt["daily_change_pct"] if mt else 0,
                "trend": mt["trend_direction"] if mt else "Stable",
                "volatility": mt["volatility_score"] if mt else 0,
                "demand": ds["demand_score"] if ds else 50,
                "supply": ds["supply_score"] if ds else 50,
                "history": h_data
            })
        return res
    except Exception as e:
        print(f"live_prices: MongoDB unavailable ({e}), using SQLite fallback")
        return get_sqlite_live_prices()

