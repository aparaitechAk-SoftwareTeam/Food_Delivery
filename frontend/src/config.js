// Configuration for dynamic API Base URL
//
// Priority:
//   1. VITE_API_URL / VITE_API_BASE_URL (set in .env or Vercel project settings)
//   2. Relative "/api" path – works when deployed on Vercel because vercel.json
//      proxies /api/* → https://food-delivery-gtq0.onrender.com/api/*
//      This removes CORS entirely since browser sees the same origin.
//   3. Local fallback for development

const PRODUCTION_RENDER_URL = "https://food-delivery-gtq0.onrender.com";

const getApiBaseURL = () => {
  // Explicit env override (highest priority)
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }

  // In a browser on Vercel production (hostname is not localhost) — use relative path
  // so the vercel.json rewrite proxy forwards to Render without CORS issues.
  if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
    return "/api";
  }

  // Local development fallback
  return `${PRODUCTION_RENDER_URL}/api`;
};

export const API_BASE_URL = getApiBaseURL();
console.log("[Admin] API_BASE_URL resolved to:", API_BASE_URL);
