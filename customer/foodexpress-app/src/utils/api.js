import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const DEFAULT_REMOTE_API = "https://food-delivery-ywd0.onrender.com/api";

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
  const isDev = typeof __DEV__ !== "undefined" && __DEV__;

  // 1. If we have a configured URL, prioritize it
  if (configuredUrl) {
    urls.push(configuredUrl);
  }

  // 2. Add local development server URLs as fallbacks/alternatives in dev mode
  if (isDev || !configuredUrl || configuredUrl.includes("localhost") || configuredUrl.includes("127.0.0.1")) {
    if (Platform.OS === "web") {
      urls.push("http://localhost:5000/api");
      urls.push("http://127.0.0.1:5000/api");
    } else if (Platform.OS === "android") {
      urls.push("http://10.0.2.2:5000/api");
    } else {
      // iOS Simulator or others
      urls.push("http://localhost:5000/api");
    }
  }

  // 3. Add default remote API as a last resort
  urls.push(DEFAULT_REMOTE_API);

  return [...new Set(urls.filter(Boolean))];
};

const API_BASE_URLS = getBaseURLs();

const api = axios.create({
  baseURL: API_BASE_URLS[0],
  timeout: 35000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("foodexpress_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = parts[1];
    
    // Base64 decode using pure JS to support all React Native environments safely
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = String(payload).replace(/[-_]/g, (char) => char === '-' ? '+' : '/');
    while (str.length % 4) {
      str += '=';
    }
    let output = '';
    for (let bc = 0, bs = 0, idx = 0; idx < str.length; ) {
      const char = str.charAt(idx++);
      const r2 = chars.indexOf(char);
      if (r2 === -1) continue;
      bs = bc % 4 ? bs * 64 + r2 : r2;
      if (bc++ % 4) {
        output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
      }
    }
    const { exp } = JSON.parse(output);
    if (exp) {
      return Date.now() >= exp * 1000;
    }
    return false;
  } catch (e) {
    return true;
  }
};

api.interceptors.response.use(
  (response) => response,
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
    const message = error.response?.data?.message || "";

    // ─── 401 Unauthorized Response Handling ───
    if (status === 401) {
      const token = await AsyncStorage.getItem("foodexpress_token");
      const expired = isTokenExpired(token);

      if (expired) {
        console.warn(`[Auth Interceptor] JWT Token has expired. Performing force-logout. Token present: ${!!token}`);
        await AsyncStorage.removeItem("foodexpress_token");
        await AsyncStorage.removeItem("foodexpress_user");
        await AsyncStorage.removeItem("foodexpress_active_address");
        try {
          const { store } = require("../redux/store");
          const { logout } = require("../redux/slices/authSlice");
          store.dispatch(logout());
        } catch (e) {
          console.warn("Error dispatching logout on expired token:", e);
        }
      } else {
        // Token is NOT expired. Try retrying the request once.
        if (!originalConfig._retry) {
          originalConfig._retry = true;
          console.log(`[Auth Interceptor] 401 received but token is still active. Retrying request: ${url}`);
          if (token) {
            originalConfig.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalConfig);
        }

        // Retry also failed, or the backend explicitly validated and rejected the active token
        const isAuthEndpoint = url.includes("/auth/");
        const isBlocked = message.toLowerCase().includes("blocked");
        const isTokenInvalid = message === "Token is not valid" || message === "Not authorized" || message === "jwt expired";

        if (isAuthEndpoint || isBlocked || isTokenInvalid) {
          console.warn(`[Auth Interceptor] Session invalidation confirmed by backend on endpoint: ${url}. Logging out.`);
          await AsyncStorage.removeItem("foodexpress_token");
          await AsyncStorage.removeItem("foodexpress_user");
          await AsyncStorage.removeItem("foodexpress_active_address");
          try {
            const { store } = require("../redux/store");
            const { logout } = require("../redux/slices/authSlice");
            store.dispatch(logout());
          } catch (e) {
            console.warn("Error dispatching logout on confirmed invalid session:", e);
          }
        } else {
          console.log(`[Auth Interceptor] 401 returned from non-critical data endpoint: ${url}. Suppressing automatic logout.`);
        }
      }
    }

    console.warn("=== API REQUEST FAILURE ===");
    console.warn("API URL:", error.config?.url || "");
    console.warn("Method:", error.config?.method?.toUpperCase() || "");
    console.warn("Request Data:", error.config?.data || "N/A");
    console.warn("Response Status Code:", error.response?.status || "N/A");
    console.warn("Response Data:", JSON.stringify(error.response?.data) || "N/A");
    console.warn("Backend Error:", error.response?.data?.message || error.message || "Unknown error");
    console.warn("===========================");

    const responseMessage = error.response?.data?.message || error.message || "API request failed";
    return Promise.reject(new Error(responseMessage));
  },
);

export default api;
