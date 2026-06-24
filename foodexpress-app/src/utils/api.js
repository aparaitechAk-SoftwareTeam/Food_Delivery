import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const getBaseURL = () => {
  if (__DEV__) {
    // In development mode, point to the local backend port 5000
    // Android emulator requires 10.0.2.2, iOS and Web can use localhost (or 127.0.0.1)
    const host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
    return `http://${host}:5000/api`;
  }
  return "https://api.foodexpress.example.com/api";
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
  (error) => {
    const message =
      error.response?.data?.message || error.message || "API request failed";
    return Promise.reject(new Error(message));
  },
);

export default api;
