import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL;
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  if (process.env.VITE_API_URL) {
    const url = process.env.VITE_API_URL;
    return url.endsWith("/api") ? url : `${url}/api`;
  }
  if (Platform.OS === "web") {
    return "http://localhost:5000/api";
  }
  return "http://192.168.1.26:5000/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("rider_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 401) {
      await AsyncStorage.removeItem("rider_token");
      await AsyncStorage.removeItem("rider_user");
    }

    console.warn("=== API REQUEST FAILURE ===");
    console.warn("API URL:", error.config?.url || "");
    console.warn("Method:", error.config?.method?.toUpperCase() || "");
    console.warn("Request Data:", error.config?.data || "N/A");
    console.warn("Response Status Code:", error.response?.status || "N/A");
    console.warn("Response Data:", JSON.stringify(error.response?.data) || "N/A");
    console.warn("Backend Error:", error.response?.data?.message || error.message || "Unknown error");
    console.warn("===========================");

    const message = error.response?.data?.message || error.message || "API request failed";
    return Promise.reject(new Error(message));
  }
);

export default api;
