import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL;
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  if (__DEV__) {
    if (Platform.OS === "web") {
      return "http://localhost:5000/api";
    }
    return "http://10.84.254.127:5000/api";
  }
  return "https://cloudkitchen.aparaitech.org/api";
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
    const isAuthEndpoint =
      url.includes("/auth/me") ||
      url.includes("/auth/verify") ||
      url.includes("/auth/refresh");

    if (status === 401 && isAuthEndpoint) {
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
    // For all other errors (including 401 on payment/orders/QR with dummy token),
    // simply propagate the error so the screen can show a message and retry.
    const message =
      error.response?.data?.message || error.message || "API request failed";
    return Promise.reject(new Error(message));
  },
);

export default api;
