import os
import json
import logging

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from openai import (
    OpenAI,
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    RateLimitError,
    APIError,
)

# =========================================================
# CONFIGURATION
# =========================================================

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

app = FastAPI(
    title="ARKA AI Backend",
    description="AI-powered travel assistant API",
    version="1.0.0",
)


# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://arka-ai-woad.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REQUEST MODELS
# =========================================================

class TripData(BaseModel):
    destination: str
    days: int
    budget: int
    style: str
    interests: list[str]


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = Field(default_factory=list)


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


class LocationRequest(BaseModel):
    lat: float
    lng: float


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def get_openai_client():
    """
    Return the OpenAI client or raise a clear configuration error.
    """
    if client is None:
        logger.error("OPENAI_API_KEY is missing.")
        raise HTTPException(
            status_code=503,
            detail="AI service is not configured. Please check the server environment."
        )

    return client


def handle_openai_error(exc: Exception):
    """
    Convert OpenAI API exceptions into appropriate HTTP responses.
    Detailed diagnostics remain in server logs.
    """

    if isinstance(exc, AuthenticationError):
        logger.exception("OpenAI authentication failed.")
        raise HTTPException(
            status_code=502,
            detail="AI service authentication failed. Check the server API configuration."
        )

    if isinstance(exc, RateLimitError):
        logger.exception("OpenAI rate limit or quota error.")
        raise HTTPException(
            status_code=429,
            detail="AI service rate limit or quota reached. Please try again later."
        )

    if isinstance(exc, APIConnectionError):
        logger.exception("Could not connect to OpenAI.")
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the AI service. Please try again."
        )

    if isinstance(exc, APIStatusError):
        logger.exception("OpenAI API returned an HTTP error.")
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an error. Please try again."
        )

    if isinstance(exc, APIError):
        logger.exception("OpenAI API error.")
        raise HTTPException(
            status_code=502,
            detail="An AI service error occurred. Please try again."
        )

    logger.exception("Unexpected backend error.")
    raise HTTPException(
        status_code=500,
        detail="An unexpected server error occurred."
    )


def call_openai(**kwargs):
    """
    Execute a Chat Completions request with centralized error handling.
    """
    try:
        api_client = get_openai_client()
        return api_client.chat.completions.create(**kwargs)

    except HTTPException:
        raise

    except Exception as exc:
        handle_openai_error(exc)


def parse_json_response(response):
    """
    Parse a JSON response returned by the model.
    """
    content = response.choices[0].message.content

    if not content:
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an empty response."
        )

    try:
        return json.loads(content)

    except json.JSONDecodeError:
        logger.error("The AI service returned invalid JSON.")
        raise HTTPException(
            status_code=502,
            detail="The AI service returned an invalid JSON response. Please try again."
        )


# =========================================================
# 1. GENERATE TRAVEL ITINERARY
# =========================================================

@app.post("/generate-itinerary")
async def generate_itinerary(data: TripData):
    try:
        interests_str = ", ".join(data.interests)

        prompt = (
            f"Plan a {data.days}-day {data.style} trip to "
            f"{data.destination} with a budget of ${data.budget}. "
            f"Interests include: {interests_str}."
        )

        response = call_openai(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional travel planner. "
                        "Return a JSON object containing an array named "
                        "'itinerary'. Each item should contain "
                        "'day', 'title', 'morning', 'afternoon', and 'evening'."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            response_format={"type": "json_object"},
        )

        return parse_json_response(response)

    except HTTPException:
        raise

    except Exception:
        logger.exception("Error generating itinerary.")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate itinerary."
        )


# =========================================================
# 2. ARKA AI CHAT
# =========================================================

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        user_message = request.message.strip()

        if not user_message:
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty."
            )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are ARKA AI, a helpful and knowledgeable "
                    "travel assistant. Help users plan trips, discover "
                    "destinations, understand cultures, and explore "
                    "travel options. Be friendly, concise, and accurate. "
                    "Never claim to have verified live information "
                    "unless a reliable live data source is available."
                ),
            }
        ]

        # Validate conversation history.
        for index, msg in enumerate(request.history):

            if not isinstance(msg, dict):
                raise HTTPException(
                    status_code=400,
                    detail=f"History item {index} must be an object."
                )

            role = msg.get("role")
            content = msg.get("content")

            if role not in ("user", "assistant"):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"History item {index} has an invalid role. "
                        "Allowed roles are user and assistant."
                    ),
                )

            if not isinstance(content, str):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"History item {index} must contain "
                        "string content."
                    ),
                )

            if content.strip():
                messages.append(
                    {
                        "role": role,
                        "content": content,
                    }
                )

        messages.append(
            {
                "role": "user",
                "content": user_message,
            }
        )

        logger.info(
            "Processing ARKA AI chat request. History messages: %d",
            len(request.history),
        )

        response = call_openai(
            model="gpt-4o-mini",
            messages=messages,
        )

        answer = response.choices[0].message.content

        if answer is None:
            raise HTTPException(
                status_code=502,
                detail="The AI service returned an empty response."
            )

        return {
            "response": answer,
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("CHAT ENDPOINT FAILED")

        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing your message."
        )


# =========================================================
# 3. AR IMAGE SCANNER
# =========================================================

@app.post("/ar-scanner")
async def ar_scanner(request: ARScannerRequest):
    try:
        if not request.image.strip():
            raise HTTPException(
                status_code=400,
                detail="Image data cannot be empty."
            )

        image_data = request.image.strip()

        # Support data URLs as well as raw base64 strings.
        if image_data.startswith("data:"):
            if "," not in image_data:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid image data URL."
                )

            image_data = image_data.split(",", 1)[1]

        response = call_openai(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI vision assistant. Analyze the "
                        "provided image carefully. Describe visible "
                        "objects, architecture, spatial features, and "
                        "historical context when reasonably identifiable. "
                        "Clearly distinguish observations from uncertain "
                        "inferences. Never claim 100% certainty."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Analyze this image and provide the "
                                "following sections:\n"
                                "# Identity & History\n"
                                "Identify the subject and discuss its "
                                "historical significance if known.\n\n"
                                "# 3D Geometrical & Spatial Features\n"
                                "Describe visible architecture, shape, "
                                "texture, and spatial arrangement.\n\n"
                                "# Interesting Facts & Observations\n"
                                "Provide relevant facts and clearly "
                                "identify uncertain details."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": (
                                    "data:image/jpeg;base64,"
                                    f"{image_data}"
                                )
                            },
                        },
                    ],
                },
            ],
            max_tokens=800,
            temperature=0.2,
        )

        return {
            "description": response.choices[0].message.content
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("AR scanner failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to analyze the image."
        )


# =========================================================
# 4. FESTIVAL DISCOVERY
# =========================================================

@app.post("/festivals")
async def festivals(request: FestivalRequest):
    try:
        prompt = (
            f"Identify 3-5 festivals associated with "
            f"{request.location}. Provide their name, date, "
            "description, history, and image_keyword. "
            "Return a JSON object containing a 'festivals' array. "
            "Do not invent current dates; indicate uncertainty when "
            "dates depend on an unverified calendar."
        )

        response = call_openai(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a cultural expert. Return valid JSON "
                        "with a 'festivals' array. Each festival must "
                        "contain name, date, description, history, "
                        "and image_keyword."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            response_format={"type": "json_object"},
        )

        return parse_json_response(response)

    except HTTPException:
        raise

    except Exception:
        logger.exception("Festival discovery failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve festival information."
        )


# =========================================================
# 5. TRAVEL RISK PREDICTION
# =========================================================

@app.post("/risk-prediction")
async def risk_prediction(request: RiskRequest):
    try:
        prompt = f"""
Provide a travel risk assessment for {request.location}.

Return a valid JSON object with the following structure:

{{
    "weather_risk": {{
        "hazard": "description",
        "level": "Low, Medium, or High",
        "advice": "string"
    }},
    "crime_data": [
        {{
            "area": "string",
            "risk_type": "string",
            "safety_score": 85
        }}
    ],
    "health_alerts": [
        {{
            "infection": "string",
            "precaution": "string"
        }}
    ],
    "fraud_alerts": [
        {{
            "scam": "string",
            "how_it_works": "string",
            "prevention": "string"
        }}
    ]
}}

Provide 2-3 items for each list.
Safety scores must be integers between 0 and 100.

Important:
Do not invent live weather conditions, verified crime statistics,
or current health alerts. Clearly indicate when information is
general guidance rather than verified current data.
"""

        response = call_openai(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a travel safety and risk assessment "
                        "assistant. Return valid JSON and distinguish "
                        "verified facts from general guidance."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            response_format={"type": "json_object"},
        )

        return parse_json_response(response)

    except HTTPException:
        raise

    except Exception:
        logger.exception("Risk prediction failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to generate the travel risk assessment."
        )


# =========================================================
# 6. VR MONUMENT SCANNER
# =========================================================

@app.post("/vr-scan-location")
async def vr_scan_location(request: VRScanRequest):
    try:
        prompt = f"""
Identify 3-5 famous historical monuments in {request.location}.

Return a JSON object containing a "monuments" array.

Each monument must contain:

- name: Exact monument name.
- description: Engaging description for an audio guide.
- history: Historical background.
- architecture: Architectural details.
- coordinates: An object containing lat and lng.
- vr_metrics:
    - height: Estimated height in meters.
    - material: Primary building material.
    - style: Architectural style.
    - complexity: Integer between 1 and 100.

Do not fabricate precise coordinates or measurements.
Use null when reliable values are unavailable.
Clearly distinguish estimates from verified measurements.
"""

        response = call_openai(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a VR spatial design and historical "
                        "information assistant. Return valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            response_format={"type": "json_object"},
        )

        return parse_json_response(response)

    except HTTPException:
        raise

    except Exception:
        logger.exception("VR location scan failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve monument information."
        )


# =========================================================
# 7. ROUTE TRACKING
# =========================================================

@app.post("/route-tracking")
async def route_tracking(request: TrackingRequest):
    try:
        prompt = f"""
Provide travel logistics from {request.origin}
to {request.destination}.

Return a valid JSON object containing:

- origin: object with name, lat, lng.
- destination: object with name, lat, lng.
- distance: string.
- duration: string.
- traffic: string.
- hotels: list of objects containing name, lat, lng, price, rating.
- center: object containing lat, lng, zoom.

Provide 3-5 hotel suggestions.

IMPORTANT:
You do not have a verified live traffic or routing feed in this
request. Do not present estimated traffic or travel times as
real-time verified information. Clearly mark estimates.
Do not invent exact hotel coordinates, prices, or ratings.
Use null where reliable information is unavailable.

Origin: {request.origin}
Destination: {request.destination}
"""

        response = call_openai(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a travel logistics assistant. "
                        "Return valid JSON and clearly identify estimates."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            response_format={"type": "json_object"},
        )

        return parse_json_response(response)

    except HTTPException:
        raise

    except Exception:
        logger.exception("Route tracking failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to generate route information."
        )


# =========================================================
# 8. SUGGEST NEARBY DESTINATIONS
# =========================================================

@app.post("/suggest-destination")
async def suggest_destination(request: LocationRequest):
    try:
        if not (-90 <= request.lat <= 90):
            raise HTTPException(
                status_code=400,
                detail="Latitude must be between -90 and 90."
            )

        if not (-180 <= request.lng <= 180):
            raise HTTPException(
                status_code=400,
                detail="Longitude must be between -180 and 180."
            )

        prompt = f"""
The coordinates are latitude {request.lat}, longitude {request.lng}.

Identify the likely city or area and suggest three nearby
tourist attractions or landmarks.

Return valid JSON with exactly two keys:

- origin_city: string
- destinations: list of objects containing:
    - name: string
    - reason: string
    - lat: float or null
    - lng: float or null

Do not invent exact coordinates. Clearly indicate uncertainty
if the location cannot be reliably identified.
"""

        response = call_openai(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a local travel guide assistant. "
                        "Return valid JSON and avoid fabricated coordinates."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            response_format={"type": "json_object"},
        )

        return parse_json_response(response)

    except HTTPException:
        raise

    except Exception:
        logger.exception("Destination suggestions failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to suggest nearby destinations."
        )


# =========================================================
# 9. TRANSLATION
# =========================================================

@app.post("/translate")
async def translate_text(request: TranslateRequest):
    try:
        if not request.text.strip():
            raise HTTPException(
                status_code=400,
                detail="Text cannot be empty."
            )

        if not request.target_language.strip():
            raise HTTPException(
                status_code=400,
                detail="Target language cannot be empty."
            )

        prompt = (
            f"Translate the following text into "
            f"{request.target_language}.\n"
            "Return only the translated text, without explanations. "
            "Preserve the original meaning and tone.\n\n"
            f"Text:\n{request.text}"
        )

        response = call_openai(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert multilingual translator. "
                        "Translate accurately and naturally."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )

        translated = response.choices[0].message.content

        if translated is None:
            raise HTTPException(
                status_code=502,
                detail="The translation service returned an empty response."
            )

        return {
            "translated": translated.strip()
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Translation failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to translate the text."
        )


# =========================================================
# 10. ODIA TEXT-TO-SPEECH
# =========================================================

@app.post("/tts-odia")
async def tts_odia(request: TranslateRequest):
    try:
        if not request.text.strip():
            raise HTTPException(
                status_code=400,
                detail="Text cannot be empty."
            )

        # Translate the text into Odia.
        translation_response = call_openai(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert Odia translator. "
                        "Translate the supplied text into natural "
                        "Odia (ଓଡ଼ିଆ). Return only the translation."
                    ),
                },
                {
                    "role": "user",
                    "content": request.text,
                },
            ],
        )

        odia_text = translation_response.choices[0].message.content

        if not odia_text:
            raise HTTPException(
                status_code=502,
                detail="Translation into Odia returned an empty response."
            )

        # Generate speech.
        api_client = get_openai_client()

        try:
            audio_response = api_client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=odia_text.strip(),
            )

        except Exception as exc:
            logger.exception("Odia text-to-speech generation failed.")
            handle_openai_error(exc)

        return Response(
            content=audio_response.content,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": 'inline; filename="odia-speech.mp3"'
            },
        )

    except HTTPException:
        raise

    except Exception:
        logger.exception("Odia text-to-speech endpoint failed.")

        raise HTTPException(
            status_code=500,
            detail="Failed to generate Odia speech."
        )


# =========================================================
# 11. HEALTH CHECK
# =========================================================

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "ARKA AI Backend",
        "ai_configured": client is not None,
    }


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
async def root():
    return {
        "message": "ARKA AI Backend is running.",
        "health": "/health",
        "docs": "/docs",
    }


# =========================================================
# APPLICATION ENTRY POINT
# =========================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
    )
