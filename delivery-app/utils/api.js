import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const getBaseURL = () => {
  // Use development machine IP or fallback
  if (__DEV__) {
    if (Platform.OS === "web") {
      return "http://localhost:5000/api";
    }
    // Hardcoded current developer IP matching customer app config
    return "http://10.84.254.127:5000/api";
  }
  return "https://api.foodexpress.example.com/api";
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
    const message = error.response?.data?.message || error.message || "API request failed";
    return Promise.reject(new Error(message));
  }
);

export default api;
