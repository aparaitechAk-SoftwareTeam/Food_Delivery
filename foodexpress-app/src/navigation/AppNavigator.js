import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

import SplashScreen from "../screens/Auth/SplashScreen";
import OnboardingScreen from "../screens/Auth/OnboardingScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import CartScreen from "../screens/Cart/CartScreen";
import OrdersScreen from "../screens/Orders/OrdersScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import WishlistScreen from "../screens/Wishlist/WishlistScreen";
import NotificationsScreen from "../screens/Notifications/NotificationsScreen";
import FoodListingScreen from "../screens/Food/FoodListingScreen";
import FoodDetailsScreen from "../screens/Food/FoodDetailsScreen";
import CheckoutScreen from "../screens/Checkout/CheckoutScreen";
import SearchScreen from "../screens/Search/SearchScreen";
import OrderDetailsScreen from "../screens/OrderDetails/OrderDetailsScreen";
import OrderTrackingScreen from "../screens/OrderTracking/OrderTrackingScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const { token } = useSelector((state) => state.auth);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#22C55E",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: { height: 64, paddingBottom: 8 },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="magnify"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!token) {
              e.preventDefault();
              navigation.navigate("Login", { redirectTo: "Main", redirectTab: "Orders" });
            }
          },
        })}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="clipboard-list-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!token) {
              e.preventDefault();
              navigation.navigate("Login", { redirectTo: "Main", redirectTab: "Wishlist" });
            }
          },
        })}
        options={{
          tabBarBadge: wishlistItems.length > 0 ? wishlistItems.length : undefined,
          tabBarBadgeStyle: { backgroundColor: "#22C55E", color: "#fff", fontSize: 10 },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="heart-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!token) {
              e.preventDefault();
              navigation.navigate("Login", { redirectTo: "Main", redirectTab: "Profile" });
            }
          },
        })}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const scheme = useColorScheme();

  return (
    <NavigationContainer theme={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="FoodListing" component={FoodListingScreen} />
        <Stack.Screen name="FoodDetails" component={FoodDetailsScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen
          name="OrderDetails"
          component={OrderDetailsScreen}
          options={{
            headerShown: true,
            title: "Order Details",
            headerTintColor: "#22C55E",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        />
        <Stack.Screen
          name="OrderTracking"
          component={OrderTrackingScreen}
          options={{
            headerShown: true,
            title: "Track Order",
            headerTintColor: "#22C55E",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
