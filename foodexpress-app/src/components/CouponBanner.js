import React from "react";
import { StyleSheet, Animated, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CouponBanner = ({ scrollY, onPress }) => {
  if (!scrollY) return null;

  // Interpolate translate and opacity based on parent scroll position
  const translateY = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [0, 80],
    extrapolate: "clamp",
  });

  const opacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity: opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.leftWrapper}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="ticket-percent" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.texts}>
            <Text style={styles.title}>50% OFF on first 5 orders!</Text>
            <Text style={styles.subtitle}>Use coupon code: WELCOME50</Text>
          </View>
        </View>

        <View style={styles.rightWrapper}>
          <Text style={styles.claimText}>APPLY</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 99,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FF6F61",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#FF6F61",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  leftWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  rightWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 10,
  },
  claimText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginRight: 2,
  },
});

export default CouponBanner;
