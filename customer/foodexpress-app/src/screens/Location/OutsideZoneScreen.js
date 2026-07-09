/**
 * OutsideZoneScreen.js
 *
 * Full-screen shown when the user's GPS location is outside the Baramati
 * service area. Styled similar to Swiggy/Zomato's service unavailable screen.
 *
 * Props:
 *   cityName      — detected city from reverse-geocode
 *   onRetry       — re-runs the full location check
 *   onOpenSettings— opens device location settings
 */
import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  Image,
  TouchableOpacity,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SERVICE_CONFIG } from "../../constants/serviceConfig";

const { width, height } = Dimensions.get("window");

// Food collage images (Unsplash, no auth needed)
const COLLAGE = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80",
];

const OutsideZoneScreen = ({ cityName, onRetry, onOpenSettings }) => {
  // ── Animations ────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const pulsAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Stagger cards + fade content
    Animated.sequence([
      Animated.parallel([
        Animated.timing(card1Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(card2Anim, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
        Animated.timing(card3Anim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulse the map-marker icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulsAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulsAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const displayCity = cityName && cityName.trim() ? cityName.trim() : "your area";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Collage Illustration ────────────────────────────────────────── */}
      <View style={styles.collageWrapper}>
        {/* Faded background cards */}
        <Animated.View style={[styles.card, styles.cardLeft, { opacity: card1Anim }]}>
          <Image source={{ uri: COLLAGE[0] }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardBlur} />
        </Animated.View>
        <Animated.View style={[styles.card, styles.cardRight, { opacity: card2Anim }]}>
          <Image source={{ uri: COLLAGE[1] }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardBlur} />
        </Animated.View>

        {/* Foreground card */}
        <Animated.View style={[styles.card, styles.cardCenter, { opacity: card3Anim }]}>
          <Image source={{ uri: COLLAGE[2] }} style={styles.cardImage} resizeMode="cover" />
          {/* Map pin overlay */}
          <View style={styles.pinOverlay}>
            <Animated.View style={{ transform: [{ scale: pulsAnim }] }}>
              <View style={styles.pinCircle}>
                <MaterialCommunityIcons name="map-marker" size={28} color="#D92D20" />
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Detected city badge */}
        {cityName ? (
          <View style={styles.cityBadge}>
            <MaterialCommunityIcons name="near-me" size={12} color="#D92D20" />
            <Text style={styles.cityBadgeText}> {displayCity}</Text>
          </View>
        ) : null}

        <Text style={styles.title}>Service Not Available</Text>
        <Text style={styles.subtitle}>
          We currently serve only{" "}
          <Text style={styles.highlight}>{SERVICE_CONFIG.zoneName}</Text>.{"\n"}
          {displayCity !== "your area"
            ? `${displayCity} is outside our delivery area.`
            : "Your current location is outside our delivery area."}
        </Text>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onRetry}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.primaryBtnText}>Retry Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onOpenSettings}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={18}
            color="#667085"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.secondaryBtnText}>Open Device Settings</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>WE'RE CURRENTLY LIVE IN</Text>
        <Text style={styles.footerAreas}>
          {SERVICE_CONFIG.liveAreas.join("  •  ")}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // ── Collage ──────────────────────────────────────────────────────────────
  collageWrapper: {
    height: height * 0.32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginTop: 20,
  },
  card: {
    position: "absolute",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFF",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardLeft: {
    width: 110,
    height: 130,
    left: width * 0.06,
    transform: [{ rotate: "-14deg" }],
    zIndex: 1,
  },
  cardRight: {
    width: 110,
    height: 130,
    right: width * 0.06,
    transform: [{ rotate: "14deg" }],
    zIndex: 1,
  },
  cardCenter: {
    width: 130,
    height: 150,
    zIndex: 3,
    elevation: 10,
    shadowOpacity: 0.16,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  pinCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },

  // ── Main Content ─────────────────────────────────────────────────────────
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  cityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3F2",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  cityBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D92D20",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1D2939",
    textAlign: "center",
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14.5,
    color: "#667085",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 28,
  },
  highlight: {
    color: "#FF6F61",
    fontWeight: "800",
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
    shadowOpacity: 0.28,
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
    borderColor: "#E5E7EB",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#667085",
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 28 : 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F7",
    marginHorizontal: 24,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9CA3AF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  footerAreas: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default OutsideZoneScreen;
