import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Image, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  useDerivedValue,
  withDelay,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Scooter Image dimensions preserving aspect ratio
const SCOOTER_WIDTH = 270;
const SCOOTER_HEIGHT = 240;

const riderImage = require("../../assets/foodexpress_rider.png");

export default function AnimatedSplash() {
  // --- Shared Values (Animations) ---
  const containerOpacity = useSharedValue(0);

  // Logo entrance
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.95);

  // Background elements
  const glowScale = useSharedValue(0.9);
  
  // Parallax background particles
  const particle1X = useSharedValue(SCREEN_WIDTH + 20);
  const particle2X = useSharedValue(SCREEN_WIDTH + 20);
  const particle3X = useSharedValue(SCREEN_WIDTH + 20);

  // Scooter position along the screen:
  // Starts off-screen left and drives to the center
  const scooterTranslateX = useSharedValue(-SCREEN_WIDTH / 2 - 200);
  
  // Scooter physical squeeze, drift and vibration wiggles
  const scooterSqueezeY = useSharedValue(0);
  const scooterDriftX = useSharedValue(0);
  const scooterVibrateY = useSharedValue(0);
  const scooterVibrateRotate = useSharedValue(0);

  // Headlight beam pulsing
  const headlightOpacity = useSharedValue(0.5);

  // Asphalt road dashes offset
  const roadDashesOffset = useSharedValue(0);

  // Bottom Map Pin Loader
  const pinBounceY = useSharedValue(0);

  // --- Derived Values (Synchronized Physics) ---
  
  // Total horizontal translation combining entrance, drift, and vibration
  const finalScooterTranslateX = useDerivedValue(() => {
    return scooterTranslateX.value + scooterDriftX.value;
  });

  // Vertical wiggles and landing squash compression
  const finalScooterTranslateY = useDerivedValue(() => {
    return scooterVibrateY.value + scooterSqueezeY.value;
  });

  // Scale Y squashing/stretching for the bounce and squeeze settle
  const scooterScaleY = useDerivedValue(() => {
    // Squeezing down 5px scales Y down slightly, rebounding stretches it up
    return 1 - (scooterSqueezeY.value / 120);
  });

  // Settle shadow width scale (shadow squashes/stretches with vertical bounce/squeeze)
  const shadowScaleX = useDerivedValue(() => {
    return 1 + (scooterSqueezeY.value / 120);
  });

  const pinShadowScale = useDerivedValue(() => {
    // Inverse phase shadow scale: as pin bounces up (-12px), shadow scales down (0.6)
    return 1.0 + (pinBounceY.value / 24);
  });

  const pinShadowOpacity = useDerivedValue(() => {
    // Inverse phase shadow opacity: as pin bounces up (-12px), shadow fades out (0.15)
    return 0.4 + (pinBounceY.value / 40);
  });

  useEffect(() => {
    // --- 0.0s: Background and fade-ins trigger ---
    containerOpacity.value = withTiming(1, { duration: 300, easing: Easing.linear });

    // Header logo & tagline entry choreography
    logoOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 800, easing: Easing.bezier(0.25, 1, 0.5, 1) })
    );
    logoScale.value = withDelay(
      200,
      withTiming(1.0, { duration: 800, easing: Easing.bezier(0.25, 1, 0.5, 1) })
    );

    // Center pulsing glow ring animation
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.9, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Three orange background particles drifting slowly right-to-left at different parallax speeds
    particle1X.value = withRepeat(
      withTiming(-50, { duration: 3500, easing: Easing.linear }),
      -1,
      false
    );
    particle2X.value = withDelay(
      1000,
      withRepeat(
        withTiming(-50, { duration: 5000, easing: Easing.linear }),
        -1,
        false
      )
    );
    particle3X.value = withDelay(
      500,
      withRepeat(
        withTiming(-50, { duration: 6500, easing: Easing.linear }),
        -1,
        false
      )
    );

    // --- 0.0s to 1.6s: Scooter drives from left off-screen to center ---
    scooterTranslateX.value = withTiming(0, {
      duration: 1600,
      easing: Easing.bezier(0.16, 1, 0.3, 1), // Custom bezier timing curve
    }, (finished) => {
      if (finished) {
        // --- Deceleration Settle Squeeze ---
        // Squeezes down 5px, rebounds up -6px, and settles to 0px on stop
        scooterSqueezeY.value = withSequence(
          withTiming(5, { duration: 150, easing: Easing.quad }),
          withTiming(-6, { duration: 180, easing: Easing.quad }),
          withTiming(0, { duration: 220, easing: Easing.quad })
        );

        // --- Settle horizontal drift oscillation ---
        // 3px driftX to simulate wind resistance drift
        scooterDriftX.value = withRepeat(
          withSequence(
            withTiming(3, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
            withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        );
      }
    });

    // High-frequency engine vibration wiggles (vibrateY, vibrateRotate)
    scooterVibrateY.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 55, easing: Easing.linear }),
        withTiming(-0.8, { duration: 55, easing: Easing.linear })
      ),
      -1,
      true
    );

    scooterVibrateRotate.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 65, easing: Easing.linear }),
        withTiming(-0.4, { duration: 65, easing: Easing.linear })
      ),
      -1,
      true
    );

    // Headlight beam pulsing in opacity (0.5 to 0.85)
    headlightOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 700, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Scrolling asphalt road orange dashes moving right-to-left
    roadDashesOffset.value = withRepeat(
      withTiming(-60, { duration: 700, easing: Easing.linear }),
      -1,
      false
    );

    // Branded Location Pin Loader: bounces vertically (12px) in an infinite Bezier loop
    pinBounceY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 550, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) }),
        withTiming(0, { duration: 550, easing: Easing.bezier(0.55, 0.085, 0.68, 0.53) })
      ),
      -1,
      true
    );

    return () => {};
  }, []);

  // --- Animated Styles ---
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const particle1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: particle1X.value }],
  }));

  const particle2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: particle2X.value }],
  }));

  const particle3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: particle3X.value }],
  }));

  const mainScooterStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: finalScooterTranslateX.value },
      { translateY: finalScooterTranslateY.value },
      { scaleY: scooterScaleY.value },
      { rotate: `${scooterVibrateRotate.value}deg` },
    ],
  }));

  // Ghost motion blur trail 1 (12px offset)
  const ghost1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: finalScooterTranslateX.value - 12 },
      { translateY: finalScooterTranslateY.value },
      { scaleY: scooterScaleY.value },
      { rotate: `${scooterVibrateRotate.value}deg` },
    ],
    opacity: 0.3,
  }));

  // Ghost motion blur trail 2 (24px offset)
  const ghost2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: finalScooterTranslateX.value - 24 },
      { translateY: finalScooterTranslateY.value },
      { scaleY: scooterScaleY.value },
      { rotate: `${scooterVibrateRotate.value}deg` },
    ],
    opacity: 0.15,
  }));

  const headlightStyle = useAnimatedStyle(() => ({
    opacity: headlightOpacity.value,
  }));

  const roadShadowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: finalScooterTranslateX.value },
      { scaleX: shadowScaleX.value },
    ],
  }));

  const roadDashesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: roadDashesOffset.value }],
  }));

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pinBounceY.value }],
  }));

  const pinShadowStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: pinShadowScale.value }],
    opacity: pinShadowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Outer Vignette Layer */}
      <View style={styles.vignette} pointerEvents="none" />

      {/* Background Elements */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {/* Pulsing center glow ring */}
        <Animated.View style={[styles.glowRing, glowStyle]} />

        {/* Faint Abstract Curves (Native View borders) */}
        <View style={styles.abstractArc1} />
        <View style={styles.abstractArc2} />

        {/* 4 Diagonal Orange Speed Streaks (tilted at -30deg) */}
        <View style={[styles.speedStreak, { top: "12%", left: "15%" }]} />
        <View style={[styles.speedStreak, { top: "35%", left: "70%", width: 90 }]} />
        <View style={[styles.speedStreak, { top: "65%", left: "5%", width: 70 }]} />
        <View style={[styles.speedStreak, { top: "80%", left: "60%", width: 85 }]} />

        {/* Floating Particles (parallax drifting right-to-left) */}
        <Animated.View style={[styles.particle, { top: "25%", width: 6, height: 6 }, particle1Style]} />
        <Animated.View style={[styles.particle, { top: "45%", width: 4, height: 4 }, particle2Style]} />
        <Animated.View style={[styles.particle, { top: "72%", width: 5, height: 5 }, particle3Style]} />
      </View>

      {/* Header Area (Top-aligned, 90px padding) */}
      <View style={styles.headerArea}>
        <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
          
          {/* Slanted "FOOD" Row with 3 motion speed lines on the left */}
          <View style={styles.slantedRow}>
            <View style={styles.speedLinesContainer}>
              <View style={[styles.speedLine, { width: 28 }]} />
              <View style={[styles.speedLine, { width: 20 }]} />
              <View style={[styles.speedLine, { width: 14 }]} />
            </View>
            <Text style={styles.brandText}>FOOD</Text>
          </View>

          {/* Slanted "EXPRESS" Row with orange speed bar on the right */}
          <View style={[styles.slantedRow, { marginTop: 4 }]}>
            <Text style={[styles.brandText, styles.orangeText]}>EXPRESS</Text>
            <View style={styles.orangeSpeedBar} />
          </View>

          {/* Tagline below: "Deliciousness Delivered Fast" */}
          <Text style={styles.tagline}>Deliciousness Delivered Fast</Text>
        </Animated.View>
      </View>

      {/* Center Area (3D scooter rider and road physics) */}
      <View style={styles.centerArea}>
        
        {/* Soft shadow on the road */}
        <Animated.View style={[styles.roadShadow, roadShadowStyle]} />

        {/* Motion Blur Ghost Trail 2 */}
        <Animated.View style={[styles.scooterContainer, ghost2Style]}>
          <Image source={riderImage} style={styles.riderImage} resizeMode="contain" />
        </Animated.View>

        {/* Motion Blur Ghost Trail 1 */}
        <Animated.View style={[styles.scooterContainer, ghost1Style]}>
          <Image source={riderImage} style={styles.riderImage} resizeMode="contain" />
        </Animated.View>

        {/* Main Scooter Illustration */}
        <Animated.View style={[styles.scooterContainer, mainScooterStyle]}>
          <Image source={riderImage} style={styles.riderImage} resizeMode="contain" />

          {/* Translucent yellow headlight beam extending forward */}
          <Animated.View style={[styles.headlightBeam, headlightStyle]} pointerEvents="none" />
        </Animated.View>

        {/* Asphalt Road at the bottom (sleek 6px height) */}
        <View style={styles.asphaltRoad}>
          {/* Glowing orange horizon highlight */}
          <View style={styles.roadHorizonHighlight} />
          
          {/* Scrolling orange lane dashes */}
          <Animated.View style={[styles.roadDashesContainer, roadDashesStyle]}>
            {Array.from({ length: 15 }).map((_, i) => (
              <View key={i} style={styles.roadDash} />
            ))}
          </Animated.View>
        </View>
      </View>

      {/* Bottom Area (Branded Location Pin Loader) */}
      <View style={styles.bottomArea}>
        <View style={styles.loaderContainer}>
          {/* Synchronized Pin Shadow beneath */}
          <Animated.View style={[styles.pinShadow, pinShadowStyle]} />
          
          {/* Bouncing Pin Icon */}
          <Animated.View style={[styles.pinIconContainer, pinStyle]}>
            <MaterialCommunityIcons name="map-marker" size={38} color="#FF9F0A" />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D62F20", // Red-orange brand base color
    justifyContent: "space-between",
    alignItems: "center",
  },
  vignette: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "transparent",
    borderWidth: 20,
    borderColor: "rgba(0, 0, 0, 0.25)",
    zIndex: 5,
  },
  backgroundContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  glowRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255, 159, 10, 0.15)",
    position: "absolute",
    alignSelf: "center",
    shadowColor: "#FF9F0A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 50,
  },
  abstractArc1: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: 300,
    borderWidth: 2,
    borderColor: "rgba(255, 159, 10, 0.08)",
    top: -100,
    left: -200,
  },
  abstractArc2: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: 250,
    borderWidth: 1.5,
    borderColor: "rgba(255, 159, 10, 0.05)",
    top: 150,
    left: 40,
  },
  speedStreak: {
    position: "absolute",
    width: 65,
    height: 3,
    backgroundColor: "rgba(255, 159, 10, 0.12)",
    borderRadius: 1.5,
    transform: [{ rotate: "-30deg" }],
  },
  particle: {
    position: "absolute",
    right: -10,
    backgroundColor: "rgba(255, 159, 10, 0.35)",
    borderRadius: 3,
  },
  headerArea: {
    paddingTop: 90,
    alignItems: "center",
    zIndex: 10,
  },
  logoWrapper: {
    alignItems: "center",
    transform: [{ skewX: "-12deg" }], // Slanted italics speed branding style
  },
  slantedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  speedLinesContainer: {
    marginRight: 10,
    alignItems: "flex-end",
  },
  speedLine: {
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 1.5,
    marginTop: 3,
  },
  orangeSpeedBar: {
    width: 26,
    height: 4,
    backgroundColor: "#FF9F0A",
    borderRadius: 2,
    marginLeft: 8,
  },
  brandText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
    lineHeight: 52,
  },
  orangeText: {
    color: "#FFFFFF", // Slanted white letters matching design
  },
  tagline: {
    fontSize: 16.5,
    fontStyle: "italic",
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)", // 90% opacity tagline
    marginTop: 14,
    letterSpacing: 1.5,
  },
  centerArea: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 10,
    position: "relative",
  },
  scooterContainer: {
    width: SCOOTER_WIDTH,
    height: SCOOTER_HEIGHT,
    position: "absolute",
    bottom: 25,
    zIndex: 15,
  },
  riderImage: {
    width: SCOOTER_WIDTH,
    height: SCOOTER_HEIGHT,
  },
  headlightBeam: {
    position: "absolute",
    left: 205, // matches headlight horizontal centroid on body
    top: 72,  // matches headlight vertical centroid
    width: 150,
    height: 38,
    backgroundColor: "rgba(255, 235, 59, 0.28)",
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
    transform: [{ skewY: "-14deg" }],
    shadowColor: "#FFC107",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 16,
  },
  roadShadow: {
    position: "absolute",
    bottom: 20,
    width: 160,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    zIndex: 12,
  },
  asphaltRoad: {
    width: "100%",
    height: 25, // container taller to fit dashes comfortably
    backgroundColor: "#2c2524",
    borderTopWidth: 6,
    borderTopColor: "#3a302f", // sleek road top shoulder
    position: "relative",
    overflow: "hidden",
  },
  roadHorizonHighlight: {
    position: "absolute",
    top: -6,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#FF8A00", // glowing orange horizon edge highlight
    opacity: 0.8,
  },
  roadDashesContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 6,
    width: SCREEN_WIDTH + 120,
  },
  roadDash: {
    width: 25,
    height: 3,
    backgroundColor: "#FF8A00", // orange dashes scrolling left
    marginHorizontal: 15,
    borderRadius: 1.5,
    opacity: 0.75,
  },
  bottomArea: {
    height: 110,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    width: "100%",
  },
  loaderContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
  },
  pinIconContainer: {
    zIndex: 12,
    bottom: 8,
  },
  pinShadow: {
    width: 18,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    position: "absolute",
    bottom: 4,
    zIndex: 11,
  },
});