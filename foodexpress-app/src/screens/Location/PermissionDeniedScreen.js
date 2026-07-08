/**
 * PermissionDeniedScreen.js
 *
 * Full-screen shown when the user denies location permission.
 * Provides clear instructions and two action buttons:
 *  - Enable Location → opens device settings
 *  - Retry           → re-runs the location gate check
 */
import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

const { width } = Dimensions.get("window");

const PermissionDeniedScreen = ({ onRetry, onOpenSettings }) => {
  // ── Entrance animation ────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Icon */}
        <Animated.View
          style={[
            styles.iconWrapper,
            { transform: [{ scale: iconScaleAnim }] },
          ]}
        >
          {/* Outer ring */}
          <View style={styles.iconRingOuter} />
          <View style={styles.iconRingInner} />
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="map-marker-off"
              size={52}
              color="#D92D20"
            />
          </View>
        </Animated.View>

        {/* Text */}
        <Text style={styles.title}>Location Access Required</Text>
        <Text style={styles.message}>
          FoodExpress needs your location to check if we deliver to your area.
          Please enable location permission to continue.
        </Text>

        {/* Steps */}
        <View style={styles.stepsBox}>
          <Step number="1" text="Tap 'Enable Location' below" />
          <Step number="2" text='Select "While Using the App"' />
          <Step number="3" text="Come back and tap Retry" />
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onOpenSettings}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.primaryBtnText}>Enable Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onRetry}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={18}
            color="#FF6F61"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.secondaryBtnText}>Retry</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <MaterialCommunityIcons name="shield-lock-outline" size={13} color="#9CA3AF" />
        <Text style={styles.footerText}>
          {" "}Your location is used only to verify the service area
        </Text>
      </View>
    </SafeAreaView>
  );
};

const Step = ({ number, text }) => (
  <View style={styles.stepRow}>
    <View style={styles.stepBadge}>
      <Text style={styles.stepBadgeText}>{number}</Text>
    </View>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  // Icon
  iconWrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  iconRingOuter: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FEF3F2",
  },
  iconRingInner: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FEE4E2",
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#D92D20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  // Text
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1D2939",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: "#667085",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  // Steps
  stepsBox: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#F2F4F7",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF6F61",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  stepText: {
    fontSize: 13,
    color: "#344054",
    fontWeight: "600",
    flex: 1,
  },
  // Buttons
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6F61",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#FF6F61",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FF6F61",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF6F61",
  },
  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
});

export default PermissionDeniedScreen;
