/**
 * LocationCheckingScreen.js
 *
 * Shown while useLocationGate is running the GPS check.
 * Replaces the role of the old SplashScreen's "detecting location" state.
 * Used ONLY by LocationGate — not navigable.
 */
import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const LocationCheckingScreen = () => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Spin the icon
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing dots
    const dotLoop = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();

    dotLoop(dotAnim1, 0);
    dotLoop(dotAnim2, 200);
    dotLoop(dotAnim3, 400);
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        {/* Logo block */}
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>FE</Text>
        </View>
        <Text style={styles.appName}>FoodExpress</Text>
        <Text style={styles.tagline}>Premium Food Delivery</Text>

        {/* Spinner row */}
        <View style={styles.statusRow}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialCommunityIcons name="map-marker-radius" size={18} color="#FF6F61" />
          </Animated.View>
          <Text style={styles.statusText}>Detecting location</Text>
          <Animated.Text style={[styles.dot, { opacity: dotAnim1 }]}>.</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dotAnim2 }]}>.</Animated.Text>
          <Animated.Text style={[styles.dot, { opacity: dotAnim3 }]}>.</Animated.Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    alignItems: "center",
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "#FF6F61",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 6,
    shadowColor: "#FF6F61",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  appName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1D2939",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 4,
    marginBottom: 40,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
    marginLeft: 6,
  },
  dot: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FF6F61",
    lineHeight: 18,
  },
});

export default LocationCheckingScreen;
