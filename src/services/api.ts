const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const generateItinerary = async (data: any) => {
  const response = await fetch(`${API_BASE_URL}/generate-itinerary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to generate itinerary");
  }
  return response.json();
};

export const chatWithAssistant = async (message: string, history: any[]) => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, history }),
  });
  if (!response.ok) {
    throw new Error("Failed to communicate with assistant");
  }
  return response.json();
};

export const arScanImage = async (imageBase64: string) => {
  const response = await fetch(`${API_BASE_URL}/ar-scanner`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: imageBase64 }),
  });
  if (!response.ok) {
    throw new Error("Failed to scan image");
  }
  return response.json();
};

export const vrScanLocation = async (location: string) => {
  const response = await fetch(`${API_BASE_URL}/vr-scan-location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location }),
  });
  if (!response.ok) throw new Error("Failed to scan location");
  return response.json();
};

export const translateText = async (text: string, targetLanguage: string) => {
  const response = await fetch(`${API_BASE_URL}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target_language: targetLanguage }),
  });
  if (!response.ok) throw new Error("Failed to translate text");
  return response.json();
};

export const getOdiaSpeech = async (text: string) => {
  const response = await fetch(`${API_BASE_URL}/tts-odia`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target_language: "Odia" }),
  });
  if (!response.ok) throw new Error("Failed to generate speech");
  return response.blob();
};

export const getFestivals = async (location: string) => {
  const response = await fetch(`${API_BASE_URL}/festivals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ location }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch festivals");
  }
  return response.json();
};

export const getRiskPrediction = async (location: string) => {
  const response = await fetch(`${API_BASE_URL}/risk-prediction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ location }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch risk data");
  }
  return response.json();
};

export const getRouteTracking = async (origin: string, destination: string) => {
  const response = await fetch(`${API_BASE_URL}/route-tracking`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ origin, destination }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch tracking data");
  }
  return response.json();
};

export const getMapPlaces = async (location: string) => {
  const response = await fetch(`${API_BASE_URL}/map-places`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ location }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch map data");
  }
  return response.json();
};

export const suggestDestination = async (lat: number, lng: number) => {
  const response = await fetch(`${API_BASE_URL}/suggest-destination`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lat, lng }),
  });
  if (!response.ok) {
    throw new Error("Failed to suggest destination");
  }
  return response.json();
};
