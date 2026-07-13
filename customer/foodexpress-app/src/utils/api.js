import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const RENDER_API_URL = "https://food-delivery-gtq0.onrender.com";

const getBaseURL = () => {
  // Check env variable first — works on all platforms
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL;
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  // Web fallback: use production Render URL (not localhost, which only works locally)
  if (Platform.OS === "web") {
    return `${RENDER_API_URL}/api`;
  }
  // Native fallback: use local network IP for development
  return "http://192.168.1.26:5000/api";
};

const BASE_URL = getBaseURL();
console.log(`[API] Initializing Axios with baseURL: ${BASE_URL} | Platform: ${Platform.OS}`);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("foodexpress_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const fullURL = `${config.baseURL || BASE_URL}${config.url}`;
  console.log(`[API] --> ${config.method?.toUpperCase()} ${fullURL}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API] <-- ${response.status} ${response.config?.url}`);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const fullURL = `${error.config?.baseURL || BASE_URL}${url}`;

    // Only force-logout when the session token itself is invalid,
    // i.e. a 401 response from an AUTH endpoint (/auth/me, /auth/verify, etc.).
    // Do NOT logout on 401 from payment, order, or other data endpoints —
    // that was the root cause of the checkout → logout → location loop.
    const isAuthEndpoint = url.includes("/auth/");
    const message = error.response?.data?.message || "";
    const isBlocked = message.toLowerCase().includes("blocked");
    const isTokenInvalid = message === "Token is not valid" || message === "Not authorized" || message === "jwt expired";

    if (status === 401 && (isAuthEndpoint || isBlocked || isTokenInvalid)) {
      await AsyncStorage.removeItem("foodexpress_token");
      await AsyncStorage.removeItem("foodexpress_user");
      await AsyncStorage.removeItem("foodexpress_active_address");
      try {
        const { store } = require("../redux/store");
        const { logout } = require("../redux/slices/authSlice");
        store.dispatch(logout());
      } catch (e) {
        console.log("Error dispatching logout on 401:", e);
      }
    }

    // Detailed error logging
    console.warn("=== API REQUEST FAILURE ===");
    console.warn("Full Request URL:", fullURL);
    console.warn("Endpoint Path:", url);
    console.warn("Method:", error.config?.method?.toUpperCase() || "");
    console.warn("Request Data:", error.config?.data || "N/A");
    console.warn("Response Status Code:", status || "N/A (Network Error / Timeout)");
    console.warn("Response Data:", JSON.stringify(error.response?.data) || "N/A");
    console.warn("Backend Error:", error.response?.data?.message || error.message || "Unknown error");
    if (error.code === "ECONNABORTED") {
      console.warn("Error Type: TIMEOUT — server took too long to respond");
    } else if (!error.response) {
      console.warn("Error Type: NETWORK ERROR — no response received (check CORS / server reachability)");
    } else if (status === 0 || error.message?.includes("Mixed Content")) {
      console.warn("Error Type: MIXED CONTENT — HTTP request blocked on HTTPS page");
    }
    console.warn("===========================");

    const responseMessage = error.response?.data?.message || error.message || "API request failed";
    return Promise.reject(new Error(responseMessage));
  },
);

export default api;
