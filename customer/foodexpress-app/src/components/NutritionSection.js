import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

const NutritionSection = ({ nutrition }) => {
  if (!nutrition) return null;

  const items = [
    { label: "Calories", value: nutrition.calories || "210 kcal", color: "#F28482" },
    { label: "Protein", value: nutrition.protein || "4.8 g", color: "#84A59D" },
    { label: "Carbs", value: nutrition.carbs || "28 g", color: "#F7CAD0" },
    { label: "Fat", value: nutrition.fat || "6.5 g", color: "#F5CAC3" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nutritional Value</Text>
      <View style={styles.grid}>
        {items.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={[styles.indicatorCircle, { backgroundColor: item.color }]} />
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  header: {
    fontSize: 13,
    fontWeight: "700",
    color: "#344054",
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAECF0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  indicatorCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    fontWeight: "700",
    color: "#101828",
  },
  label: {
    fontSize: 10,
    color: "#667085",
    marginTop: 2,
    fontWeight: "500",
  },
});

export default NutritionSection;
