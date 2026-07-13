import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const getBaseURL = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || "https://food-delivery-gtq0.onrender.com";
  
  if (Platform.OS === "web") {
    const url = envUrl || "http://localhost:5000";
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  
  const url = envUrl;
  return url.endsWith("/api") ? url : `${url}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("foodexpress_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

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
