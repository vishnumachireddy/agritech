# 🌾 AgriAssist: Next-Gen AI Smart Farming & Direct-to-Consumer Ecosystem

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-LPU%20Inference-F05A28?style=flat)](https://groq.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

AgriAssist is a full-stack, enterprise-grade precision agricultural platform that bridges the gap between **Farmers** and **Consumers/Service Operators**. It integrates high-speed AI inference (Groq LPUs), machine learning crop advisories, interactive leaf pathology diagnostics, and an end-to-end autonomous drone spray dispatch lifecycle.

---

## 🧭 Live Web Applications & Endpoints

| Service | Access URL | Port / Protocol |
| :--- | :--- | :--- |
| **Frontend Web Portal** | [http://localhost:8080](http://localhost:8080) | Port 8080 (Vite HMR) |
| **FastAPI Backend Server** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | Port 8000 (Uvicorn ASGI) |
| **Interactive API Documentation** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Swagger UI |
| **Realtime Database WebSocket** | `ws://127.0.0.1:8000/ws/db-events` | WebSocket Full Duplex |

---

## 🏛️ System Architecture

```text
smart-farming-rgm-main/
├── src/                               # Frontend Single Page Application
│   ├── components/                    # Reusable UI primitives & layouts
│   │   ├── AppSidebar.tsx             # Farmer Navigation Sidebar
│   │   ├── ConsumerSidebar.tsx        # Consumer & Operator Navigation Sidebar
│   │   ├── AppLayout.tsx              # Farmer Shell Layout
│   │   ├── ConsumerLayout.tsx         # Consumer Shell Layout
│   │   ├── RoleGuard.tsx              # RBAC Route Protection
│   │   └── ui/                        # Shadcn/Radix UI accessible components
│   ├── pages/                         # Core Application Views
│   │   ├── Dashboard.tsx              # Farmer Analytics Hub & Stats
│   │   ├── Weather.tsx                # Agro-meteorological Forecasts & Spray Advisory
│   │   ├── CropScanner.tsx            # AI Plant Disease Leaf Scanner
│   │   ├── CropGuidance.tsx           # Multi-Model Crop Recommendation & Profit Engine
│   │   ├── DroneBooking.tsx           # Farmer Drone & Heavy Pump Spray Booking
│   │   ├── Irrigation.tsx             # Smart Irrigation & Water Conservation Plans
│   │   ├── RegionalInsights.tsx       # State & District Peer Benchmarks & Yields
│   │   ├── GovtSchemes.tsx            # Subsidies & Central/State Schemes Directory
│   │   ├── Fertilizer.tsx             # Conversational AI Soil & Fertilizer Bot
│   │   ├── FarmerOrders.tsx           # Farmer Order Management
│   │   ├── AgriChrono.tsx             # Agricultural Timeline & Crop Calendar
│   │   ├── consumer/                  # Consumer & Operator Experience
│   │   │   ├── ConsumerDashboard.tsx  # Consumer Market Overview
│   │   │   ├── Marketplace.tsx        # Direct-to-Consumer Produce Store
│   │   │   ├── FarmersDirectory.tsx   # Verified Farmers & Farm Profiles
│   │   │   ├── DemandTrends.tsx       # Bulk Commodity Demand Curves
│   │   │   ├── BulkOrders.tsx         # B2B Procurement Contracts
│   │   │   ├── Traceability.tsx       # Farm-to-Fork Batch QR Traceability
│   │   │   └── MyOrders.tsx           # Consumer Order History
│   │   └── provider/                  # Service Provider / Operator
│   │       └── ProviderBookings.tsx   # Spray Dispatch & Order Confirmation Console
│   └── integrations/supabase/         # Supabase Client Adapter & WebSocket Engine
├── crop_guidance_ai/                  # Python FastAPI Backend Engine
│   ├── main.py                        # Core ASGI Application & Guidance Endpoints
│   ├── edge_routes.py                 # Groq AI Vision, Fertilizer Bot & Weather API
│   ├── spray_routes.py                # Drone & Spray Providers & Booking Lifecycle
│   ├── api_routes.py                  # Tables, Orders, Schemes & RPC Endpoints
│   └── requirements.txt               # Python Dependencies
```

---

## 👥 Dual-Persona Portals & Clean Workflow Separation

### 1. 🚜 Farmer Portal (`/farmer/*`)
* **Drone Spray Booking (`/farmer/spray-booking`)**: Farmers submit booking requests specifying acreage, crop variety, preferred date, time slot, and target pest/pathogen. Real-time cost estimation calculates exact acreage pricing.
* **Non-Cluttered UI**: Farmers **cannot** approve their own bookings; they only track status updates (`PENDING` ➔ `ACCEPTED` ➔ `SCHEDULED` ➔ `IN_PROGRESS` ➔ `COMPLETED`).
* **AI Plant Pathology Scanner (`/farmer/crop-scanner`)**: Farmers capture leaf photos to instantly diagnose bacterial, fungal, and viral infections with chemical & biological treatment plans.
* **Crop Guidance (`/farmer/crop-guidance`)**: Calculates suitability scores, NPK thresholds, expected yield revenue, and strategic hold-or-sell decisions.
* **Interactive AI Chatbot (`/farmer/fertilizer`)**: Delivers real-time advice on split Urea doses, micronutrient deficiencies, and organic manure.
* **Regional Insights (`/farmer/regional-insights`)**: Interactive state & district yield benchmarking against regional averages.
* **Government Schemes (`/farmer/govt-schemes`)**: Comprehensive Indian welfare initiatives (PM-KISAN, PMFBY, Soil Health Card, Rythu Bharosa) with direct application links.

### 2. 🛡️ Consumer / Operator Portal (`/consumer/*`)
* **Spray Operator Dashboard (`/consumer/spray-bookings`)**: Operators and service providers view incoming farmer spray requests, review crop details, inspect acreage, and trigger lifecycle transitions:
  * **Accept Request**: Confirms provider availability and locks in schedule.
  * **Schedule Operator**: Assigns drone pilot and ground crew.
  * **Start Spraying**: Flags mission as active (`IN_PROGRESS`).
  * **Mark Completed**: Finalizes the service and sends instant notification.
* **Marketplace & Direct Buying (`/consumer/marketplace`)**: Consumers purchase farm-fresh produce directly from local farmers, eliminating middlemen markups.
* **Demand & Trends (`/consumer/demand`)**: B2B institutional buyers post demand requirements and view supply trends.
* **Supply Chain Traceability (`/consumer/traceability`)**: End-to-end transparency verifying soil health, harvest date, and pesticide safety.

---

## ⚡ Real-Time Drone Booking Lifecycle

The Drone & Spray Booking module features strict role-separation and live WebSocket synchronization:

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 🚜 Farmer (/farmer/spray-booking)
    participant FastAPI as ⚙️ FastAPI Backend
    participant WS as 🔄 WebSocket Broadcast (/ws/db-events)
    actor Operator as 🛡️ Operator (/consumer/spray-bookings)

    Farmer->>FastAPI: POST /api/drone-bookings (Crop, Acres, Date, Location)
    FastAPI->>WS: Broadcast DB Event (table="drone_bookings", action="INSERT")
    WS-->>Operator: Live UI Update: New Pending Booking Appears
    Note over Operator: Operator reviews field area & estimated revenue
    Operator->>FastAPI: PUT /api/drone-bookings/{id}/status ("ACCEPTED")
    FastAPI->>WS: Broadcast DB Event (table="drone_bookings", action="UPDATE")
    WS-->>Farmer: Live UI Notification: Booking Accepted!
    Operator->>FastAPI: PUT /api/drone-bookings/{id}/status ("SCHEDULED")
    Operator->>FastAPI: PUT /api/drone-bookings/{id}/status ("IN_PROGRESS")
    Operator->>FastAPI: PUT /api/drone-bookings/{id}/status ("COMPLETED")
    WS-->>Farmer: Real-time status update to "COMPLETED"
```

---

## 🤖 AI Models & Intelligent Engines

AgriAssist is powered by state-of-the-art open models orchestrated via **Groq High-Speed LPU Inference**:

| Feature | Primary Model | Fallback Models | Latency | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Fertilizer Chatbot** | `qwen/qwen3.8-27b` | `openai/gpt-oss-120b`, `openai/gpt-oss-20b` | < 450ms | NPK dosages, basal application schedules, organic pest repellents |
| **Crop Guidance Chat** | `qwen/qwen3.8-27b` | `openai/gpt-oss-120b` | < 500ms | Multi-turn agricultural agronomy, irrigation cycles |
| **Crop Disease Diagnosis** | `qwen/qwen3.8-27b` | Diagnostic Plant Pathology Engine | < 600ms | Structured JSON output: disease name, confidence %, symptoms, treatment, prevention |
| **Market Intelligence** | SQLite Local Engine | Data Scraper & Fallback DB | < 25ms | Historical price trend regression, storage strategy recommendations |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher ([Node.js Official](https://nodejs.org/))
* **Python**: `v3.9` or higher ([Python Official](https://www.python.org/))
* **PowerShell** (Windows) or **Bash** (macOS/Linux)

---

### Step 1: Clone & Configure Environments

```bash
git clone https://github.com/your-username/smart-farming-rgm.git
cd smart-farming-rgm-main
```

#### 1. Frontend Configuration (`.env`)
Verify `.env` in the root directory:
```env
VITE_SUPABASE_URL=https://njpapswbdnvbtxituwfa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_pVqm-soomiNGM1F-_HPguQ_OPsEEY3r
```

#### 2. Backend Configuration (`crop_guidance_ai/.env`)
Verify `crop_guidance_ai/.env`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/?appName=agri
JWT_SECRET=supersecret_jwt_key_123
```

---

### Step 2: Start the Python FastAPI Server

Open a terminal and execute:

```powershell
# Navigate to backend directory
cd d:\smart-farming-rgm-main\crop_guidance_ai

# Activate Python virtual environment
.\venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

* Backend running at: `http://127.0.0.1:8000`
* Interactive API Docs at: `http://127.0.0.1:8000/docs`

---

### Step 3: Start the Vite React Frontend

Open a **second terminal window** and run:

```powershell
# Ensure you are at the project root
cd d:\smart-farming-rgm-main

# Install dependencies (first time only)
npm install

# Start Vite development server
npm run dev
```

* Frontend running at: `http://localhost:8080` (or `http://localhost:5173`)

---

## 📡 API Reference Summary

### 🤖 AI Endpoints
* `POST /api/fertilizer-chat`: Conversational fertilizer advice.
  * *Request Body*: `{"message": "What is the best fertilizer for wheat during tillering?"}`
* `POST /api/crop-guidance/chat`: Agronomy and irrigation intelligence.
  * *Request Body*: `{"message": "Explain drip irrigation for tomato fields"}`
* `POST /api/crop-disease-scan`: Plant disease image diagnostic analysis.
  * *Request Body*: `{"imageBase64": "<base64_string>", "cropType": "Tomato"}`

### 🛸 Drone & Spray Management
* `GET /api/spray-providers?service_type=Drone`: List verified spraying operators.
* `POST /api/drone-bookings`: Farmer creates a spraying appointment.
* `GET /api/drone-bookings`: Operator views all active bookings.
* `PUT /api/drone-bookings/{id}/status`: Operator updates status (`ACCEPTED`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`).

### 📈 Market Intelligence
* `GET /api/market/live-prices`: Real-time mandi commodity price feeds.
* `POST /api/market/predict-price`: Algorithmic price forecast for upcoming months.
* `POST /api/market/strategy`: Crop holding vs. immediate selling optimization.

### 🏛️ Government Schemes & Regional Benchmarking
* `GET /api/tables/government_schemes`: Indian farmer welfare schemes & subsidies.
* `GET /api/tables/farmer_details`: Yield, landholding, and regional benchmarks.

---

## 🧪 Production Verification & Build

To verify production readiness and ensure zero TypeScript errors:

```powershell
npm run build
```

Expected output:
```text
✓ 3011 modules transformed.
dist/index.html                     1.42 kB │ gzip:   0.58 kB
dist/assets/index-B1xigELD.css    105.44 kB │ gzip:  21.78 kB
dist/assets/index-D9eG95ON.js   1,400.28 kB │ gzip: 400.07 kB
✓ built in 16.82s
```

---

## 🔒 Security & Resilience Measures
1. **Fallback Architecture**: When cloud services (MongoDB Atlas / Supabase Edge Functions) experience network or TLS handshake limits, the system automatically falls back to local high-speed SQLite (`market_intel.db`) and in-memory stores with zero downtime.
2. **WebSocket Reconnection**: Browser-side WebSocket client implements exponential backoff to handle network drops cleanly.
3. **Role-Based Guards**: Farmers and Consumers are partitioned via `<RoleGuard>`, ensuring farmers only execute bookings while operators handle dispatch and approvals.

---

## 📜 License
Developed for the **Smart Farming & Rural Growth Hackathon**. Built with 💚 for modern Indian agriculture.
