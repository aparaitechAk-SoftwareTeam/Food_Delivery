import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../constants/ThemeContext";

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
  const { isDark, theme } = useThemeContext();

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
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Upper row: Location & Badges */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={onAddressPress}
          activeOpacity={0.7}
        >
          <View style={[styles.locationIconWrapper, { backgroundColor: isDark ? "#332220" : "#FFF0EE" }]}>
            <MaterialCommunityIcons name="map-marker" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.locationTexts}>
            <View style={styles.labelRow}>
              <Text style={[styles.locationLabel, { color: theme.colors.text }]}>
                {activeAddress?.label || "Select Location"}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.subtext} />
            </View>
            <Text numberOfLines={1} style={[styles.addressLine, { color: theme.colors.subtext }]}>
              {activeAddress
                ? `${activeAddress.line1}, ${activeAddress.city}`
                : "Choose delivery address"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actionsContainer}>
          {/* Delivery Time Badge */}
          <View style={[styles.deliveryBadge, { backgroundColor: isDark ? "#1b3320" : "#E8F5E9" }]}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#4caf50" />
            <Text style={[styles.deliveryBadgeText, { color: "#4caf50" }]}>25 mins</Text>
          </View>

          {/* Notifications */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isDark ? "#2a2a2a" : "#F8F9FA" }]}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={theme.colors.text} />
            <View style={styles.redDot} />
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7}>
            <Avatar.Text
              size={36}
              label={getInitials(user?.name)}
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
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
    marginRight: 4,
  },
  addressLine: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  deliveryBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default Header;
