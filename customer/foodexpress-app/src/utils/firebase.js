import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configured using environment variables to prevent credentials exposure in source control
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDObSaqWMp_rKvyuUUwJHGqi6haPfSMJ80",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "foodexpress-74a7f.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "foodexpress-74a7f",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "foodexpress-74a7f.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "215877724329",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:215877724329:android:9cd4bab7c879dad8e761b8"
};

let app;
let auth;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    app = getApp();
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} catch (error) {
  console.log("Firebase initialization error:", error);
}

export { app, auth };
