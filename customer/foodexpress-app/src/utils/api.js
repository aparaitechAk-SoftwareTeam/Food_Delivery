import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const DEFAULT_REMOTE_API = "https://food-delivery-gtq0.onrender.com/api";

const normalizeApiUrl = (url) => {
  if (!url) return null;
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const isPrivateLanUrl = (url) => {
  try {
    const { hostname } = new URL(url);
    return (
      /^192\.168\.\d+\.\d+$/.test(hostname) ||
      /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
    );
  } catch (error) {
    return false;
  }
};

const getBaseURLs = () => {
  const configuredUrl = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
  const urls = [];

  if (Platform.OS === "web" && configuredUrl && isPrivateLanUrl(configuredUrl)) {
    const port = new URL(configuredUrl).port || "5000";
    urls.push(normalizeApiUrl(`http://localhost:${port}`));
  }

  if (configuredUrl) {
    urls.push(configuredUrl);
  }

  if (Platform.OS === "android") {
    urls.push("http://10.0.2.2:5000/api");
  }

  urls.push(DEFAULT_REMOTE_API);

  return [...new Set(urls.filter(Boolean))];
};

const API_BASE_URLS = getBaseURLs();
const BASE_URL = API_BASE_URLS[0];

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
    const originalConfig = error.config || {};
    const hasNoResponse = !error.response;
    const currentBaseURL = originalConfig.baseURL || api.defaults.baseURL;
    const currentIndex = Math.max(API_BASE_URLS.indexOf(currentBaseURL), originalConfig.__baseURLRetryIndex || 0);
    const nextBaseURL = API_BASE_URLS[currentIndex + 1];

    if (hasNoResponse && nextBaseURL) {
      originalConfig.__baseURLRetryIndex = currentIndex + 1;
      originalConfig.baseURL = nextBaseURL;
      api.defaults.baseURL = nextBaseURL;
      return api(originalConfig);
    }

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
