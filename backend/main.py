from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://arka-ai-woad.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TripData(BaseModel):
    destination: str
    days: int
    budget: int
    style: str
    interests: list

class ChatRequest(BaseModel):
    message: str
    history: list = []

class ARScannerRequest(BaseModel):
    image: str

class FestivalRequest(BaseModel):
    location: str

class RiskRequest(BaseModel):
    location: str

class TrackingRequest(BaseModel):
    origin: str
    destination: str

class VRScanRequest(BaseModel):
    location: str

class TranslateRequest(BaseModel):
    text: str
    target_language: str

@app.post("/generate-itinerary")
async def generate_itinerary(data: TripData):
    try:
        interests_str = ", ".join(data.interests)
        prompt = f"Plan a {data.days}-day {data.style} trip to {data.destination} with a budget of ${data.budget}. Interests include: {interests_str}."
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional travel planner. Provide a JSON response containing an array 'itinerary' with 'day', 'title', 'morning', 'afternoon', and 'evening'."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        messages = [{"role": "system", "content": "You are a helpful travel assistant."}]
        for msg in request.history: messages.append(msg)
        messages.append({"role": "user", "content": request.message})
        response = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ar-scanner")
async def ar_scanner(request: ARScannerRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "system",
                "content": "You are the ultimate AI Vision Scanner operating in a high-tech VR environment. Analyze the user's uploaded image with true perfection."
            }, {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Predict the exact subject of this image with 100% accuracy. Provide:\n# Identity & History\n[What it is, its exact location, and historical significance]\n\n# 3D Geometrical & Spatial Features\n[Describe its architecture, dimensions, texture, and visual depth as if mapping it for a VR 3D model]\n\n# Interesting Facts & Predictions\n[Unique properties, hidden details, or perfect predictions about its origin]\n\nFormat the response perfectly with clear headings using '#' for markdown."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{request.image}"}}
                ]
            }],
            max_tokens=800,
            temperature=0.2
        )
        return {"description": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/festivals")
async def festivals(request: FestivalRequest):
    try:
        prompt = f"Identify 3-5 festivals in {request.location}. Provide: name, date, description, history, image_keyword."
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "You are a Cultural expert. Provide a JSON response containing an array 'festivals' with objects having 'name', 'date', 'description', 'history', and 'image_keyword' as keys."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/risk-prediction")
async def risk_prediction(request: RiskRequest):
    try:
        prompt = f"""
        Provide a detailed risk assessment for a traveler in {request.location}.
        Format as JSON perfectly matching this schema:
        {{
            "weather_risk": {{"hazard": "description", "level": "Low" | "Medium" | "High", "advice": "string"}},
            "crime_data": [ {{"area": "string", "risk_type": "string", "safety_score": 85}} ],
            "health_alerts": [ {{"infection": "string", "precaution": "string"}} ],
            "fraud_alerts": [ {{"scam": "string", "how_it_works": "string", "prevention": "string"}} ]
        }}
        Provide 2-3 items for each list. Make sure the safety score is an integer between 0 and 100.
        """
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "You are a Global Security & Risk Intelligence expert."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/vr-scan-location")
async def vr_scan_location(request: VRScanRequest):
    try:
        prompt = f"""
        Identify the 3-5 most famous historical monuments in {request.location}.
        For each, provide a detailed VR-ready profile:
        - "name": The exact name.
        - "description": A thorough, engaging description for a text-to-speech audio guide (2-3 paragraphs).
        - "history": Deep historical background.
        - "architecture": Detailed architectural design notes.
        - "coordinates": {{"lat", "lng"}}.
        - "vr_metrics": {{
            "height": "estimated height in meters",
            "material": "primary building material",
            "style": "architectural style",
            "complexity": 1-100
        }}
        
        Format as JSON with a list of "monuments".
        """
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "You are an expert VR Spatial Architect and Historian. Provide deep, accurate JSON data for 3D modeling and audio guides."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/route-tracking")
async def route_tracking(request: TrackingRequest):
    try:
        prompt = f"""
        Provide travel logistics from {request.origin} to {request.destination}.
        Include:
        1. Distance in km.
        2. Estimated duration in minutes.
        3. Real-time traffic status (Clear/Moderate/Heavy).
        4. 3-5 hotels at or near the destination.
        5. Coordinates (lat/lng) for origin, destination, and hotels.
        6. A center coordinate for the map view.
        
        Format as JSON with:
        - origin: {{"name", "lat", "lng"}}
        - destination: {{"name", "lat", "lng"}}
        - distance: string
        - duration: string
        - traffic: string
        - hotels: list of {{"name", "lat", "lng", "price", "rating"}}
        - center: {{"lat", "lng", "zoom"}}
        """
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "Travel Logistics Expert."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class LocationRequest(BaseModel):
    lat: float
    lng: float

@app.post("/suggest-destination")
async def suggest_destination(request: LocationRequest):
    try:
        prompt = f"""
        Given the precise coordinates {request.lat}, {request.lng}, identify the user's current city or area.
        Then, suggest 3 highly popular, must-visit local tourist attractions or nearby landmarks directly within or very close to that immediate area.
        Return strictly perfect JSON with exactly two keys:
        - "origin_city": (string representing the current city)
        - "destinations": (a list of objects, each with a "name", "reason", "lat" (float), and "lng" (float) representing the exact location of the attraction)
        """
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": "You are a local tour guide AI expert. You provide strict JSON with coordinates."}, {"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate")
async def translate_text(request: TranslateRequest):
    try:
        prompt = f"Translate the following English text to {request.target_language}. Return ONLY the translated text, nothing else. Make sure the translation is natural and culturally appropriate.\n\nText: {request.text}"
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": f"You are an expert translator. Translate accurately and naturally to {request.target_language}."},
                {"role": "user", "content": prompt}
            ]
        )
        return {"translated": response.choices[0].message.content.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts-odia")
async def tts_odia(request: TranslateRequest):
    try:
        # First translate to Odia
        prompt = f"Translate the following English text to Odia (ଓଡ଼ିଆ). Return ONLY the translated text, nothing else.\n\nText: {request.text}"
        trans_res = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        odia_text = trans_res.choices[0].message.content.strip()

        # Now generate high-quality speech
        audio_res = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=odia_text,
        )
        
        return Response(content=audio_res.content, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
