import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

const PriceSection = ({ food }) => {
  if (!food) return null;
  const currentPrice = food.price;
  const originalPrice = food.originalPrice;
  const showOriginal = originalPrice && originalPrice > currentPrice;
  
  // Calculate discount percentage if not directly provided
  let discountPercentage = food.discountPercentage;
  if (!discountPercentage && showOriginal) {
    discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  return (
    <View style={styles.container}>
      <View style={styles.priceRow}>
        <Text style={styles.currentPrice}>₹{currentPrice}</Text>
        
        {showOriginal && (
          <Text style={styles.originalPrice}>₹{originalPrice}</Text>
        )}

        {discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
          </View>
        )}
      </View>

      <Text style={styles.taxLabel}>Taxes & charges included</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#101828",
  },
  originalPrice: {
    fontSize: 15,
    color: "#98A2B3",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  discountBadge: {
    backgroundColor: "#FEE4E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 10,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D92D20",
  },
  taxLabel: {
    fontSize: 11,
    color: "#98A2B3",
    fontWeight: "500",
  },
});

export default PriceSection;
