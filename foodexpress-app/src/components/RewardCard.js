import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const RewardCard = ({ onClaim }) => {
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
  const [claimed, setClaimed] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Countdown timer logic
  useEffect(() => {
    if (claimed) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [claimed]);

  // Animate progress bar on mount
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.75, // 75% complete
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleClaim = () => {
    setClaimed(true);
    if (onClaim) onClaim();
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.leftContent}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="star" size={12} color="#FFFFFF" />
            <Text style={styles.badgeText}>NEW USER GIFT</Text>
          </View>
          <Text style={styles.title}>Unlock ₹150 Cashback</Text>
          <Text style={styles.subtitle}>Place 1 more order to claim your reward</Text>
        </View>
        <View style={styles.giftIconWrapper}>
          <Text style={styles.giftEmoji}>🎁</Text>
        </View>
      </View>

      {/* Progress Bar Container */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>3 of 4 orders completed</Text>
      </View>

      {/* Footer Countdown & CTA */}
      <View style={styles.footerRow}>
        <View style={styles.timerWrapper}>
          <MaterialCommunityIcons name="clock-fast" size={16} color="#B42318" />
          <Text style={styles.timerText}>Expires in {formatTime(timeLeft)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.claimButton, claimed && styles.claimedButton]}
          onPress={handleClaim}
          disabled={claimed}
          activeOpacity={0.8}
        >
          <Text style={styles.claimButtonText}>{claimed ? "CLAIMED" : "CLAIM NOW"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF0EE",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FEE4E2",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    elevation: 3,
    shadowColor: "#FF6F61",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftContent: {
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6F61",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D2939",
  },
  subtitle: {
    fontSize: 12,
    color: "#475467",
    marginTop: 2,
  },
  giftIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  giftEmoji: {
    fontSize: 28,
  },
  progressContainer: {
    marginTop: 14,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#E4E7EC",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FF6F61",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: "#667085",
    marginTop: 6,
    fontWeight: "500",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 111, 97, 0.1)",
  },
  timerWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B42318",
    marginLeft: 6,
  },
  claimButton: {
    backgroundColor: "#FF6F61",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 1,
  },
  claimedButton: {
    backgroundColor: "#98A2B3",
  },
  claimButtonText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default RewardCard;
