# ARKA AI — AI-Powered Travel and Safety Planner

**ARKA AI** is a premium, AI-driven travel intelligence platform designed for seamless trip planning and safety management for Odisha and beyond, powered by Google Gemini API.

---

## 🌟 Key Features

- **Personalized Itinerary Generator**: Create custom multi-day travel plans with morning, afternoon, and evening breakdowns using Google Gemini.
- **AI Assistant Chat**: Real-time conversational companion with conversation history for destinations, food, and culture.
- **AI Vision Scanner**: Analyze landmarks, architecture, and historical sites from photos using multimodal Gemini vision.
- **VR Historical Explorer**: Interactive 3D spatial metrics and historical guidebooks for cultural monuments.
- **Odisha-Deep Cultural Insights**: Specialized information on festivals, traditions, and Odia-language translation.
- **Odia Text-to-Speech (TTS)**: Authentic Odia voice synthesis returning standard `audio/mpeg` MP3 audio.
- **Real-Time Safety & Risk Prediction**: Structured weather guidance, crime safety scores, health advisories, and fraud alerts.
- **Travel Logistics Tracker**: Route tracking, distance/time estimation, hotel suggestions, and interactive map framing.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Shadcn/UI, Lucide React, Framer Motion (Deployed on Vercel: `https://arka-ai-woad.vercel.app`).
- **Backend**: FastAPI (Python), Google Gen AI SDK (`google-genai`), Uvicorn, Pydantic, gTTS (Deployed on Render: `https://arka-ai-backend.onrender.com`).
- **AI Provider**: Google Gemini API (`gemini-2.5-flash` prioritized for free-tier eligibility).

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+)
- **Google Gemini API Key** (Free tier available at [Google AI Studio](https://aistudio.google.com/))

### 2. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
6. Run the automated test suite:
   ```bash
   pytest tests/test_migration.py -v
   ```

### 3. Frontend Setup
1. Navigate to the project root:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🌐 Production Deployment (Render)

When deploying on Render:
1. Set the **Build Command**:
   ```bash
   pip install -r requirements.txt
   ```
2. Set the **Start Command**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
3. Configure Environment Variables in Render Dashboard:
   - `GEMINI_API_KEY`: Your Google AI Studio API key (Required)
   - `GEMINI_MODEL`: `gemini-2.5-flash` (Optional, defaults to `gemini-2.5-flash`)
   - `CORS_ORIGINS`: `https://arka-ai-woad.vercel.app,http://localhost:5173,http://localhost:3000` (Optional)

---

## 🛡️ License

This project is for demonstration and research purposes.
