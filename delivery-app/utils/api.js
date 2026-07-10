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
    return "http://192.168.1.37:5000/api";
  }
  return "https://food-delivery-gtq.onrender.com/api";
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
