import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const OfferBanner = () => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="tag-outline" size={16} color="#027A48" style={styles.icon} />
      <View style={styles.content}>
        <Text style={styles.boldText}>50% upto ₹80 off</Text>
        <Text style={styles.divider}>|</Text>
        <Text style={styles.codeText}>USE TRYSWISHNEW</Text>
        <Text style={styles.divider}>|</Text>
        <Text style={styles.conditionText}>ABOVE ₹198</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ECFDF3", // Light green background matching Swish
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D1FADF",
  },
  icon: {
    marginRight: 6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  boldText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#027A48",
    textTransform: "uppercase",
  },
  divider: {
    fontSize: 11,
    color: "#A3E635",
    marginHorizontal: 8,
    fontWeight: "bold",
  },
  codeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#027A48",
  },
  conditionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
  },
});

export default OfferBanner;
