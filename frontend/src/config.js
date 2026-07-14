const PRODUCTION_RENDER_URL = "http://localhost:5000";

const getApiBaseURL = () => {
  // Explicit env override (highest priority)
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }

  if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
    return "/api";
  }

  return `${PRODUCTION_RENDER_URL}/api`;
};

export const API_BASE_URL = getApiBaseURL();
console.log("[Admin] API_BASE_URL resolved to:", API_BASE_URL);
