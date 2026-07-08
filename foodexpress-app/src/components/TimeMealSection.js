/**
 * TimeMealSection.js
 *
 * Animated component that renders:
 *  1. A gradient greeting banner (emoji + greeting + subtitle + time badge)
 *  2. A horizontal scrollable list of FoodCards filtered for the current time period
 *
 * If `foods` is empty the component renders null.
 */
import React, { useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Text } from "react-native-paper";
import FoodCard from "./FoodCard";

/**
 * @param {{
 *   period: string,
 *   greeting: string,
 *   emoji: string,
 *   subtitle: string,
 *   accentColor: string,
 *   gradientColors: string[],
 *   timeLabel: string,
 *   foods: any[],
 *   navigation: any,
 *   sectionTitle: string,
 *   sectionSubtitle: string,
 * }} props
 */
const TimeMealSection = ({
  period,
  greeting,
  emoji,
  subtitle,
  accentColor,
  gradientColors,
  timeLabel,
  foods,
  navigation,
  sectionTitle,
  sectionSubtitle,
}) => {
  // ── Animated Values ────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const bannerScaleAnim = useRef(new Animated.Value(0.95)).current;

  // Animate in whenever `period` changes
  useEffect(() => {
    // Reset
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    bannerScaleAnim.setValue(0.95);

    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 70,
        friction: 9,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 9,
      }),
      Animated.spring(bannerScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 70,
        friction: 9,
      }),
    ]).start();
  }, [period]);

  // Don't render if no foods
  if (!foods || foods.length === 0) return null;

  // ── Section label config per period ───────────────────────────────────────
  const sectionConfig = {
    morning: {
      label: sectionTitle || "Morning Dishes",
      sub: sectionSubtitle || "Fresh breakfast to kickstart your day",
    },
    afternoon: {
      label: sectionTitle || "Afternoon Dishes",
      sub: sectionSubtitle || "Hearty lunch options just for you",
    },
    evening: {
      label: sectionTitle || "Evening Dishes",
      sub: sectionSubtitle || "Evening favourites & quick bites",
    },
    night: {
      label: sectionTitle || "Late Night Specials",
      sub: sectionSubtitle || "For when the midnight hunger strikes",
    },
  };

  const { label, sub } = sectionConfig[period] || sectionConfig.evening;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* ── Greeting Banner ── */}
      <Animated.View
        style={[
          styles.bannerCard,
          {
            backgroundColor: gradientColors[0],
            borderLeftColor: accentColor,
            transform: [{ scale: bannerScaleAnim }],
          },
        ]}
      >
        {/* Decorative circle accent */}
        <View
          style={[styles.bannerAccentCircle, { backgroundColor: accentColor + "22" }]}
        />
        <View style={styles.bannerAccentCircleSmall} />

        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerEmoji}>{emoji}</Text>
            <View style={styles.bannerTextCol}>
              <Text style={[styles.bannerGreeting, { color: accentColor }]}>
                {greeting}!
              </Text>
              <Text style={styles.bannerSubtitle}>{subtitle}</Text>
            </View>
          </View>

          {/* Time badge */}
          <View style={[styles.timeBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.timeBadgeText}>{timeLabel}</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Section Header ── */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>{label}</Text>
          <Text style={styles.sectionSubtitle}>{sub}</Text>
        </View>
      </View>

      {/* ── Horizontal Food Scroll ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {foods.map((item) => (
          <FoodCard
            key={(item.id || item._id)?.toString()}
            food={item}
            navigation={navigation}
          />
        ))}
      </ScrollView>

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: accentColor + "33" }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },

  // Banner
  bannerCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    borderLeftWidth: 4,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  bannerAccentCircle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -20,
    top: -30,
  },
  bannerAccentCircleSmall: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    right: 60,
    bottom: -20,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bannerEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerGreeting: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "#667085",
    marginTop: 2,
  },
  timeBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // Section header
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1D2939",
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#667085",
    marginTop: 2,
  },

  // Food scroll
  horizontalList: {
    paddingLeft: 8,
    paddingRight: 16,
  },

  // Divider between time section and bestsellers
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 1,
  },
});

export default TimeMealSection;
