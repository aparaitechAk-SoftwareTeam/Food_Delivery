import "./patchStyles";
import React, { useState, useEffect } from "react";
import { StatusBar, Platform, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
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
