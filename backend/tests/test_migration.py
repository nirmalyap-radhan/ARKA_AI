import base64
import json
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

import main
from main import app
from google.genai import errors


@pytest.fixture
def client():
    return TestClient(app)


# =========================================================
# 1. APPLICATION STARTUP & ROOT & HEALTH
# =========================================================

def test_startup_and_metadata(client):
    """Verify application startup, title, and routes."""
    assert app.title == "ARKA AI Backend"
    assert app.version == "2.0.0"
    routes = [r.path for r in app.routes]
    assert "/" in routes
    assert "/health" in routes
    assert "/generate-itinerary" in routes
    assert "/chat" in routes
    assert "/ar-scanner" in routes
    assert "/festivals" in routes
    assert "/risk-prediction" in routes
    assert "/vr-scan-location" in routes
    assert "/route-tracking" in routes
    assert "/suggest-destination" in routes
    assert "/translate" in routes
    assert "/tts-odia" in routes


def test_get_root(client):
    """Verify GET / returns service information."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["provider"] == "Google Gemini"
    assert data["health"] == "/health"
    assert data["docs"] == "/docs"


def test_get_health_unconfigured(client):
    """Verify GET /health distinguishes unconfigured state."""
    with patch("main.client", None):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "ARKA AI Backend"
        assert data["provider"] == "Google Gemini"
        assert data["ai_configured"] is False


def test_get_health_configured(client):
    """Verify GET /health with configured AI client."""
    mock_gemini = MagicMock()
    with patch("main.client", mock_gemini):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["ai_configured"] is True
        assert data["model"] == main.DEFAULT_GEMINI_MODEL


# =========================================================
# 2. CORS PREFLIGHT
# =========================================================

def test_cors_preflight(client):
    """Verify CORS preflight headers for Vercel frontend origin."""
    origin = "https://arka-ai-woad.vercel.app"
    response = client.options(
        "/chat",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    assert "POST" in response.headers.get("access-control-allow-methods", "")


# =========================================================
# 3. MISSING CREDENTIALS HANDLING
# =========================================================

def test_missing_credentials_returns_503(client):
    """Verify all AI endpoints return 503 when GEMINI_API_KEY is not configured."""
    with patch("main.client", None):
        # /chat
        res_chat = client.post("/chat", json={"message": "hello"})
        assert res_chat.status_code == 503
        assert "GEMINI_API_KEY is missing" in res_chat.json()["detail"]

        # /generate-itinerary
        res_itin = client.post(
            "/generate-itinerary",
            json={"destination": "Puri", "days": 3, "budget": 500, "style": "Cultural", "interests": []},
        )
        assert res_itin.status_code == 503

        # /translate
        res_trans = client.post("/translate", json={"text": "hello", "target_language": "Odia"})
        assert res_trans.status_code == 503


# =========================================================
# 4. POST /chat REQUEST VALIDATION & SUCCESS
# =========================================================

def test_chat_validation_empty_message(client):
    """Chat message cannot be empty or only spaces."""
    response = client.post("/chat", json={"message": "   "})
    assert response.status_code in (400, 422)


def test_chat_validation_malformed_history(client):
    """Chat history must be valid objects with valid roles."""
    mock_gemini = MagicMock()
    with patch("main.client", mock_gemini):
        # Invalid role
        res1 = client.post(
            "/chat",
            json={"message": "hi", "history": [{"role": "system_hacker", "content": "inject"}]},
        )
        assert res1.status_code == 400

        # Non-string content
        res2 = client.post(
            "/chat",
            json={"message": "hi", "history": [{"role": "user", "content": 12345}]},
        )
        assert res2.status_code == 400

        # Non-object item (rejected by Pydantic schema validation as 422 or endpoint as 400)
        res3 = client.post(
            "/chat",
            json={"message": "hi", "history": ["string instead of object"]},
        )
        assert res3.status_code in (400, 422)


def test_chat_success_and_role_mapping(client):
    """Chat correctly maps roles and returns {\"response\": \"...\"}."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "Hello! I am ARKA AI, ready to help you explore Odisha."
    mock_gemini.models.generate_content.return_value = mock_resp

    with patch("main.client", mock_gemini):
        response = client.post(
            "/chat",
            json={
                "message": "What is the best time to visit Puri?",
                "history": [
                    {"role": "user", "content": "Hi"},
                    {"role": "assistant", "content": "Hello! How can I help?"},
                ],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert data["response"] == "Hello! I am ARKA AI, ready to help you explore Odisha."

        # Verify call arguments to Gemini SDK
        args, kwargs = mock_gemini.models.generate_content.call_args
        contents = kwargs.get("contents")
        # Ensure 'assistant' was mapped to 'model'
        roles = [c.role for c in contents]
        assert "model" in roles
        assert "user" in roles


# =========================================================
# 5. POST /generate-itinerary RESPONSE PARSING & SCHEMA
# =========================================================

def test_generate_itinerary_success(client):
    """Itinerary endpoint returns expected array with day, title, morning, afternoon, evening."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    itinerary_data = {
        "itinerary": [
            {
                "day": 1,
                "title": "Arrival in Bhubaneswar",
                "morning": "Check into hotel and visit Lingaraj Temple",
                "afternoon": "Explore Udayagiri and Khandagiri Caves",
                "evening": "Enjoy authentic Odia dinner at Ekamra Haat",
            },
            {
                "day": 2,
                "title": "Konark Sun Temple & Beach",
                "morning": "Drive to Konark and marvel at the Sun Temple",
                "afternoon": "Relax at Chandrabhaga Beach",
                "evening": "Return via Marine Drive",
            },
        ]
    }
    mock_resp.text = json.dumps(itinerary_data)
    mock_gemini.models.generate_content.return_value = mock_resp

    with patch("main.client", mock_gemini):
        response = client.post(
            "/generate-itinerary",
            json={
                "destination": "Bhubaneswar & Konark",
                "days": 2,
                "budget": 300,
                "style": "Heritage",
                "interests": ["Architecture", "Cuisine"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "itinerary" in data
        assert len(data["itinerary"]) == 2
        first_day = data["itinerary"][0]
        assert first_day["day"] == 1
        assert "title" in first_day
        assert "morning" in first_day
        assert "afternoon" in first_day
        assert "evening" in first_day


def test_generate_itinerary_markdown_fence_handling(client):
    """Itinerary handles markdown ```json code block wrapper properly."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "```json\n{\"itinerary\": [{\"day\": 1, \"title\": \"Day 1\", \"morning\": \"M\", \"afternoon\": \"A\", \"evening\": \"E\"}]}\n```"
    mock_gemini.models.generate_content.return_value = mock_resp

    with patch("main.client", mock_gemini):
        response = client.post(
            "/generate-itinerary",
            json={"destination": "Puri", "days": 1, "budget": 100, "style": "Relaxed", "interests": []},
        )
        assert response.status_code == 200
        assert "itinerary" in response.json()
        assert len(response.json()["itinerary"]) == 1


def test_generate_itinerary_validation_limits(client):
    """Days must be between 1 and 30, budget >= 0."""
    res_days = client.post(
        "/generate-itinerary",
        json={"destination": "Puri", "days": 50, "budget": 100, "style": "Relaxed", "interests": []},
    )
    assert res_days.status_code == 422

    res_budget = client.post(
        "/generate-itinerary",
        json={"destination": "Puri", "days": 3, "budget": -50, "style": "Relaxed", "interests": []},
    )
    assert res_budget.status_code == 422


# =========================================================
# 6. POST /ar-scanner IMAGE VALIDATION & MULTIMODAL
# =========================================================

def test_ar_scanner_validation(client):
    """Validate empty image, invalid format, and malformed data URL."""
    # Empty
    res_empty = client.post("/ar-scanner", json={"image": ""})
    assert res_empty.status_code in (400, 422)

    # Malformed data URL
    res_malformed = client.post("/ar-scanner", json={"image": "data:image/jpeg;notvalidbase64"})
    assert res_malformed.status_code == 400

    # Unsupported format
    fake_b64 = base64.b64encode(b"not an image").decode()
    res_unsupported = client.post(
        "/ar-scanner", json={"image": f"data:application/pdf;base64,{fake_b64}"}
    )
    assert res_unsupported.status_code == 400


def test_ar_scanner_success(client):
    """Verify multimodal analysis with valid JPEG base64 and data URL."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "# Identity & History\nThis is the Konark Sun Temple built in the 13th century.\n\n# 3D Geometrical & Spatial Features\nFeatures a chariot structure with carved stone wheels."
    mock_gemini.models.generate_content.return_value = mock_resp

    # Valid tiny 1x1 JPEG base64
    tiny_jpeg = (
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP////////////////////////////////"
        "//////////////////////////////////////////////////////wgALCAABAAEB"
        "AREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
    )

    with patch("main.client", mock_gemini):
        # Raw Base64
        res1 = client.post("/ar-scanner", json={"image": tiny_jpeg})
        assert res1.status_code == 200
        assert "description" in res1.json()
        assert "Konark Sun Temple" in res1.json()["description"]

        # Data URL
        res2 = client.post("/ar-scanner", json={"image": f"data:image/jpeg;base64,{tiny_jpeg}"})
        assert res2.status_code == 200
        assert "description" in res2.json()


# =========================================================
# 7. POST /festivals SCHEMA
# =========================================================

def test_festivals_schema(client):
    """Verify /festivals response structure."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps({
        "festivals": [
            {
                "name": "Ratha Yatra",
                "date": "June or July (Ashadha Shukla Dwitiya)",
                "description": "Grand Chariot Festival of Lord Jagannath.",
                "history": "Ancient festival celebrated for over a millennium.",
                "image_keyword": "rath yatra chariot",
            }
        ]
    })
    mock_gemini.models.generate_content.return_value = mock_resp

    with patch("main.client", mock_gemini):
        response = client.post("/festivals", json={"location": "Puri"})
        assert response.status_code == 200
        data = response.json()
        assert "festivals" in data
        assert len(data["festivals"]) == 1
        item = data["festivals"][0]
        assert "name" in item
        assert "date" in item
        assert "description" in item
        assert "history" in item
        assert "image_keyword" in item


# =========================================================
# 8. POST /risk-prediction SCHEMA
# =========================================================

def test_risk_prediction_schema(client):
    """Verify /risk-prediction nested fields and types."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps({
        "weather_risk": {
            "hazard": "Monsoon rainfall and humidity",
            "level": "Medium",
            "advice": "Carry waterproof gear and umbrella",
        },
        "crime_data": [
            {
                "area": "Temple crowded corridors",
                "risk_type": "Pickpocketing",
                "safety_score": 82,
            }
        ],
        "health_alerts": [
            {
                "infection": "Mosquito-borne illnesses",
                "precaution": "Use mosquito repellent",
            }
        ],
        "fraud_alerts": [
            {
                "scam": "Unauthorized guide charges",
                "how_it_works": "Impostor guides demanding high fees",
                "prevention": "Hire registered OTDC guides only",
            }
        ],
    })
    mock_gemini.models.generate_content.return_value = mock_resp

    with patch("main.client", mock_gemini):
        response = client.post("/risk-prediction", json={"location": "Puri"})
        assert response.status_code == 200
        data = response.json()
        assert "weather_risk" in data
        assert data["weather_risk"]["level"] in ("Low", "Medium", "High")
        assert "hazard" in data["weather_risk"]
        assert "advice" in data["weather_risk"]

        assert "crime_data" in data
        assert isinstance(data["crime_data"], list)
        assert data["crime_data"][0]["safety_score"] == 82

        assert "health_alerts" in data
        assert "fraud_alerts" in data


# =========================================================
# 9. POST /vr-scan-location SCHEMA
# =========================================================

def test_vr_scan_location_schema(client):
    """Verify /vr-scan-location monuments and vr_metrics."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps({
        "monuments": [
            {
                "name": "Lingaraj Temple",
                "description": "Majestic 11th-century temple dedicated to Harihara.",
                "history": "Built by King Jajati Keshari of Somavamsi dynasty.",
                "architecture": "Deula style Kalinga architecture.",
                "coordinates": {"lat": 20.2382, "lng": 85.8336},
                "vr_metrics": {
                    "height": "55m",
                    "material": "Red sandstone and laterite",
                    "style": "Kalinga Architecture",
                    "complexity": 90,
                },
            }
        ]
    })
    mock_gemini.models.generate_content.return_value = mock_resp

    with patch("main.client", mock_gemini):
        response = client.post("/vr-scan-location", json={"location": "Bhubaneswar"})
        assert response.status_code == 200
        data = response.json()
        assert "monuments" in data
        m = data["monuments"][0]
        assert "name" in m
        assert "coordinates" in m
        assert "vr_metrics" in m
        assert "height" in m["vr_metrics"]
        assert "material" in m["vr_metrics"]
        assert "style" in m["vr_metrics"]
        assert "complexity" in m["vr_metrics"]


# =========================================================
# 10. POST /route-tracking SCHEMA
# =========================================================

def test_route_tracking_schema(client):
    """Verify /route-tracking response fields."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps({
        "origin": {"name": "Bhubaneswar", "lat": 20.2961, "lng": 85.8245},
        "destination": {"name": "Puri", "lat": 19.8135, "lng": 85.8312},
        "distance": "60 km",
        "duration": "1 hour 15 mins",
        "traffic": "Estimated smooth flow along NH316",
        "hotels": [
            {"name": "Mayfair Waves", "lat": 19.805, "lng": 85.839, "price": "$120/night", "rating": 4.6}
        ],
        "center": {"lat": 20.05, "lng": 85.82, "zoom": 10},
    })
    mock_gemini.models.generate_content.return_value = mock_resp

    with patch("main.client", mock_gemini):
        response = client.post(
            "/route-tracking",
            json={"origin": "Bhubaneswar", "destination": "Puri"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "origin" in data
        assert "destination" in data
        assert "distance" in data
        assert "duration" in data
        assert "traffic" in data
        assert "hotels" in data
        assert "center" in data


# =========================================================
# 11. POST /suggest-destination SCHEMA & VALIDATION
# =========================================================

def test_suggest_destination_validation(client):
    """Latitude and longitude out-of-range checks."""
    res_lat = client.post("/suggest-destination", json={"lat": 105.0, "lng": 85.0})
    assert res_lat.status_code == 422

    res_lng = client.post("/suggest-destination", json={"lat": 20.0, "lng": 250.0})
    assert res_lng.status_code == 422


def test_suggest_destination_success(client):
    """Verify suggested destinations response."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps({
        "origin_city": "Bhubaneswar",
        "destinations": [
            {
                "name": "Dhauli Shanti Stupa",
                "reason": "Historic peace pagoda overlooking Daya River",
                "lat": 20.1924,
                "lng": 85.8394,
            }
        ],
    })
    mock_gemini.models.generate_content.return_value = mock_resp

    with patch("main.client", mock_gemini):
        response = client.post("/suggest-destination", json={"lat": 20.2961, "lng": 85.8245})
        assert response.status_code == 200
        data = response.json()
        assert "origin_city" in data
        assert "destinations" in data
        assert len(data["destinations"]) == 1
        d = data["destinations"][0]
        assert "name" in d
        assert "reason" in d


# =========================================================
# 12. POST /translate
# =========================================================

def test_translate_success(client):
    """Verify /translate returns {\"translated\": \"...\"}."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "ନମସ୍କାର, ଆପଣ କେମିତି ଅଛନ୍ତି?"
    mock_gemini.models.generate_content.return_value = mock_resp

    with patch("main.client", mock_gemini):
        response = client.post(
            "/translate",
            json={"text": "Hello, how are you?", "target_language": "Odia"},
        )
        assert response.status_code == 200
        assert response.json() == {"translated": "ନମସ୍କାର, ଆପଣ କେମିତି ଅଛନ୍ତି?"}


# =========================================================
# 13. POST /tts-odia AUDIO/MPEG RESPONSE
# =========================================================

def test_tts_odia_audio_response(client):
    """Verify /tts-odia produces genuine audio/mpeg MP3 bytes."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "ନମସ୍କାର"
    mock_gemini.models.generate_content.return_value = mock_resp

    with patch("main.client", mock_gemini):
        response = client.post(
            "/tts-odia",
            json={"text": "Welcome to Odisha", "target_language": "Odia"},
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "audio/mpeg"
        assert 'filename="odia-speech.mp3"' in response.headers.get("content-disposition", "")
        # Verify content is binary audio bytes, not text
        audio_content = response.content
        assert len(audio_content) > 100
        assert isinstance(audio_content, bytes)


# =========================================================
# 14. ERROR HANDLING TESTS (QUOTA, AUTH, NETWORK)
# =========================================================

def test_simulated_quota_error(client):
    """Simulate Gemini 429 quota exhaustion; should return 429, not 500."""
    mock_gemini = MagicMock()
    # Create an APIError simulating quota exhaustion
    quota_error = errors.APIError(code=429, response_json={"error": {"message": "Resource has been exhausted (e.g. check quota)."}})
    mock_gemini.models.generate_content.side_effect = quota_error

    with patch("main.client", mock_gemini):
        response = client.post("/chat", json={"message": "hello"})
        assert response.status_code == 429
        assert "quota reached" in response.json()["detail"].lower()


def test_simulated_auth_error(client):
    """Simulate Gemini 401 authentication error; should return 502, not 500."""
    mock_gemini = MagicMock()
    auth_error = errors.APIError(code=401, response_json={"error": {"message": "API key not valid."}})
    mock_gemini.models.generate_content.side_effect = auth_error

    with patch("main.client", mock_gemini):
        response = client.post("/chat", json={"message": "hello"})
        assert response.status_code == 502
        assert "authentication failed" in response.json()["detail"].lower()


def test_invalid_json_model_response(client):
    """Simulate model returning invalid JSON; should return 502, not 500."""
    mock_gemini = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "Sorry, I am not able to output JSON: {incomplete"
    mock_gemini.models.generate_content.return_value = mock_resp

    with patch("main.client", mock_gemini):
        response = client.post("/festivals", json={"location": "Puri"})
        assert response.status_code == 502
        assert "invalid JSON response" in response.json()["detail"]


def test_high_demand_failover(client):
    """When a model encounters a 503 high demand spike, automatically fail over to next model."""
    mock_gemini = MagicMock()
    err_503 = errors.ServerError(503, {"error": {"code": 503, "message": "This model is currently experiencing high demand."}})
    mock_resp = MagicMock()
    mock_resp.text = "Recovered seamlessly via fallback model!"
    mock_gemini.models.generate_content.side_effect = [err_503, mock_resp]

    with patch("main.client", mock_gemini):
        response = client.post("/chat", json={"message": "hello"})
        assert response.status_code == 200
        assert response.json()["response"] == "Recovered seamlessly via fallback model!"
        assert mock_gemini.models.generate_content.call_count == 2

