// Centralized backend and WebSocket configuration for local dev and live cloud deployment (Render + Vercel)

const rawBackend = 
  import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.DEV ? "http://localhost:8000" : "https://smart-farming-rgm.onrender.com");

export const BACKEND_URL = rawBackend.replace(/\/+$/, "");

export const WS_BACKEND_URL = import.meta.env.VITE_WS_URL
  ? import.meta.env.VITE_WS_URL.replace(/\/+$/, "")
  : BACKEND_URL.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");

export const API_BASE = `${BACKEND_URL}/api`;
export const WS_DB_EVENTS = `${WS_BACKEND_URL}/ws/db-events`;
