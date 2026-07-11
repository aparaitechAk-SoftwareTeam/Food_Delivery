import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const RewardCard = ({ reward, onClaim }) => {
  const {
    completedOrders = 0,
    totalRequiredOrders = 4,
    cashbackAmount = 150,
    expiryDate,
    status = "Pending",
  } = reward || {};

  const [timeLeft, setTimeLeft] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Countdown timer logic
  useEffect(() => {
    if (!expiryDate || status === "Claimed") return;

    const calculateTimeLeft = () => {
      const diff = Math.max(0, Math.floor((new Date(expiryDate) - new Date()) / 1000));
      setTimeLeft(diff);
      return diff;
    };

    calculateTimeLeft();
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryDate, status]);

  // Animate progress bar on completedOrders or totalRequiredOrders update
  useEffect(() => {
    const progressPercent = totalRequiredOrders > 0 ? completedOrders / totalRequiredOrders : 0;
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [completedOrders, totalRequiredOrders, progressAnim]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isExpired = status === "Expired" || (timeLeft <= 0 && status !== "Claimed" && status !== "Eligible");
  const isClaimed = status === "Claimed";
  const isEligible = status === "Eligible" && !isExpired && !isClaimed;
  const isPending = status === "Pending" && !isExpired;

  // Determine dynamic copy
  let cardTitle = `Unlock ₹${cashbackAmount} Cashback`;
  let cardSubtitle = "";
  
  if (isPending) {
    const remaining = totalRequiredOrders - completedOrders;
    cardSubtitle = `Place ${remaining} more order${remaining > 1 ? "s" : ""} to claim your reward`;
  } else if (isEligible) {
    cardSubtitle = "Congratulations! Your ₹150 cashback is ready.";
  } else if (isClaimed) {
    cardSubtitle = `₹${cashbackAmount} Cashback Claimed`;
  } else if (isExpired) {
    cardSubtitle = "Offer Expired";
  }

  // Determine claim button styles & label
  let buttonLabel = "CLAIM NOW";
  let buttonDisabled = true;

  if (isEligible) {
    buttonLabel = "CLAIM NOW";
    buttonDisabled = false;
  } else if (isClaimed) {
    buttonLabel = "CLAIMED";
    buttonDisabled = true;
  } else if (isExpired) {
    buttonLabel = "EXPIRED";
    buttonDisabled = true;
  } else if (isPending) {
    buttonLabel = "CLAIM NOW";
    buttonDisabled = true;
  }

  return (
    <View style={[styles.container, (isExpired || isClaimed) && styles.containerDisabled]}>
      <View style={styles.contentRow}>
        <View style={styles.leftContent}>
          <View style={[styles.badge, (isExpired || isClaimed) && styles.badgeDisabled]}>
            <MaterialCommunityIcons name="star" size={12} color="#FFFFFF" />
            <Text style={styles.badgeText}>NEW USER GIFT</Text>
          </View>
          <Text style={styles.title}>{cardTitle}</Text>
          <Text style={[styles.subtitle, isEligible && styles.subtitleEligible, isExpired && styles.subtitleExpired]}>
            {cardSubtitle}
          </Text>
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
              (isExpired || isClaimed) && styles.progressBarFillDisabled,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {completedOrders} of {totalRequiredOrders} orders completed
        </Text>
      </View>

      {/* Footer Countdown & CTA */}
      <View style={styles.footerRow}>
        <View style={styles.timerWrapper}>
          {isClaimed ? (
            <>
              <MaterialCommunityIcons name="check-circle" size={16} color="#2E7D32" />
              <Text style={[styles.timerText, { color: "#2E7D32" }]}>Claimed successfully</Text>
            </>
          ) : isExpired ? (
            <>
              <MaterialCommunityIcons name="clock-alert" size={16} color="#667085" />
              <Text style={[styles.timerText, { color: "#667085" }]}>Offer expired</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="clock-fast" size={16} color="#B42318" />
              <Text style={styles.timerText}>Expires in {formatTime(timeLeft)}</Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.claimButton,
            buttonDisabled && styles.claimButtonDisabled,
            isClaimed && styles.claimButtonClaimed,
          ]}
          onPress={onClaim}
          disabled={buttonDisabled}
          activeOpacity={0.8}
        >
          <Text style={[styles.claimButtonText, buttonDisabled && !isEligible && styles.claimButtonTextDisabled]}>
            {buttonLabel}
          </Text>
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
  containerDisabled: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E4E7EC",
    shadowColor: "#000000",
    shadowOpacity: 0.02,
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
  badgeDisabled: {
    backgroundColor: "#98A2B3",
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
  subtitleEligible: {
    color: "#2E7D32",
    fontWeight: "bold",
  },
  subtitleExpired: {
    color: "#B42318",
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
  progressBarFillDisabled: {
    backgroundColor: "#D0D5DD",
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
  claimButtonDisabled: {
    backgroundColor: "#F2F4F7",
    elevation: 0,
  },
  claimButtonClaimed: {
    backgroundColor: "#D0D5DD",
  },
  claimButtonText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  claimButtonTextDisabled: {
    color: "#98A2B3",
  },
});

export default RewardCard;
