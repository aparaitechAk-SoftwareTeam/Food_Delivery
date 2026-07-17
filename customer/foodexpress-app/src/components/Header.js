import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Text, Avatar, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Header = ({
  activeAddress,
  onAddressPress,
  onNotificationPress,
  onProfilePress,
  onWalletPress,
  onCouponsPress,
  user,
  walletBalance = 150.00,
  activeCouponsCount = 12,
}) => {
  const getInitials = (name) => {
    if (!name) return "FE";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      {/* Upper row: Location & Badges */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={onAddressPress}
          activeOpacity={0.7}
        >
          <View style={styles.locationIconWrapper}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#FF6F61" />
          </View>
          <View style={styles.locationTexts}>
            <View style={styles.labelRow}>
              <Text style={styles.locationLabel}>
                {activeAddress?.label || "Select Location"}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#667085" />
            </View>
            <Text numberOfLines={1} style={styles.addressLine}>
              {activeAddress
                ? `${activeAddress.line1}, ${activeAddress.city}`
                : "Choose delivery address"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actionsContainer}>
          {/* Delivery Time Badge */}
          <View style={styles.deliveryBadge}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#2E7D32" />
            <Text style={styles.deliveryBadgeText}>25 mins</Text>
          </View>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color="#1D2939" />
            <View style={styles.redDot} />
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7}>
            <Avatar.Text
              size={36}
              label={getInitials(user?.name)}
              style={styles.avatar}
              labelStyle={styles.avatarText}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  locationIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF0EE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  locationTexts: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1D2939",
    marginRight: 4,
  },
  addressLine: {
    fontSize: 12,
    color: "#667085",
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  deliveryBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2E7D32",
    marginLeft: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    position: "relative",
  },
  redDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  avatar: {
    backgroundColor: "#FF6F61",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  quickCard: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickCardItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 8,
  },
  quickCardTextWrapper: {
    marginLeft: 8,
  },
  quickCardTitle: {
    fontSize: 11,
    color: "#667085",
  },
  quickCardValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1D2939",
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#E4E7EC",
  },
});

export default Header;
