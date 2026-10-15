import os
import io
import json
import base64
import logging
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from google import genai
from google.genai import types
from google.genai import errors
from gtts import gTTS

# =========================================================
# CONFIGURATION & ENVIRONMENT
# =========================================================

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("arka_backend")

# Centralized Gemini Model Configuration (Free-tier prioritized)
# Default model: gemini-2.5-flash (primary multimodal flash model on Gemini API free tier)
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
VISION_GEMINI_MODEL = os.getenv("GEMINI_VISION_MODEL", DEFAULT_GEMINI_MODEL)

# API Key initialization
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client: Optional[genai.Client] = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Google GenAI client initialized with model %s", DEFAULT_GEMINI_MODEL)
    except Exception as exc:
        logger.error("Failed to initialize Google GenAI client: %s", exc)
        client = None
else:
    logger.warning(
        "GEMINI_API_KEY environment variable is not set. "
        "AI endpoints will return HTTP 503 until configured."
    )

app = FastAPI(
    title="ARKA AI Backend",
    description="AI-powered travel and cultural assistant API powered by Google Gemini",
    version="2.0.0",
)

# =========================================================
# CORS CONFIGURATION
# =========================================================

# Read allowed origins from env or default to production Vercel app + local dev
env_cors = os.getenv("CORS_ORIGINS", "")
if env_cors:
    allowed_origins = [orig.strip() for orig in env_cors.split(",") if orig.strip()]
else:
    allowed_origins = [
        "https://arka-ai-woad.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

# Ensure the production frontend origin is always present
if "https://arka-ai-woad.vercel.app" not in allowed_origins:
    allowed_origins.append("https://arka-ai-woad.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# PYDANTIC REQUEST SCHEMAS
# =========================================================

class TripData(BaseModel):
    destination: str = Field(..., min_length=1, max_length=200, description="Destination city/region")
    days: int = Field(..., ge=1, le=30, description="Duration in days (1-30)")
    budget: int = Field(..., ge=0, description="Trip budget")
    style: str = Field(..., min_length=1, max_length=100, description="Travel style (e.g., Luxury, Budget)")
    interests: list[str] = Field(default_factory=list, description="List of user interests")

    @field_validator("destination", "style")
    @classmethod
    def strip_and_validate_non_empty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be empty or only whitespace.")
        return s


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="User message text")
    history: list[dict] = Field(default_factory=list, description="Prior conversation messages")

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Message cannot be empty or whitespace.")
        return s


class ARScannerRequest(BaseModel):
    image: str = Field(..., min_length=1, description="Base64-encoded image or data URL")

    @field_validator("image")
    @classmethod
    def validate_image_not_empty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Image data cannot be empty.")
        return s


class FestivalRequest(BaseModel):
    location: str = Field(..., min_length=1, max_length=200)

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Location cannot be empty.")
        return s


class RiskRequest(BaseModel):
    location: str = Field(..., min_length=1, max_length=200)

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Location cannot be empty.")
        return s


class TrackingRequest(BaseModel):
    origin: str = Field(..., min_length=1, max_length=200)
    destination: str = Field(..., min_length=1, max_length=200)

    @field_validator("origin", "destination")
    @classmethod
    def validate_endpoints(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Endpoint location cannot be empty.")
        return s


class VRScanRequest(BaseModel):
    location: str = Field(..., min_length=1, max_length=200)

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Location cannot be empty.")
        return s


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    target_language: str = Field(default="Odia", min_length=1, max_length=100)

    @field_validator("text", "target_language")
    @classmethod
    def validate_strings(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Field cannot be empty.")
        return s


class LocationRequest(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitude between -90 and 90")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitude between -180 and 180")


# =========================================================
# HELPER FUNCTIONS & ERROR HANDLING
# =========================================================

def get_gemini_client() -> genai.Client:
    """
    Return the Google GenAI client or raise a clear 503 configuration error.
    """
    if client is None:
        logger.error("GEMINI_API_KEY is missing or client is uninitialized.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured. GEMINI_API_KEY is missing from server environment.",
        )
    return client


def handle_gemini_error(exc: Exception):
    """
    Convert Google GenAI API exceptions into appropriate HTTP responses.
    Detailed diagnostics remain in server logs without exposing credentials.
    """
    if isinstance(exc, HTTPException):
        raise exc

    if isinstance(exc, errors.APIError):
        code = getattr(exc, "code", None)
        msg = str(exc)

        # Quota / Rate limit (free tier exhaustion)
        if code == 429 or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower():
            logger.warning("Gemini API rate limit or quota exceeded: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI service rate limit or free-tier quota reached. Please try again later.",
            )

        # Authentication / Invalid API key
        if code in (401, 403) or "PERMISSION_DENIED" in msg or "API_KEY_INVALID" in msg:
            logger.error("Gemini API authentication failed: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service authentication failed. Check the server GEMINI_API_KEY configuration.",
            )

        # Model not found or deprecated
        if code == 404 or "NOT_FOUND" in msg:
            logger.error("Gemini model not found: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The requested Gemini AI model is currently unavailable.",
            )

        # Invalid arguments / bad input
        if code == 400 or "INVALID_ARGUMENT" in msg:
            logger.warning("Gemini API invalid argument: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request to the AI service. Please verify your input data.",
            )

        # General upstream error
        logger.exception("Gemini API error (code %s): %s", code, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service returned an upstream error. Please try again.",
        )

    # Network / Connection failures
    err_str = str(exc).lower()
    if "connect" in err_str or "timeout" in err_str or "network" in err_str:
        logger.exception("Could not connect to Gemini service: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not connect to the AI service. Please try again.",
        )

    logger.exception("Unexpected backend error: %s", exc)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected server error occurred.",
    )


def call_gemini(
    contents: Any,
    model: str = DEFAULT_GEMINI_MODEL,
    config: Optional[types.GenerateContentConfig] = None,
):
    """
    Execute a Gemini generate_content call with centralized error handling.
    """
    try:
        api_client = get_gemini_client()
        return api_client.models.generate_content(
            model=model,
            contents=contents,
            config=config,
        )
    except HTTPException:
        raise
    except Exception as exc:
        handle_gemini_error(exc)


def parse_json_response(response: Any) -> dict:
    """
    Parse a JSON response returned by the model safely.
    Handles raw JSON, markdown-wrapped JSON code blocks, and malformed strings.
    """
    if response is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service returned an empty response.",
        )

    # Extract text from response object
    text_content = getattr(response, "text", None)
    if not text_content and hasattr(response, "candidates") and response.candidates:
        candidate = response.candidates[0]
        if hasattr(candidate, "content") and candidate.content and candidate.content.parts:
            text_content = candidate.content.parts[0].text

    if not text_content or not text_content.strip():
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service returned an empty response.",
        )

    clean = text_content.strip()

    # Strip markdown code fence if present
    if clean.startswith("```json"):
        clean = clean[7:]
    elif clean.startswith("```"):
        clean = clean[3:]
    if clean.endswith("```"):
        clean = clean[:-3]

    clean = clean.strip()

    try:
        data = json.loads(clean)
        if not isinstance(data, (dict, list)):
            raise ValueError("Parsed JSON is not an object or list.")
        return data
    except (json.JSONDecodeError, ValueError) as exc:
        logger.error("Failed to parse JSON response from Gemini: %s. Response content was: %s", exc, clean[:200])
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service returned an invalid JSON response. Please try again.",
        )


# =========================================================
# 1. GENERATE TRAVEL ITINERARY
# =========================================================

@app.post("/generate-itinerary")
async def generate_itinerary(data: TripData):
    try:
        interests_str = ", ".join(data.interests) if data.interests else "sightseeing, local food, culture"

        prompt = (
            f"Plan a {data.days}-day {data.style} trip to {data.destination} "
            f"with a budget of ${data.budget}. Interests include: {interests_str}.\n\n"
            "Return a valid JSON object containing an array named 'itinerary'. "
            "Each item in 'itinerary' must be an object with the following fields:\n"
            "- 'day': integer representing day number (1 to {data.days})\n"
            "- 'title': short title of the day plan\n"
            "- 'morning': detailed morning activity\n"
            "- 'afternoon': detailed afternoon activity\n"
            "- 'evening': detailed evening activity\n\n"
            "Return ONLY the JSON object."
        )

        system_instruction = (
            "You are a professional travel planner. "
            "Return a valid JSON object containing an array named 'itinerary'. "
            "Each item must contain 'day', 'title', 'morning', 'afternoon', and 'evening'."
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.3,
            max_output_tokens=3000,
        )

        response = call_gemini(
            model=DEFAULT_GEMINI_MODEL,
            contents=prompt,
            config=config,
        )

        parsed = parse_json_response(response)

        # Normalize schema: ensure root is a dict with 'itinerary' list
        if isinstance(parsed, list):
            parsed = {"itinerary": parsed}
        elif isinstance(parsed, dict) and "itinerary" not in parsed:
            # Look for an array value
            for v in parsed.values():
                if isinstance(v, list):
                    parsed = {"itinerary": v}
                    break
            else:
                parsed["itinerary"] = []

        return parsed

    except HTTPException:
        raise
    except Exception:
        logger.exception("Error in generate_itinerary endpoint.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate itinerary.",
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
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty.",
            )

        system_instruction = (
            "You are ARKA AI, a helpful, friendly, and knowledgeable travel assistant. "
            "Help users plan trips, discover destinations, understand cultures, and explore travel options. "
            "Be friendly, concise, and accurate. "
            "Never claim to have verified live information unless a reliable live data source is available."
        )

        # Build conversation contents for Gemini
        # Max history: keep last 20 messages to control token usage on free tier
        raw_history = request.history[-20:] if len(request.history) > 20 else request.history
        contents = []

        for index, msg in enumerate(raw_history):
            if not isinstance(msg, dict):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"History item {index} must be an object.",
                )

            role = msg.get("role")
            content = msg.get("content")

            if role not in ("user", "assistant", "model"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"History item {index} has an invalid role. Allowed roles are user and assistant.",
                )

            if not isinstance(content, str):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"History item {index} must contain string content.",
                )

            content_text = content.strip()
            if content_text:
                # Map OpenAI 'assistant' role to Gemini 'model' role
                gemini_role = "model" if role == "assistant" else role
                contents.append(
                    types.Content(
                        role=gemini_role,
                        parts=[types.Part.from_text(text=content_text[:3000])],
                    )
                )

        # Add the current user message
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_message[:4000])],
            )
        )

        # Sanitize turn alternation (Gemini requires alternation user -> model -> user)
        # Drop leading model messages if any
        while contents and contents[0].role == "model":
            contents.pop(0)

        # Merge consecutive turns of same role
        sanitized_contents = []
        for turn in contents:
            if sanitized_contents and sanitized_contents[-1].role == turn.role:
                sanitized_contents[-1].parts.extend(turn.parts)
            else:
                sanitized_contents.append(turn)

        logger.info(
            "Processing ARKA AI chat request. History messages: %d, Turns: %d",
            len(request.history),
            len(sanitized_contents),
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,
            max_output_tokens=1500,
        )

        response = call_gemini(
            model=DEFAULT_GEMINI_MODEL,
            contents=sanitized_contents,
            config=config,
        )

        answer = response.text if response and response.text else None
        if answer is None:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI service returned an empty response.",
            )

        return {"response": answer}

    except HTTPException:
        raise
    except Exception:
        logger.exception("Chat endpoint failed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing your message.",
        )


# =========================================================
# 3. AR IMAGE SCANNER
# =========================================================

@app.post("/ar-scanner")
async def ar_scanner(request: ARScannerRequest):
    try:
        raw_image = request.image.strip()
        if not raw_image:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image data cannot be empty.",
            )

        mime_type = "image/jpeg"
        base64_data = raw_image

        # Support both Data URL ('data:image/png;base64,...') and raw base64 string
        if raw_image.startswith("data:"):
            if "," not in raw_image:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid image data URL format.",
                )
            header, base64_data = raw_image.split(",", 1)
            if ":" in header and ";" in header:
                parsed_mime = header.split(":", 1)[1].split(";", 1)[0].strip().lower()
                if parsed_mime:
                    mime_type = parsed_mime

        # Decode Base64 data
        try:
            image_bytes = base64.b64decode(base64_data)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Base64-encoded image data.",
            )

        # Validate image size (10 MB max)
        MAX_IMAGE_SIZE = 10 * 1024 * 1024
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Decoded image is empty.",
            )
        if len(image_bytes) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image size exceeds the maximum limit of 10 MB.",
            )

        # Auto-detect mime type from magic bytes if default
        if mime_type == "image/jpeg":
            if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
                mime_type = "image/png"
            elif image_bytes.startswith(b"RIFF") and image_bytes[8:12] == b"WEBP":
                mime_type = "image/webp"
            elif image_bytes.startswith(b"GIF87a") or image_bytes.startswith(b"GIF89a"):
                mime_type = "image/gif"

        allowed_mimes = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"}
        if mime_type not in allowed_mimes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image format '{mime_type}'. Supported formats: JPEG, PNG, WEBP, GIF.",
            )

        prompt_text = (
            "Analyze this image and provide the following sections:\n"
            "# Identity & History\n"
            "Identify the subject and discuss its historical significance if known.\n\n"
            "# 3D Geometrical & Spatial Features\n"
            "Describe visible architecture, shape, texture, and spatial arrangement.\n\n"
            "# Interesting Facts & Observations\n"
            "Provide relevant facts and clearly identify uncertain details."
        )

        system_instruction = (
            "You are an AI vision assistant. Analyze the provided image carefully. "
            "Describe visible objects, architecture, spatial features, and historical context "
            "when reasonably identifiable. Clearly distinguish observations from uncertain inferences. "
            "Never claim 100% certainty."
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
            max_output_tokens=1200,
        )

        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            types.Part.from_text(text=prompt_text),
        ]

        response = call_gemini(
            model=VISION_GEMINI_MODEL,
            contents=contents,
            config=config,
        )

        description = response.text if response and response.text else None
        if not description:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI vision service returned an empty response.",
            )

        return {"description": description}

    except HTTPException:
        raise
    except Exception:
        logger.exception("AR scanner failed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze the image.",
        )


# =========================================================
# 4. FESTIVAL DISCOVERY
# =========================================================

@app.post("/festivals")
async def festivals(request: FestivalRequest):
    try:
        prompt = (
            f"Identify 3-5 major cultural festivals and celebrations associated with {request.location}. "
            "Provide their name, date, description, history, and image_keyword.\n\n"
            "Return a JSON object containing a 'festivals' array. Each item must contain:\n"
            "- 'name': exact festival name\n"
            "- 'date': typical month or date range (communicate uncertainty when dates depend on an unverified lunar or local calendar)\n"
            "- 'description': engaging summary of rituals, food, and festivities\n"
            "- 'history': cultural and historical background\n"
            "- 'image_keyword': 1-2 english keywords for image search (e.g. 'rath yatra', 'diwali lights')\n\n"
            "Do not fabricate verified current dates. Clearly communicate uncertainty when dates require verification."
        )

        system_instruction = (
            "You are a cultural expert. Return valid JSON with a 'festivals' array. "
            "Each festival must contain name, date, description, history, and image_keyword."
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.3,
            max_output_tokens=2048,
        )

        response = call_gemini(
            model=DEFAULT_GEMINI_MODEL,
            contents=prompt,
            config=config,
        )

        parsed = parse_json_response(response)

        if isinstance(parsed, list):
            parsed = {"festivals": parsed}
        elif isinstance(parsed, dict) and "festivals" not in parsed:
            for v in parsed.values():
                if isinstance(v, list):
                    parsed = {"festivals": v}
                    break
            else:
                parsed["festivals"] = []

        return parsed

    except HTTPException:
        raise
    except Exception:
        logger.exception("Festival discovery failed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve festival information.",
        )


# =========================================================
# 5. TRAVEL RISK PREDICTION
# =========================================================

@app.post("/risk-prediction")
async def risk_prediction(request: RiskRequest):
    try:
        prompt = f"""
Provide a comprehensive travel safety and risk assessment for {request.location}.

Return a valid JSON object strictly matching the following schema:
{{
    "weather_risk": {{
        "hazard": "description of typical seasonal weather concern",
        "level": "Low", 
        "advice": "practical safety advice for travelers"
    }},
    "crime_data": [
        {{
            "area": "district or tourist area name",
            "risk_type": "type of concern (e.g., pickpocketing, scams)",
            "safety_score": 85
        }}
    ],
    "health_alerts": [
        {{
            "infection": "health advisory, endemic issue, or vaccination notice",
            "precaution": "preventative health advice"
        }}
    ],
    "fraud_alerts": [
        {{
            "scam": "name of common tourist scam",
            "how_it_works": "brief description of how travelers are targeted",
            "prevention": "practical prevention tip"
        }}
    ]
}}

Guidelines:
- 'level' in weather_risk MUST be one of: "Low", "Medium", or "High".
- Provide 2-3 items for each of crime_data, health_alerts, and fraud_alerts.
- Safety scores in crime_data must be integers between 0 and 100.
- Important: Do not invent live weather conditions, verified crime statistics, or current emergency alerts.
  Clearly indicate when information is general guidance rather than verified real-time data.
"""

        system_instruction = (
            "You are a travel safety and risk assessment assistant. "
            "Return valid JSON and distinguish verified facts from general guidance."
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=2048,
        )

        response = call_gemini(
            model=DEFAULT_GEMINI_MODEL,
            contents=prompt,
            config=config,
        )

        parsed = parse_json_response(response)

        # Ensure schema structure
        if not isinstance(parsed, dict):
            parsed = {}

        if "weather_risk" not in parsed or not isinstance(parsed.get("weather_risk"), dict):
            parsed["weather_risk"] = {
                "hazard": "General seasonal variability",
                "level": "Low",
                "advice": "Check local forecasts prior to day trips.",
            }

        for list_key in ("crime_data", "health_alerts", "fraud_alerts"):
            if list_key not in parsed or not isinstance(parsed.get(list_key), list):
                parsed[list_key] = []

        return parsed

    except HTTPException:
        raise
    except Exception:
        logger.exception("Risk prediction failed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate the travel risk assessment.",
        )


# =========================================================
# 6. VR MONUMENT SCANNER
# =========================================================

@app.post("/vr-scan-location")
async def vr_scan_location(request: VRScanRequest):
    try:
        prompt = f"""
Identify 3-5 famous historical monuments or landmarks in {request.location}.

Return a JSON object containing a "monuments" array.
Each monument must contain:
- name: Exact monument name.
- description: Engaging, immersive description suitable for an audio guide.
- history: Historical background, century built, or founding ruler.
- architecture: Architectural style, structural design, and artistic motifs.
- coordinates: An object containing lat (float) and lng (float). Use reasonable estimates or null.
- vr_metrics: An object containing:
    - height: Estimated height in meters (e.g. "65m" or "30m").
    - material: Primary building material (e.g. "Khondalite stone", "Red sandstone", "Marble").
    - style: Architectural style (e.g. "Kalinga architecture", "Dravidian", "Mughal").
    - complexity: Integer between 1 and 100 representing architectural complexity.

Do not fabricate precise coordinates or measurements. Clearly distinguish estimates from verified measurements.
"""

        system_instruction = (
            "You are a VR spatial design and historical information assistant. Return valid JSON."
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=2500,
        )

        response = call_gemini(
            model=DEFAULT_GEMINI_MODEL,
            contents=prompt,
            config=config,
        )

        parsed = parse_json_response(response)

        if isinstance(parsed, list):
            parsed = {"monuments": parsed}
        elif isinstance(parsed, dict) and "monuments" not in parsed:
            for v in parsed.values():
                if isinstance(v, list):
                    parsed = {"monuments": v}
                    break
            else:
                parsed["monuments"] = []

        return parsed

    except HTTPException:
        raise
    except Exception:
        logger.exception("VR location scan failed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve monument information.",
        )


# =========================================================
# 7. ROUTE TRACKING
# =========================================================

@app.post("/route-tracking")
async def route_tracking(request: TrackingRequest):
    try:
        prompt = f"""
Provide travel logistics from {request.origin} to {request.destination}.

Return a valid JSON object containing:
- origin: object with name (string), lat (float), lng (float).
- destination: object with name (string), lat (float), lng (float).
- distance: string estimate (e.g. "65 km").
- duration: string estimate (e.g. "1 hour 45 mins").
- traffic: string describing typical conditions (e.g. "Estimated normal flow; peak hours may vary").
- hotels: list of 3-5 hotel suggestions, each with:
    - name: string
    - lat: float
    - lng: float
    - price: string (e.g. "$45/night")
    - rating: float (e.g. 4.4)
- center: object containing lat (float), lng (float), and zoom (integer, 8-12) suitable to frame origin and destination on a map.

IMPORTANT:
You do not have a verified live traffic or routing feed in this request.
Do not present estimated traffic or travel times as real-time verified information.
Clearly mark estimates. Do not invent exact hotel coordinates, prices, or ratings.
Origin: {request.origin}
Destination: {request.destination}
"""

        system_instruction = (
            "You are a travel logistics assistant. Return valid JSON and clearly identify estimates."
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=2048,
        )

        response = call_gemini(
            model=DEFAULT_GEMINI_MODEL,
            contents=prompt,
            config=config,
        )

        parsed = parse_json_response(response)

        # Fallback fields to prevent frontend map crashes
        if not isinstance(parsed, dict):
            parsed = {}

        if "origin" not in parsed or not isinstance(parsed.get("origin"), dict):
            parsed["origin"] = {"name": request.origin, "lat": 20.2961, "lng": 85.8245}
        if "destination" not in parsed or not isinstance(parsed.get("destination"), dict):
            parsed["destination"] = {"name": request.destination, "lat": 19.8135, "lng": 85.8312}
        if "distance" not in parsed:
            parsed["distance"] = "Estimated distance"
        if "duration" not in parsed:
            parsed["duration"] = "Estimated travel duration"
        if "traffic" not in parsed:
            parsed["traffic"] = "Estimated typical conditions"
        if "hotels" not in parsed or not isinstance(parsed.get("hotels"), list):
            parsed["hotels"] = []
        if "center" not in parsed or not isinstance(parsed.get("center"), dict):
            parsed["center"] = {"lat": 20.0, "lng": 85.8, "zoom": 9}

        return parsed

    except HTTPException:
        raise
    except Exception:
        logger.exception("Route tracking failed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate route information.",
        )


# =========================================================
# 8. SUGGEST NEARBY DESTINATIONS
# =========================================================

@app.post("/suggest-destination")
async def suggest_destination(request: LocationRequest):
    try:
        prompt = f"""
The coordinates are latitude {request.lat}, longitude {request.lng}.

Identify the likely city, region, or area and suggest three nearby tourist attractions or landmarks.

Return valid JSON with exactly two keys:
- origin_city: string
- destinations: list of objects containing:
    - name: string
    - reason: string
    - lat: float or null
    - lng: float or null

Do not invent exact coordinates. Clearly indicate uncertainty if the location cannot be reliably identified.
"""

        system_instruction = (
            "You are a local travel guide assistant. Return valid JSON and avoid fabricated coordinates."
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=1500,
        )

        response = call_gemini(
            model=DEFAULT_GEMINI_MODEL,
            contents=prompt,
            config=config,
        )

        parsed = parse_json_response(response)

        if not isinstance(parsed, dict):
            parsed = {}

        if "origin_city" not in parsed:
            parsed["origin_city"] = "Identified Region"
        if "destinations" not in parsed or not isinstance(parsed.get("destinations"), list):
            parsed["destinations"] = []

        return parsed

    except HTTPException:
        raise
    except Exception:
        logger.exception("Destination suggestions failed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to suggest nearby destinations.",
        )


# =========================================================
# 9. MULTILINGUAL TRANSLATION
# =========================================================

@app.post("/translate")
async def translate_text(request: TranslateRequest):
    try:
        user_text = request.text.strip()
        target_lang = request.target_language.strip()

        if not user_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text cannot be empty.",
            )

        if not target_lang:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target language cannot be empty.",
            )

        prompt = (
            f"Translate the following text into {target_lang}.\n"
            "Return only the translated text, without explanations, quotes, or conversational filler. "
            "Preserve the original meaning, tone, and cultural nuance.\n\n"
            f"Text:\n{user_text}"
        )

        system_instruction = (
            "You are an expert multilingual translator specializing in Indian and global languages. "
            "Translate accurately and naturally. Return ONLY the translated output."
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
            max_output_tokens=2048,
        )

        response = call_gemini(
            model=DEFAULT_GEMINI_MODEL,
            contents=prompt,
            config=config,
        )

        translated = response.text.strip() if response and response.text else None
        if not translated:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The translation service returned an empty response.",
            )

        return {"translated": translated}

    except HTTPException:
        raise
    except Exception:
        logger.exception("Translation failed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to translate the text.",
        )


# =========================================================
# 10. ODIA TEXT-TO-SPEECH (TTS)
# =========================================================

@app.post("/tts-odia")
async def tts_odia(request: TranslateRequest):
    """
    Translates input text to Odia (ଓଡ଼ିଆ) using Google Gemini,
    then generates a genuine audio/mpeg (MP3) response using free gTTS.
    Preserves full frontend audio/blob compatibility with zero paid credits.
    """
    try:
        user_text = request.text.strip()
        if not user_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text cannot be empty.",
            )

        if len(user_text) > 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text exceeds maximum limit of 1000 characters for speech generation.",
            )

        # Step 1: Translate text into natural Odia using Gemini
        prompt = (
            "You are an expert Odia translator. "
            "Translate the supplied text into natural, fluent Odia (ଓଡ଼ିଆ). "
            "Return only the Odia translation, with no extra explanation or quotation marks.\n\n"
            f"Text:\n{user_text}"
        )

        system_instruction = (
            "You are an expert Odia translator. Return ONLY the translated text in Odia script."
        )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
            max_output_tokens=500,
        )

        response = call_gemini(
            model=DEFAULT_GEMINI_MODEL,
            contents=prompt,
            config=config,
        )

        odia_text = response.text.strip() if response and response.text else None
        if not odia_text:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Translation into Odia returned an empty response.",
            )

        # Step 2: Synthesize audio as audio/mpeg using gTTS
        # gTTS generates genuine MP3 bytes without any paid API keys or subscription.
        try:
            tts = gTTS(text=odia_text, lang="hi")
            mp3_buffer = io.BytesIO()
            tts.write_to_fp(mp3_buffer)
            mp3_buffer.seek(0)
            audio_bytes = mp3_buffer.read()
        except Exception as exc:
            logger.exception("Text-to-speech audio synthesis failed: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Audio synthesis service failed to generate speech.",
            )

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": 'inline; filename="odia-speech.mp3"',
                "Content-Length": str(len(audio_bytes)),
            },
        )

    except HTTPException:
        raise
    except Exception:
        logger.exception("Odia text-to-speech endpoint failed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Odia speech.",
        )


# =========================================================
# 11. HEALTH CHECK
# =========================================================

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "ARKA AI Backend",
        "provider": "Google Gemini",
        "model": DEFAULT_GEMINI_MODEL,
        "vision_model": VISION_GEMINI_MODEL,
        "ai_configured": client is not None,
    }


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
async def root():
    return {
        "message": "ARKA AI Backend is running with Google Gemini.",
        "provider": "Google Gemini",
        "model": DEFAULT_GEMINI_MODEL,
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
