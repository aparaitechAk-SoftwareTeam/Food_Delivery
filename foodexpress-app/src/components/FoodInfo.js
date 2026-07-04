import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const FoodInfo = ({ food }) => {
  if (!food) return null;
  const isVeg = food.isVeg !== undefined ? food.isVeg : true;
  const isBestseller = food.isBestseller || food.isBestSeller;

  return (
    <View style={styles.container}>
      {/* Badge Row */}
      <View style={styles.badgeRow}>
        {/* Veg/Non-veg Icon */}
        <View style={[styles.vegBadge, isVeg ? styles.vegBorder : styles.nonVegBorder]}>
          <View style={[styles.vegDot, { backgroundColor: isVeg ? "#2E7D32" : "#D92D20" }]} />
        </View>

        {/* Serves count */}
        <View style={styles.servesBadge}>
          <Text style={styles.servesText}>Serves {food.serves || "1"}</Text>
        </View>

        {/* Bestseller Badge */}
        {isBestseller && (
          <View style={styles.bestsellerBadge}>
            <MaterialCommunityIcons name="star" size={12} color="#FFFFFF" style={{ marginRight: 2 }} />
            <Text style={styles.bestsellerText}>Bestseller</Text>
          </View>
        )}
      </View>

      {/* Title & Rating */}
      <View style={styles.titleRow}>
        <Text style={styles.foodName}>{food.name}</Text>
        {food.rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{food.rating}</Text>
            <MaterialCommunityIcons name="star" size={14} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={styles.description}>{food.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  vegBadge: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  vegBorder: {
    borderColor: "#2E7D32",
  },
  nonVegBorder: {
    borderColor: "#D92D20",
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  servesBadge: {
    backgroundColor: "#F2F4F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  servesText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475467",
  },
  bestsellerBadge: {
    backgroundColor: "#039855",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bestsellerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  foodName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#101828",
    flex: 1,
    marginRight: 12,
  },
  ratingBadge: {
    backgroundColor: "#E29578",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  description: {
    fontSize: 14,
    color: "#667085",
    lineHeight: 20,
  },
});

export default FoodInfo;
