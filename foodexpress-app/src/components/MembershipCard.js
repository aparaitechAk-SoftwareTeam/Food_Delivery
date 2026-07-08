import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const MembershipCard = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftWrapper}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="crown" size={18} color="#F2C94C" />
            <Text style={styles.title}>FOODEXPRESS GOLD</Text>
          </View>
          <Text style={styles.tagline}>Save average of ₹120 per order</Text>
          <View style={styles.perkList}>
            <View style={styles.perk}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#F2C94C" />
              <Text style={styles.perkText}>Unlimited FREE Delivery</Text>
            </View>
            <View style={styles.perk}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#F2C94C" />
              <Text style={styles.perkText}>Extra 10% OFF at top restaurants</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightWrapper}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>JOIN NOW</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1D2939",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#344054",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: "900",
    color: "#F2C94C",
    marginLeft: 6,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  perkList: {
    marginTop: 4,
  },
  perk: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  perkText: {
    fontSize: 11,
    color: "#D0D5DD",
    marginLeft: 6,
  },
  rightWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  badge: {
    backgroundColor: "#F2C94C",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1D2939",
  },
});

export default MembershipCard;
