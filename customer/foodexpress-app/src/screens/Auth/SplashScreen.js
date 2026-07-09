import React, { useEffect } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { Text, Avatar, ActivityIndicator } from "react-native-paper";
import { useSelector } from "react-redux";

const SplashScreen = ({ navigation }) => {
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    // Simulating app loading and checking user login state
    const timer = setTimeout(() => {
      navigation.replace("Main");
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Avatar.Text size={110} label="FE" style={styles.logo} labelStyle={styles.logoText} />
      
      <Text style={styles.title}>FoodExpress</Text>
      <Text style={styles.subtitle}>Premium Food Delivery</Text>
      
      <View style={styles.loaderContainer}>
        <ActivityIndicator color="#FF6F61" size="small" />
        <Text style={styles.loaderText}>Loading menu...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: {
    backgroundColor: "#FF6F61",
    width: 110,
    height: 110,
    marginBottom: 24,
    borderRadius: 32,
    elevation: 4,
    shadowColor: "#FF6F61",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "900",
  },
  title: {
    fontSize: 26,
    fontWeight: "950",
    color: "#1F2A37",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 6,
  },
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "absolute",
    bottom: 60,
  },
  loaderText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#9CA3AF",
  },
});

export default SplashScreen;
