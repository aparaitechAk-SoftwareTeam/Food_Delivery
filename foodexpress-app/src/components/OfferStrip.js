import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const OfferStrip = ({ onPressItem }) => {
  const offersList = [
    {
      id: "membership",
      title: "Gold Membership",
      desc: "Get FREE delivery on all orders",
      icon: "crown",
      color: "#FFF9E6",
      borderColor: "#FFE699",
      iconColor: "#FFC72C",
      titleColor: "#855800",
    },
    {
      id: "referral",
      title: "Invite Friends",
      desc: "Earn ₹100 for each friend referral",
      icon: "gift-outline",
      color: "#FFF0EE",
      borderColor: "#FEE4E2",
      iconColor: "#FF6F61",
      titleColor: "#B42318",
    },
    {
      id: "cashback",
      title: "Cashback Deals",
      desc: "Up to 20% instant cashbacks today",
      icon: "cash-multiple",
      color: "#E8F5E9",
      borderColor: "#C8E6C9",
      iconColor: "#2E7D32",
      titleColor: "#1B5E20",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {offersList.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              { backgroundColor: item.color, borderColor: item.borderColor },
            ]}
            onPress={() => onPressItem && onPressItem(item)}
            activeOpacity={0.8}
          >
            <View style={styles.header}>
              <MaterialCommunityIcons name={item.icon} size={22} color={item.iconColor} />
              <Text style={[styles.title, { color: item.titleColor }]}>{item.title}</Text>
            </View>
            <Text style={styles.desc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  card: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 6,
    justifyContent: "space-between",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 8,
  },
  desc: {
    fontSize: 11,
    color: "#475467",
    lineHeight: 15,
  },
});

export default OfferStrip;
