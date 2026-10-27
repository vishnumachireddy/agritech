import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
from groq import Groq
from dotenv import load_dotenv
from PIL import Image, ImageStat
import io
import numpy as np

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api_routes import router as api_router
from edge_routes import weather_router
from spray_routes import spray_router
import json
import base64
import random
app.include_router(weather_router)
app.include_router(spray_router)
app.include_router(api_router)

# Groq Client setup
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY is not set in environment variables.")

try:
    groq_client = Groq(api_key=GROQ_API_KEY)
except Exception as e:
    print(f"Error initializing Groq client: {e}")
    groq_client = None

# Base path for models and datasets
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")

# Global Variables for Models and Datasets
models = {}
datasets = {}

@app.on_event("startup")
def load_resources():
    # Load Models
    model_files = [
        "crop_model.pkl", "soil_npk_model.pkl", "ph_model.pkl",
        "profit_model.pkl", "price_model.pkl", "future_price_model.pkl", "encoders.pkl"
    ]
    for m in model_files:
        path = os.path.join(MODELS_DIR, m)
        if os.path.exists(path):
            try:
                models[m] = joblib.load(path)
            except Exception as e:
                print(f"Failed to load {m}: {e}")
        else:
            print(f"Model file {m} not found in {MODELS_DIR}")

    # Load Datasets
    dataset_files = [
        "crop_recommendation_dataset.csv", "soil_npk_dataset.csv",
        "ph_dataset.csv", "crop_profit_dataset.csv", "historical_price_dataset.csv"
    ]
    for d in dataset_files:
        path = os.path.join(DATASETS_DIR, d)
        if os.path.exists(path):
            try:
                datasets[d] = pd.read_csv(path)
            except Exception as e:
                print(f"Failed to load dataset {d}: {e}")
        else:
            print(f"Dataset file {d} not found in {DATASETS_DIR}")

def ask_groq(prompt: str, system_prompt: str = "You are an agricultural expert AI. Only answer questions related to agriculture, farming, crops, and soil. Do not answer off-topic questions.") -> str:
    if not groq_client: return "AI explanation temporarily unavailable. Please try again."
    for model_name in ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]:
        try:
            response = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                model=model_name,
                max_tokens=512
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq API Error with {model_name}: {e}")
    return "AI explanation temporarily unavailable. Please try again."

def generate_ai_explanation(crop_name: str, input_data: dict) -> str:
    system_prompt = "You are an agricultural AI expert. Only give farming-related advice."
    prompt = f"""Recommended Crop: {crop_name}
Soil Data: {input_data}

Explain:
1) Why this crop is suitable
2) Soil preparation steps
3) Fertilizer schedule
4) Irrigation plan
5) Pest management advice
6) Expected yield timeline

Return clear structured bullet points."""
    return ask_groq(prompt, system_prompt)

# 1) POST /api/crop-guidance/recommend
class RecommendInput(BaseModel):
    soil_type: str
    nitrogen: float
    phosphorus: float
    potassium: float
    temperature: float
    humidity: float
    rainfall: float
    ph: float
    season: str

@app.post("/api/crop-guidance/recommend")
def recommend_crop(data: RecommendInput):
    # Fallback to simulated logic if real model is absent
    recommended_crop = "Cotton"
    confidence = 0.85
    if "crop_model.pkl" in models:
        # Actual ML logic here using models["crop_model.pkl"]
        pass
    else:
        # Mocking based on inputs
        if data.rainfall > 100:
            recommended_crop = "Rice"

    explanation = generate_ai_explanation(
        recommended_crop,
        {
            "soil_type": data.soil_type,
            "NPK": f"{data.nitrogen}, {data.phosphorus}, {data.potassium}",
            "pH": data.ph,
            "rainfall": f"{data.rainfall}mm",
            "season": data.season
        }
    )

    return {
        "recommended_crop": recommended_crop,
        "confidence_score": confidence,
        "ai_explanation": explanation
    }

# 2) POST /api/crop-guidance/soil-analysis
class SoilAnalysisInput(BaseModel):
    region: str
    soil_type: str
    rainfall: float

@app.post("/api/crop-guidance/soil-analysis")
def soil_analysis(data: SoilAnalysisInput):
    n = 45.0
    p = 20.0
    k = 30.0
    ph = 6.5
    if "soil_npk_model.pkl" in models and "ph_model.pkl" in models:
        # actual prediction step
        pass
    
    return {
        "predicted_nitrogen": n,
        "predicted_phosphorus": p,
        "predicted_potassium": k,
        "predicted_ph": ph,
        "fertilizer_recommendation": f"Add Urea to boost N by {100-n}% and Organic compost."
    }

# 3) POST /api/crop-guidance/profit-estimation
class ProfitEstimationInput(BaseModel):
    crop_name: str
    land_size: float

@app.post("/api/crop-guidance/profit-estimation")
def profit_estimation(data: ProfitEstimationInput):
    revenue = 50000 * data.land_size
    cost = 20000 * data.land_size
    if "profit_model.pkl" in models:
        pass
        
    return {
        "expected_revenue": revenue,
        "estimated_cost": cost,
        "net_profit": revenue - cost,
        "strategic_tip": f"Optimize irrigation to lower your {cost} estimated cost."
    }

# 4) POST /api/crop-guidance/market-strategy
class MarketStrategyInput(BaseModel):
    crop_name: str
    current_price: float
    storage_capacity_months: int

@app.post("/api/crop-guidance/market-strategy")
def market_strategy(data: MarketStrategyInput):
    rec = "store" if data.storage_capacity_months > 2 else "sell_now"
    future_price = data.current_price * 1.15
    if "future_price_model.pkl" in models:
        pass
        
    return {
        "recommendation": rec,
        "future_price_prediction": future_price,
        "months_recommended": max(1, data.storage_capacity_months - 1),
        "reasoning": f"Prices are historically expected to rise by {future_price - data.current_price:.2f} over the next few months."
    }

# 5) POST /api/crop-guidance/chat
class ChatInput(BaseModel):
    message: str

@app.post("/api/crop-guidance/chat")
def chat(data: ChatInput):
    prompt = f"User: {data.message}"
    reply = ask_groq(prompt)
    return {"response": reply}

# 6) POST /api/crop-guidance/scan
class ScanInput(BaseModel):
    image: str

class ImageProcessor:
    @staticmethod
    def process_image(base64_str: str):
        try:
            image_data = base64.b64decode(base64_str)
            image = Image.open(io.BytesIO(image_data))
            
            # 1. Quality Check - Brightness
            stat = ImageStat.Stat(image.convert('L'))
            brightness = stat.mean[0]
            if brightness < 40:
                raise HTTPException(status_code=400, detail="Low lighting detected. Please retake image in better light.")
            
            # 2. Resize to 224x224 (Standard for CNNs like ResNet/EfficientNet)
            image = image.resize((224, 224))
            
            # 3. Normalize pixels (0-1)
            img_array = np.array(image) / 255.0
            
            return img_array, "Clear"
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=400, detail="Image quality insufficient or invalid format. Please retake clearly.")

class CropAiEngine:
    @staticmethod
    def predict(img_array):
        # STAGE 1: CROP IDENTIFICATION
        crops = ["Tomato", "Potato", "Rice", "Wheat", "Cotton"]
        # In production, uses: identified_crop = crop_model.predict(img_array)
        detected_crop = random.choice(crops)
        crop_conf = round(random.uniform(0.72, 0.98), 2)
        
        if crop_conf < 0.70:
             raise HTTPException(status_code=400, detail="Low confidence in crop detection. Please capture a clearer image.")

        # STAGE 2: CROP-SPECIFIC DISEASE DETECTION
        # Load specific model: models[f"{detected_crop.lower()}_disease_model.h5"]
        diseases = {
            "Tomato": ["Early Blight", "Late Blight", "Bacterial Wilt", "Healthy"],
            "Potato": ["Late Blight", "Common Scab", "Black Scurf", "Healthy"],
            "Rice": ["Blast", "Brown Spot", "Sheath Blight", "Healthy"],
            "Wheat": ["Rust", "Powdery Mildew", "Loose Smut", "Healthy"],
            "Cotton": ["Boll Rot", "Leaf Spot", "Wilt", "Healthy"]
        }
        
        disease = random.choice(diseases.get(detected_crop, ["Healthy"]))
        disease_conf = round(random.uniform(0.75, 0.96), 2)
        
        if disease_conf < 0.70:
            raise HTTPException(status_code=400, detail="AI not fully confident in disease detection. Please retake image in good lighting.")

        # Severity Calculation Logic
        if disease == "Healthy":
            severity = "Low"
            severity_pct = random.randint(0, 5)
        else:
            # Simulated based on "Infection area percentage"
            severity_pct = random.randint(10, 85)
            if severity_pct < 20: severity = "Low"
            elif severity_pct <= 50: severity = "Medium"
            else: severity = "High"

        return detected_crop, crop_conf, disease, disease_conf, severity, severity_pct

@app.post("/api/crop-guidance/scan")
def scan_crop(data: ScanInput):
    # Process image (resize, normalize, quality check)
    img_array, quality = ImageProcessor.process_image(data.image)
    
    # 2-Stage Inference Pipeline
    detected_crop, crop_conf, disease, disease_conf, severity, severity_pct = CropAiEngine.predict(img_array)

    # Call Groq for dynamic production-grade advisory
    system_prompt = "You are a senior agricultural plant pathologist AI. Assist farmers with disease recovery plans."
    
    if disease == "Healthy":
        prompt = f"The {detected_crop} is healthy. Give 3 preventive tips and nutrient optimization advice for this crop. Provide response in EXACT JSON format: {{'advisory': '...', 'prevention': [...], 'nutrients': '...'}}"
    else:
        prompt = f"""Generate a production-grade management strategy for {disease} in {detected_crop} with {severity} severity.
        Provide structured data in EXACT JSON format:
        {{
            "symptoms": ["..."],
            "causes": ["..."],
            "treatment_plan": {{
                "chemical_solution": "...",
                "organic_solution": "...",
                "fertilizer_advice": "...",
                "irrigation_adjustment": "..."
            }},
            "prevention_tips": ["..."],
            "expected_yield_impact": "...% yield reduction",
            "market_impact": "...",
            "recovery_timeline": "..."
        }}"""

    ai_json_str = ask_groq(prompt, system_prompt)
    
    try:
        start = ai_json_str.find('{')
        end = ai_json_str.rfind('}') + 1
        ai_data = json.loads(ai_json_str[start:end])
    except:
        ai_data = {
            "symptoms": ["Visible spots or lesions on leaves"],
            "causes": ["High humidity and fungal spores"],
            "treatment_plan": {
                "chemical_solution": "Apply Copper-based fungicide",
                "organic_solution": "Neem oil spray",
                "fertilizer_advice": "Boost Potassium",
                "irrigation_adjustment": "Avoid overhead watering"
            },
            "prevention_tips": ["Crop rotation", "Clean seeds"],
            "expected_yield_impact": "10-20% reduction",
            "market_impact": "Lower grade quality",
            "recovery_timeline": "7-14 days"
        }

    return {
        "crop_name": detected_crop,
        "crop_confidence": crop_conf,
        "disease_name": disease,
        "disease_confidence": disease_conf,
        "severity": severity,
        "severity_pct": severity_pct,
        "advisory": ai_data
    }

@app.get("/api/test-groq")
def test_groq():
    sample_input = {
        "soil_type": "Loamy",
        "NPK": "45, 20, 30",
        "pH": 6.5,
        "rainfall": "120mm",
        "season": "Kharif"
    }
    explanation = generate_ai_explanation("Rice", sample_input)
    return {"status": "success", "explanation": explanation}
