import React, { useState, useEffect } from "react";
import { StatusBar, Platform, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

if (Platform.OS === "web") {
  const originalWarn = console.warn;
  console.warn = function (...args) {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      (args[0].includes("props.pointerEvents is deprecated") ||
        args[0].includes("Cannot record touch end without a touch start"))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  const originalCreate = StyleSheet.create;
  StyleSheet.create = function (styles) {
    const newStyles = {};
    for (const key in styles) {
      if (Object.prototype.hasOwnProperty.call(styles, key)) {
        const style = styles[key];
        if (style && typeof style === "object") {
          if (
            style.shadowColor !== undefined ||
            style.shadowOpacity !== undefined ||
            style.shadowRadius !== undefined ||
            style.shadowOffset !== undefined
          ) {
            const shadowColor = style.shadowColor || "rgba(0,0,0,0.2)";
            const shadowOpacity = style.shadowOpacity !== undefined ? style.shadowOpacity : 1;
            let offsetX = 0;
            let offsetY = 0;
            if (style.shadowOffset && typeof style.shadowOffset === "object") {
              offsetX = style.shadowOffset.width || 0;
              offsetY = style.shadowOffset.height || 0;
            }
            const shadowRadius = style.shadowRadius !== undefined ? style.shadowRadius : 0;
            const hexToRgba = (hex, alpha = 1) => {
              if (!hex || !hex.startsWith("#")) return hex || "rgba(0,0,0,0.2)";
              let c = hex.substring(1);
              if (c.length === 3) {
                c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
              }
              const num = parseInt(c, 16);
              return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
            };
            const shadowColorWithOpacity = hexToRgba(shadowColor, shadowOpacity);
            style.boxShadow = `${offsetX}px ${offsetY}px ${shadowRadius}px ${shadowColorWithOpacity}`;
            delete style.shadowColor;
            delete style.shadowOffset;
            delete style.shadowOpacity;
            delete style.shadowRadius;
          }
        }
        newStyles[key] = style;
      }
    }
    return originalCreate(newStyles);
  };
}
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Provider as PaperProvider, MD3DarkTheme } from "react-native-paper";

// Screens
import LoginScreen from "./screens/Auth/LoginScreen";
import DashboardScreen from "./screens/Dashboard/DashboardScreen";
import OrderDetailsScreen from "./screens/Order/OrderDetailsScreen";
import DeliveryHistoryScreen from "./screens/History/DeliveryHistoryScreen";
import ProfileScreen from "./screens/Profile/ProfileScreen";

export const AuthContext = React.createContext();

const Stack = createStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("rider_token");
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ signIn: () => setIsAuthenticated(true), signOut: () => setIsAuthenticated(false) }}>
      <PaperProvider theme={MD3DarkTheme}>
        <NavigationContainer theme={MD3DarkTheme}>
          <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
              <>
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
                <Stack.Screen name="DeliveryHistory" component={DeliveryHistoryScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </AuthContext.Provider>
  );
}
