import React, { useState, useRef, useEffect } from "react";
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
import { Text, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SERVICE_CONFIG } from "../../constants/serviceConfig";

const { width, height } = Dimensions.get("window");

// Food collage images
const COLLAGE = [
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80",
];

const ServiceNotAvailableScreen = ({ onChooseAnother, onUseCurrentLocation }) => {
  const [gpsLoading, setGpsLoading] = useState(false);

  // ── Animations ────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const pulsAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulsAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulsAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleGPSPress = async () => {
    setGpsLoading(true);
    try {
      await onUseCurrentLocation();
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Collage Illustration ────────────────────────────────────────── */}
      <View style={styles.collageWrapper}>
        <Animated.View style={[styles.card, styles.cardLeft, { opacity: card1Anim }]}>
          <Image source={{ uri: COLLAGE[0] }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardBlur} />
        </Animated.View>
        <Animated.View style={[styles.card, styles.cardRight, { opacity: card2Anim }]}>
          <Image source={{ uri: COLLAGE[1] }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardBlur} />
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardCenter, { opacity: card3Anim }]}>
          <Image source={{ uri: COLLAGE[2] }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.pinOverlay}>
            <Animated.View style={{ transform: [{ scale: pulsAnim }] }}>
              <View style={styles.pinCircle}>
                <MaterialCommunityIcons name="map-marker-off" size={28} color="#D92D20" />
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
        <Text style={styles.title}>Service Not Available</Text>
        <Text style={styles.subtitle}>
          We currently deliver only in{" "}
          <Text style={styles.highlight}>{SERVICE_CONFIG.zoneName}</Text>.
        </Text>
        <Text style={styles.instruction}>
          Your selected location is outside our delivery area.
        </Text>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onChooseAnother}
          activeOpacity={0.85}
          disabled={gpsLoading}
        >
          <MaterialCommunityIcons
            name="map-search-outline"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.primaryBtnText}>Choose Another Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleGPSPress}
          activeOpacity={0.75}
          disabled={gpsLoading}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#FF6F61" style={{ marginRight: 8 }} />
          ) : (
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={18}
              color="#FF6F61"
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={styles.secondaryBtnText}>
            {gpsLoading ? "Checking GPS..." : "Use Current Location"}
          </Text>
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
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 24,
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
    fontSize: 15,
    color: "#475467",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  instruction: {
    fontSize: 13.5,
    color: "#667085",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  highlight: {
    color: "#FF6F61",
    fontWeight: "800",
  },
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
    borderColor: "#FF6F61",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF6F61",
  },
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

export default ServiceNotAvailableScreen;
