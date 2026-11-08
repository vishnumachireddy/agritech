# 🌾 AgriAssist (AgroSmart AI): Next-Gen AI Smart Farming & Direct-to-Consumer Ecosystem

> **Master Project Documentation & Presentation Guide**  
> A complete, clean, text-based explanation of the entire **AgriAssist (AgroSmart AI)** platform. Designed for all-time project explanation, viva voce reviews, hackathon demonstrations, and developer reference.

---

## 📌 Table of Contents
1. [Executive Summary & 2-Minute Elevator Pitch](#1-executive-summary--2-minute-elevator-pitch)
2. [Project Origin: How We Started](#2-project-origin-how-we-started)
3. [The Core Problems Identified (The 7 Critical Gaps in Agriculture)](#3-the-core-problems-identified-the-7-critical-gaps-in-agriculture)
4. [How We Overcame Those Problems (Our Solution Strategy)](#4-how-we-overcame-those-problems-our-solution-strategy)
5. [System Architecture & Technology Stack](#5-system-architecture--technology-stack)
6. [Farmer-Side Modules: What They Do & How They Work](#6-farmer-side-modules-what-they-do--how-they-work)
7. [Consumer & Operator-Side Modules: What They Do & How They Work](#7-consumer--operator-side-modules-what-they-do--how-they-work)
8. [Cross-Cutting Innovations](#8-cross-cutting-innovations)
9. [Local Setup & Getting Started](#9-local-setup--getting-started)
10. [API Reference Summary](#10-api-reference-summary)
11. [Viva & Presentation Q&A Cheatsheet](#11-viva--presentation-qa-cheatsheet)
12. [All Application Routes Reference](#12-all-application-routes-reference)

---

## 1. 🎙️ Executive Summary & 2-Minute Elevator Pitch

### What is AgriAssist?
**AgriAssist** (branded as **AgroSmart AI**) is a full-stack, dual-persona precision agriculture and direct-to-consumer platform. It bridges the critical divide between **Farmers**, **Agricultural Service Providers (Drone & Spray Operators)**, and **Consumers / Wholesale B2B Buyers**.

### The 2-Minute Pitch (Use this for presentations, demos, and reviews):
> *"Indian agriculture suffers from two massive disconnected worlds: on one side, smallholder farmers face heavy crop losses from delayed disease diagnosis, unscientific fertilizer costs, unpredictable weather, and exploitation by middlemen who take up to 70% of their earnings. On the other side, consumers and institutional buyers face sky-high prices, lack of trust in organic claims, and zero traceability.*
>
> *AgriAssist solves both sides in one single platform. For the **Farmer**, it provides high-speed Groq AI vision for instant leaf disease diagnosis, machine learning models for crop recommendation and soil nutrient balancing, automated weather spray alerts, a regional yield benchmark, and an Uber-like booking system for agricultural drone spraying. For the **Consumer and Buyer**, it eliminates middlemen through a direct Farm-to-Fork marketplace, B2B bulk procurement contracts, and batch QR traceability.*
>
> *To ensure true rural adoption, the platform includes a floating multilingual Voice Assistant in both English and Telugu for farmers who cannot read or write easily. The system is built with FastAPI, React, TypeScript, and a resilient dual-engine database architecture that never goes down."*

---

## 2. 🚀 Project Origin: How We Started

### The Initial Spark
Agriculture employs more than 50% of the Indian workforce, yet average farmer households struggle with razor-thin margins or crippling debt. When we investigated the ground reality of rural agriculture, we found that farmers are not suffering from lack of hard work — they are suffering from **information asymmetry, lack of technological access, and market disconnection**.

### What Sparked the Project:
1. **Field Observation:** Farmers in rural mandals were spraying expensive pesticides randomly without knowing the exact disease affecting their crops. This poisoned the soil and wasted hard-earned money.
2. **The Mechanization Paradox:** Modern farming technologies like agricultural spraying drones exist, but smallholder farmers had no way to hire them reliably. Drone service providers had no centralized booking system.
3. **The Middleman Trap:** A farmer sells tomatoes at ₹5/kg at the farm gate, while an urban consumer in Hyderabad or Bangalore buys those same tomatoes at ₹40/kg. Middlemen pocketed the margin while taking zero production risk.
4. **The Usability Gap:** Most existing agritech apps were written in heavy English, filled with cluttered menus, and completely unusable for a rural farmer standing in a sunny field with muddy hands.

We started this project with a singular mission: **Build an integrated, voice-accessible, end-to-end ecosystem where modern AI, precision mechanization, and direct trade empower farmers and consumers equally.**

---

## 3. 🔍 The Core Problems Identified (The 7 Critical Gaps in Agriculture)

During our research and requirement gathering, we identified 7 fundamental bottlenecks:

| # | Identified Problem | Ground Reality & Impact |
|---|-------------------|-------------------------|
| **1** | **Middlemen Exploitation** | Farmers receive only 20% to 30% of what consumers pay. Intermediaries control market access and force distress selling during peak harvests. |
| **2** | **Delayed Crop Pathology (Diseases)** | Fungal, bacterial, and viral leaf diseases cause 30% to 40% crop losses annually. Extension officers cannot visit every village in time. |
| **3** | **Unscientific Fertilizer Over-Application** | Farmers over-apply subsidized chemical fertilizers (especially Urea), burning their soil fertility and unbalancing Nitrogen, Phosphorus, and Potassium (NPK). |
| **4** | **Inaccessible Drone Mechanization** | Drones save 90% water and 30% chemical costs compared to manual pumps, but farmers have no trusted, transparently priced way to book them. |
| **5** | **Agro-Weather Vulnerability** | Sudden unseasonal rains or strong winds wash away sprayed chemicals or spoil harvested crops without hyper-local, proactive early warning. |
| **6** | **Consumer Trust Deficit** | Urban consumers want chemical-safe, authentic produce, but traditional supply chains offer zero proof of farm origin, harvest time, or soil safety. |
| **7** | **Digital Literacy & Language Barriers** | Complex web portals fail in rural areas because farmers prefer spoken regional languages (like Telugu) over typing in English. |

---

## 4. 💡 How We Overcame Those Problems (Our Solution Strategy)

We systematically engineered direct technical and functional solutions for every identified problem:

### 1. Overcoming Middlemen: Direct Marketplace & B2B Contracts
* **Solution:** Built a direct Farm-to-Fork e-commerce marketplace and B2B bulk bidding portal.
* **Result:** Consumers buy fresh produce at fair rates, and farmers keep 100% of their selling price without paying middleman cuts.

### 2. Overcoming Disease Delays: Sub-Second AI Pathology Scanner
* **Solution:** Integrated high-speed Groq LPU inference (`qwen/qwen3.8-27b`) with visual leaf diagnostics.
* **Result:** Farmers take a photo with their phone camera. Within 600 milliseconds, the system returns the disease name, infection severity, symptoms, and exact chemical/organic remedies with dosage instructions.

### 3. Overcoming Fertilizer Mismanagement: Conversational AI & ML Crop Guidance
* **Solution:** Deployed trained Scikit-Learn models (`crop_model.pkl`, `soil_npk_model.pkl`, `ph_model.pkl`) coupled with a dedicated conversational AI Fertilizer Agronomist bot.
* **Result:** Recommends optimal crops based on N, P, K, pH, rainfall, and temperature, and calculates exact split Urea and organic manure dosages.

### 4. Overcoming Inaccessible Drones: Uber-Style Drone Booking Lifecycle
* **Solution:** Created an end-to-end booking and dispatch system with strict role separation and real-time WebSocket state management.
* **Result:** Farmers select their crop, acreage, date, and preferred slot. The platform automatically calculates pricing based on verified per-acre rates. Drone operators receive live alerts, accept jobs, dispatch pilots, and complete missions with live progress updates.

### 5. Overcoming Weather Disasters: Hyper-Local Forecast & Automated Email Alerts
* **Solution:** Combined OpenWeather and OpenStreetMap reverse geocoding to detect village/mandal coordinates, calculate a "Spray Suitability Index," and dispatch automated warning emails during sudden storm/rain events.
* **Result:** Farmers never waste expensive sprays right before a rainstorm.

### 6. Overcoming Trust Deficit: Farm-to-Fork Batch QR Traceability
* **Solution:** Generated verifiable digital batch passports for all farm produce showing soil test data, harvest date, and chemical safety certifications.
* **Result:** Consumers can scan a QR code on produce packaging to inspect the farm and farmer profile directly.

### 7. Overcoming Literacy Barriers: Bilingual Voice Assistant
* **Solution:** Implemented an omnipresent floating Voice Assistant supporting both English and Telugu (`te`) with Web Speech recognition and synthesis.
* **Result:** Farmers can simply speak into their microphone to book a drone, ask fertilizer questions, or check weather forecasts hands-free.

---

## 5. 🏗️ System Architecture & Technology Stack

Our architecture is split into three clean tiers:

```text
[ Frontend: React + TypeScript + Vite + Tailwind CSS ]
                         │
                         │ HTTP REST + Full-Duplex WebSockets
                         ▼
[ Backend: Python FastAPI + Groq AI LPUs + ML Models ]
                         │
                         │ Dual-Engine Data Layer
                         ▼
[ Database: MongoDB Atlas / Supabase Cloud + Local SQLite / In-Memory Fallback ]
```

### 1. Frontend Web Portal
* **Framework:** React 18 with TypeScript for type-safe, bug-free components.
* **Build Tool:** Vite 5 for instant Hot Module Replacement (HMR) and optimized production bundles.
* **Styling & UI:** Tailwind CSS with Shadcn UI and Radix UI accessible primitives.
* **State & Query:** TanStack Query (React Query) for server-state caching and synchronization.
* **Internationalization:** Custom English / Telugu language context provider.
* **Voice AI:** Web Speech API integration for hands-free rural voice interaction.

### 2. Python FastAPI Backend Engine (`crop_guidance_ai`)
* **Framework:** FastAPI with Uvicorn ASGI server for asynchronous, high-concurrency request handling.
* **AI Acceleration:** Groq LPU (Language Processing Unit) running `qwen/qwen3.8-27b` and `gpt-oss` fallback models for sub-second natural language and vision processing.
* **Machine Learning Models:**
  * `crop_model.pkl`: Predicts best crop for given soil nutrients and climatic conditions.
  * `soil_npk_model.pkl`: Analyzes soil NPK health and identifies deficiencies.
  * `ph_model.pkl`: Evaluates soil acidity/alkalinity for crop suitability.
  * `profit_model.pkl`: Estimates expected financial profit and return per acre.
  * `price_model.pkl` & `future_price_model.pkl`: Mandi price regression and forecasting.
* **Real-time WebSockets:** `/ws/db-events` pushes live database updates (booking updates, order changes) to connected browsers without page refreshes.

### 3. Dual-Engine Resilient Data Layer
* **Primary:** MongoDB Atlas & Supabase Cloud for persistent document storage and authentication.
* **Self-Healing Fallback:** If cloud internet or MongoDB Atlas drops, the backend automatically falls back to local high-speed SQLite (`market_intel.db`) and in-memory caches. The platform never shows a blank crash screen.

---

## 6. 🚜 Farmer-Side Modules: What They Do & How They Work

The Farmer Portal is protected by a Role Guard (`allowedRole="farmer"`) and features 13 dedicated modules:

### 1. Farmer Analytics Hub (`/farmer/dashboard`)
* **What it does:** Serves as the central mission control for the farmer. Displays farm acreage, active crops, incoming produce orders, pending drone bookings, and emergency alerts.
* **How it works:** Aggregates real-time data from orders, drone bookings, and local weather into visual metric cards. Provides one-click quick actions to scan crops, check rain, or request a drone.

### 2. AI Plant Disease Scanner (`/farmer/crop-scanner`)
* **What it does:** Diagnoses leaf diseases from plant photographs and provides instant treatment recommendations.
* **How it works:** 
  1. The farmer uploads a leaf image or snaps a photo with their mobile/web camera.
  2. The image is converted to Base64 and sent to `POST /api/crop-disease-scan`.
  3. Groq's high-speed vision model inspects leaf discoloration, lesions, and necrosis patterns.
  4. Returns structured JSON: Disease name (with Latin botanical name), confidence score (e.g., 94%), severity level (Low/Medium/High), symptoms list, chemical fungicide treatment with dosage, and agronomic prevention advice.

### 3. Multi-Model Crop Guidance & Profit Engine (`/farmer/crop-guidance`)
* **What it does:** Recommends the most suitable and profitable crop for the farmer's specific land.
* **How it works:** 
  1. Farmer inputs Nitrogen (N), Phosphorus (P), Potassium (K), Soil pH, Temperature, Humidity, and Rainfall.
  2. The backend runs the inputs through `crop_model.pkl` and `profit_model.pkl`.
  3. Returns a suitability score (%), predicted yield per acre, estimated production cost, expected market revenue, and a net profit projection.

### 4. Conversational AI Fertilizer & Soil Bot (`/farmer/fertilizer`)
* **What it does:** Acts as a 24/7 agricultural advisor specializing in soil nutrition, fertilizer schedules, and organic compost.
* **How it works:** 
  1. Farmer asks questions via text or voice (e.g., *"What fertilizer should I apply for wheat during tillering?"*).
  2. Sent to `POST /api/fertilizer-chat` powered by Groq LPU models.
  3. Returns practical, farmer-friendly advice on basal dosages, split Urea timing to prevent leaching, micronutrient sprays (Zinc/Boron), and bio-fertilizers.

### 5. Agro-Meteorological Weather & Spray Advisory (`/farmer/weather`)
* **What it does:** Delivers hyper-local 5-day forecasts and calculates whether current conditions are safe for chemical spraying.
* **How it works:**
  1. Uses GPS coordinates with OpenStreetMap reverse geocoding to identify village, mandal, and district.
  2. Calls OpenWeather API to fetch temperature, humidity, wind velocity, and precipitation probability.
  3. Computes the **Spray Suitability Index**: If wind speed > 15 km/h or rain is forecasted within 24 hours, it flags **"UNSAFE TO SPRAY"** to prevent pesticide drift and chemical runoff.
  4. Features an **Alert Email trigger** that sends automated severe-weather warnings directly to the farmer's inbox.

### 6. Drone & Heavy Pump Spray Booking (`/farmer/spray-booking`)
* **What it does:** Enables farmers to book verified agricultural spraying drones or motorized tractor pumps.
* **How it works:**
  1. Farmer chooses service type (*Drone Spray* or *Pump Spray*), enters crop type, field area (in acres), preferred date, and time slot.
  2. The system automatically calculates total cost (e.g., 10 acres × ₹550/acre = ₹5,500).
  3. Farmer submits the booking (`POST /api/drone-bookings`).
  4. The booking starts in `PENDING` state. Farmers **cannot** approve their own booking; they track live status transitions (`ACCEPTED` ➔ `SCHEDULED` ➔ `IN_PROGRESS` ➔ `COMPLETED`) updated in real time via WebSockets.

### 7. Smart Irrigation & Water Management (`/farmer/irrigation`)
* **What it does:** Formulates water-saving irrigation schedules based on soil texture, crop growth stage, and rainfall.
* **How it works:** Calculates crop evapotranspiration (ET) and compares it with forecasted rainfall. Advises the farmer whether to run drip irrigation today or skip watering to conserve groundwater and electricity.

### 8. Demand & Supply Intelligence & Price Forecaster (`/farmer/demand-supply`)
* **What it does:** Helps farmers decide whether to sell their harvest immediately at current mandi prices or hold produce in cold storage.
* **How it works:** Uses `future_price_model.pkl` trained on historical agricultural market data to forecast mandi prices 1 to 3 months into the future. Compares cold storage rental costs against projected price increases to give a clear **"SELL NOW"** or **"HOLD IN STORAGE"** recommendation.

### 9. Regional Insights & District Yield Benchmarking (`/farmer/regional-insights`)
* **What it does:** Allows farmers to compare their crop yield and input costs against peer averages across districts and states.
* **How it works:** Queries aggregated district farm statistics, displaying interactive charts comparing average quintals produced per acre, helping farmers identify underperforming crops.

### 10. Government Schemes & Subsidies Directory (`/farmer/govt-schemes`)
* **What it does:** A comprehensive, searchable catalog of Central and State agricultural welfare initiatives.
* **How it works:** Lists schemes such as PM-KISAN (₹6,000 income support), PM Fasal Bima Yojana (crop insurance), Soil Health Card Scheme, and Rythu Bharosa with eligibility criteria, required documents, subsidy percentages, and official application links.

### 11. Farmer Orders Management (`/farmer/orders`)
* **What it does:** Enables farmers to view, confirm, and manage produce purchase orders placed by consumers.
* **How it works:** Displays incoming consumer orders with item name, quantity, total price, buyer address, and fulfillment status (`Pending`, `Confirmed`, `Dispatched`, `Delivered`).

### 12. AgriChrono™ Crop Timeline & Agronomic Calendar (`/agri-chrono`)
* **What it does:** Generates an end-to-end chronological timeline for the entire crop season from seed sowing to harvesting.
* **How it works:** Based on the crop variety and sowing date, it generates milestones for:
  - Day 0: Sowing & Basal fertilizer application
  - Day 21: First weeding & Top dressing Urea
  - Day 45: Flowering stage & Pest inspection
  - Day 75: Grain filling & Irrigation tapering
  - Day 110: Harvest readiness index

### 13. Farmer Profile (`/farmer/profile`)
* **What it does:** Manages farm landholding size, primary crops, contact details, village location, and language preference.

---

## 7. 🛡️ Consumer & Operator-Side Modules: What They Do & How They Work

The Consumer / Operator Portal (`allowedRole="consumer"`) manages trade, procurement, service fulfillment, and supply chain transparency:

### 1. Consumer Market Overview Dashboard (`/consumer/dashboard`)
* **What it does:** The main homepage for consumers and procurement managers. Highlights fresh seasonal arrivals, trending produce, active orders, and farm traceability links.
* **How it works:** Pulls live listings from verified local farmers and displays dynamic market price trends.

### 2. Direct-to-Consumer Marketplace (`/consumer/marketplace` & `/consumer/market`)
* **What it does:** An e-commerce store where consumers buy farm-fresh vegetables, grains, and fruits directly from farmers.
* **How it works:** 
  1. Consumers browse produce filtered by category (Vegetables, Fruits, Grains), price range, or organic certification.
  2. Produce cards display the harvesting farmer’s name, farm location, stock availability, and unit price per kg/quintal.
  3. Consumers add items to their cart and checkout (`POST /api/orders`).
  4. Middleman commission is eliminated, delivering fresher food at lower retail prices.

### 3. Verified Farmers Directory (`/consumer/farmers`)
* **What it does:** A public registry of certified farmers enrolled on the platform.
* **How it works:** Displays farmer profiles, farm photos, acreage, primary crops, organic farming practices, and community trust ratings (e.g., 4.9/5 stars). Consumers can click on any farmer to view their available harvest inventory.

### 4. Bulk Procurement & B2B Contracts (`/consumer/bulk`)
* **What it does:** Facilitates large-scale produce contracts for institutional buyers (restaurants, supermarkets, hostels, food processors).
* **How it works:** 
  1. Commercial buyers post bulk procurement tenders specifying required commodity, tonnage (e.g., 50 Quintals of Sona Masoori Rice), target price, and delivery deadline.
  2. Farmers and Farmer Producer Organizations (FPOs) review tenders and submit bids or fulfill contracts directly.

### 5. Market Demand & Commodity Price Trends (`/consumer/demand`)
* **What it does:** Visualizes real-time commodity demand curves and supply-demand imbalances.
* **How it works:** Shows consumers and wholesale traders whether specific crops are experiencing supply shortages or surplus, helping buyers plan purchases before prices spike.

### 6. Spray Operator & Drone Dispatch Console (`/consumer/spray-bookings` / `/provider/spray-bookings`)
* **What it does:** A specialized console for drone pilots, tractor operators, and spraying service providers.
* **How it works:**
  1. The operator views incoming farmer spray requests in real time via WebSocket live feeds.
  2. The operator reviews crop type, acreage, field location, and target pest.
  3. The operator advances the mission through a strict, irreversible state machine:
     - **Accept:** Provider confirms availability and locks in booking.
     - **Schedule:** Assigns specific drone pilot, battery sets, and chemical mix.
     - **Start Spraying:** Flags mission as active (`IN_PROGRESS`).
     - **Mark Completed:** Finalizes the service, logs completed acreage, and triggers completion notifications.

### 7. Supply Chain & Farm-to-Fork Traceability (`/consumer/traceability`)
* **What it does:** Provides 100% transparency into food origin and agricultural practices.
* **How it works:**
  1. Each harvest batch receives a unique tracking ID and QR code.
  2. When scanned, it displays:
     - Exact farm location and farmer identity.
     - Sowing date and harvest timestamp.
     - Soil health test results and NPK balance.
     - Water source (borewell, canal, rainwater).
     - Pesticide safety status (organic certified or compliant with safe waiting periods).

### 8. Order Tracking & History (`/consumer/orders` & `/consumer/orders/:orderId`)
* **What it does:** Tracks produce orders from farm harvesting to door-step delivery.
* **How it works:** Shows real-time progress steps: *Order Placed* ➔ *Harvesting & Packing* ➔ *In Transit* ➔ *Delivered*. Includes seller contact details and invoice generation.

### 9. Consumer Profile (`/consumer/profile`)
* **What it does:** Manages delivery addresses, payment methods, transaction receipts, and favorite farmers.

---

## 8. ⚡ Cross-Cutting Innovations

### 1. 🎙️ Floating Multilingual Voice Assistant
* **The Need:** Rural farmers frequently have literacy barriers or cannot type on mobile touchscreens while working on fields.
* **How It Works:**
  - An omnipresent circular microphone widget floats on every screen.
  - When pressed, it captures voice input using the browser's SpeechRecognition engine.
  - Understands voice commands for navigation, weather lookups, disease queries, and drone bookings.
  - Speaks responses aloud using SpeechSynthesis in both **English** and **Telugu**.

### 2. 🌐 Built-in Telugu Vernacular Support (`useLanguage`)
* Features a built-in English ⟷ Telugu dictionary (`DICTIONARY`) covering all navigation terms, form labels, alerts, and table headers.
* Switching languages takes one click and transforms the entire interface without reloading the page.

### 3. 🔄 Real-Time WebSocket Synchronization (`/ws/db-events`)
* Uses a persistent full-duplex WebSocket connection between the browser and FastAPI.
* When a farmer creates a drone booking or a consumer places an order, the server broadcasts an event (`INSERT` or `UPDATE`).
* The operator's or farmer's screen updates instantly without requiring a manual browser refresh.

### 4. 🛡️ Resilient Dual-Engine Fallback Architecture
* If cloud services (MongoDB Atlas / Supabase) experience internet disruptions or rate limits:
  1. The FastAPI backend automatically routes read/write operations to local SQLite (`market_intel.db`) and in-memory caches.
  2. If Groq Vision encounters network timeouts, the plant pathology engine activates an intelligent botanical fallback rule-base.
  3. The user never encounters an application crash or broken white screen.

---

## 9. 🚀 Local Setup & Getting Started

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **Python**: `v3.9` or higher
* **PowerShell** (Windows) or **Bash** (macOS/Linux)

---

### Step 1: Backend Setup (FastAPI Server)

```powershell
# 1. Navigate to the backend directory
cd crop_guidance_ai

# 2. Activate Python virtual environment (if created)
.\venv\Scripts\activate

# 3. Install required Python packages
pip install -r requirements.txt

# 4. Start the FastAPI server on port 8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

* **Backend URL:** `http://127.0.0.1:8000`
* **Interactive API Documentation:** `http://127.0.0.1:8000/docs`
* **Realtime WebSocket Endpoint:** `ws://127.0.0.1:8000/ws/db-events`

---

### Step 2: Frontend Setup (React + Vite)

Open a **second terminal window** and run:

```powershell
# 1. Ensure you are at the project root directory
cd d:\smart-farming-rgm-main

# 2. Install dependencies (first time only)
npm install

# 3. Start Vite development server
npm run dev
```

* **Frontend Web Portal:** `http://localhost:8080` (or `http://localhost:5173`)

---

## 10. 📡 API Reference Summary

### 🤖 AI Endpoints
* `POST /api/crop-disease-scan`: Plant disease image diagnostic analysis.
  * *Request Body*: `{"imageBase64": "<base64_string>", "cropType": "Tomato"}`
* `POST /api/fertilizer-chat`: Conversational fertilizer advice.
  * *Request Body*: `{"message": "What is the best fertilizer for wheat during tillering?"}`
* `POST /api/crop-guidance/chat`: Agronomy and irrigation intelligence.
  * *Request Body*: `{"message": "Explain drip irrigation for tomato fields"}`

### 🛸 Drone & Spray Management
* `GET /api/spray-providers?service_type=Drone`: List verified spraying operators.
* `POST /api/drone-bookings`: Farmer creates a spraying appointment.
* `GET /api/drone-bookings`: Operator views all active bookings.
* `PUT /api/drone-bookings/{id}/status`: Operator updates status (`ACCEPTED`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`).

### 🌦️ Weather & Geocoding
* `POST /api/weather`: Fetches live weather, 5-day forecast, and spray suitability index.
* `POST /api/weather/alert-email`: Dispatches severe weather warning email to the farmer.

### 📈 Market & Trade Intelligence
* `GET /api/market/live-prices`: Real-time mandi commodity price feeds.
* `POST /api/market/predict-price`: Algorithmic price forecast for upcoming months.
* `POST /api/market/strategy`: Crop holding vs. immediate selling optimization.
* `GET /api/orders`: List all marketplace produce orders.
* `POST /api/orders`: Consumer places a produce order.

---

## 11. 🎯 Viva & Presentation Q&A Cheatsheet

#### Q1: "What is unique about your project compared to existing apps like Kisan Suvidha or BigBasket?"
> **Answer:** *"Existing apps are completely fragmented. Kisan Suvidha provides government advisory without trade or mechanization. BigBasket sells vegetables but acts as a centralized reseller where farmers still have no pricing power.  
> AgriAssist is the first platform to unify three critical loops in one system:  
> 1. Scientific agronomy (AI leaf disease diagnosis and ML crop/fertilizer guidance).  
> 2. Precision mechanization (an Uber-like Drone/Pump booking and dispatch lifecycle).  
> 3. Direct trade and transparency (Farm-to-Fork marketplace, B2B procurement, and batch QR traceability).  
> Furthermore, it is fully accessible to illiterate farmers via our bilingual Telugu and English Voice Assistant."*

#### Q2: "How does your leaf disease diagnostic model work?"
> **Answer:** *"When a farmer captures an image of an infected leaf, the frontend converts it into a Base64 string and dispatches it to our FastAPI `/api/crop-disease-scan` endpoint. The image is analyzed by Groq LPU inference using open vision models (`qwen/qwen3.8-27b`). It extracts key pathology indicators — such as leaf chlorosis, concentric necrotic lesions, or fungal pustules — and returns structured JSON with the exact disease name, infection severity, chemical remedy with dilution rates, and organic bio-control practices within 600 milliseconds."*

#### Q3: "Explain the Drone Booking lifecycle. Can a farmer approve their own booking?"
> **Answer:** *"No. We implemented strict Role-Based Access Control (RBAC). The farmer creates a booking specifying acreage, crop, date, and preferred time slot, which enters the system as `PENDING`. The drone operator console receives this booking in real time via our `/ws/db-events` WebSocket connection. Only the operator can execute state transitions: moving the status from `PENDING` to `ACCEPTED`, then `SCHEDULED` (assigning pilot and drone gear), `IN_PROGRESS` (during spraying), and finally `COMPLETED`. The farmer's screen updates automatically at every stage."*

#### Q4: "What happens if MongoDB Atlas or the internet connection goes down?"
> **Answer:** *"We engineered a self-healing fallback layer in our FastAPI backend. If the MongoDB client fails the connection handshake, the system logs the timeout, marks `is_mongo_online = False`, and immediately switches to local SQLite (`market_intel.db`) and in-memory tables. Critical operations like user login, drone booking, order placement, and weather lookups continue uninterrupted with zero downtime."*

#### Q5: "How does the platform help consumers trust the produce they buy?"
> **Answer:** *"Through our Farm-to-Fork Traceability module (`/consumer/traceability`). Every crop batch has a unique QR code tracking its origin. Consumers can scan the code to inspect the farmer's profile, exact village coordinates, harvest timestamp, soil test results (NPK and pH levels), and chemical safety verification, proving whether the produce was farmed organically or with safe waiting periods."*

---

## 12. 📋 All Application Routes Reference

### Farmer Routes
| Route | Page | Purpose |
|---|---|---|
| `/farmer/dashboard` | `Dashboard.tsx` | Main Analytics & Farm Overview Hub |
| `/farmer/crop-scanner` | `CropScanner.tsx` | AI Plant Leaf Disease Scanner |
| `/farmer/crop-guidance` | `CropGuidance.tsx` | Multi-Model ML Crop Suitability & Profit Engine |
| `/farmer/fertilizer` | `Fertilizer.tsx` | Conversational AI Soil & Fertilizer Bot |
| `/farmer/weather` | `Weather.tsx` | Weather Forecasts, Spray Suitability Index & Email Alerts |
| `/farmer/spray-booking` | `DroneBooking.tsx` | Uber-Style Drone & Heavy Pump Spray Booking |
| `/farmer/irrigation` | `Irrigation.tsx` | Smart Water Management & Irrigation Calculator |
| `/farmer/demand-supply` | `DemandSupply.tsx` | Mandi Prices, Price Forecasting & Hold-vs-Sell Strategy |
| `/farmer/regional-insights` | `RegionalInsights.tsx` | State & District Yield & Acreage Benchmarking |
| `/farmer/govt-schemes` | `GovtSchemes.tsx` | Indian Welfare Schemes & Direct Application Directory |
| `/farmer/orders` | `FarmerOrders.tsx` | Incoming Produce Order Management |
| `/agri-chrono` | `AgriChrono.tsx` | Crop Calendar & Agronomic Milestone Timeline |
| `/farmer/profile` | `Profile.tsx` | Farmer Landholding & Crop Profile |

### Consumer & Operator Routes
| Route | Page | Purpose |
|---|---|---|
| `/consumer/dashboard` | `ConsumerDashboard.tsx` | Consumer Market Overview & Fresh Produce Highlights |
| `/consumer/marketplace` | `Marketplace.tsx` | Direct Farm-to-Fork Produce Store |
| `/consumer/farmers` | `FarmersDirectory.tsx` | Verified Local Farmer Directory & Farm Profiles |
| `/consumer/bulk` | `BulkOrders.tsx` | B2B Wholesale Procurement Contracts & Bidding |
| `/consumer/demand` | `DemandTrends.tsx` | Commodity Demand Trends & Availability Curves |
| `/consumer/spray-bookings` | `ProviderBookings.tsx` | Drone & Spray Operator Dispatch & Lifecycle Console |
| `/consumer/traceability` | `Traceability.tsx` | Batch QR Traceability & Soil/Chemical Safety Verification |
| `/consumer/orders` | `MyOrders.tsx` | Consumer Order History & Real-time Delivery Tracking |
| `/consumer/orders/:orderId` | `OrderTracking.tsx` | Step-by-Step Order Delivery Tracker |
| `/consumer/profile` | `Profile.tsx` | Buyer Profile & Shipping Preferences |

---

## 📜 License
Developed with 💚 for modern Indian agriculture. Built for the **Smart Farming & Rural Growth Hackathon**.
