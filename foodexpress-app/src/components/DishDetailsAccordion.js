import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from "react-native-reanimated";
import NutritionSection from "./NutritionSection";

// Enable LayoutAnimation for Android if not enabled
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const DishDetailsAccordion = ({ food }) => {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const animationProgress = useSharedValue(0);

  const toggleAccordion = () => {
    // We combine Reanimated for the fine-grained inner values, and LayoutAnimation for general layout shifts
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const toValue = expanded ? 0 : 1;
    animationProgress.value = withTiming(toValue, { duration: 300 });
    setExpanded(!expanded);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const height = interpolate(animationProgress.value, [0, 1], [0, contentHeight || 380]);
    const opacity = interpolate(animationProgress.value, [0, 0.5, 1], [0, 0.3, 1]);
    return {
      height,
      opacity,
      overflow: "hidden",
    };
  });

  const onLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight) {
      setContentHeight(height);
    }
  };

  if (!food) return null;

  // Safe formatting of array fields
  const ingredientsStr = Array.isArray(food.ingredients) ? food.ingredients.join(", ") : food.ingredients || "None";
  const dietaryPreference = food.isVeg ? "Veg" : "Non-Veg";

  return (
    <View style={styles.container}>
      {/* Header Button */}
      <TouchableOpacity 
        style={styles.header} 
        onPress={toggleAccordion} 
        activeOpacity={0.8}
      >
        <Text style={styles.headerText}>
          {expanded ? "Hide dish details" : "View dish details"}
        </Text>
        <MaterialCommunityIcons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#2E7D32" 
        />
      </TouchableOpacity>

      {/* Expandable Content Area */}
      <Animated.View style={animatedStyle}>
        {/* We wrap the content in a View to measure its natural height on layout */}
        <View onLayout={onLayout} style={styles.contentInner}>
          
          {/* Info note */}
          <View style={styles.infoNote}>
            <Text style={styles.infoNoteTitle}>Information</Text>
            <Text style={styles.infoNoteContent}>
              All nutritional information is indicative. Values are per serve as shared by the restaurant and may vary depending on the ingredient and portion size. An average active adult requires 2,000 kcal energy per day. However, calorie needs may vary.
            </Text>
          </View>

          {/* Details Table */}
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Serving Size</Text>
              <Text style={styles.tableValue}>{food.serves || "1 serve"}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Temperature</Text>
              <Text style={styles.tableValue}>{food.temperature || "Served Hot"}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Allergens</Text>
              <Text style={styles.tableValue}>{food.allergens || "None"}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Dietary Preference</Text>
              <Text style={styles.tableValue}>{dietaryPreference}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Ingredients</Text>
              <Text style={styles.tableValue} numberOfLines={3}>{ingredientsStr}</Text>
            </View>
          </View>

          {/* Embedded Nutrition Grid */}
          <NutritionSection nutrition={food.nutrition} />

          {/* Disclaimer */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerTitle}>Disclaimer</Text>
            <Text style={styles.disclaimerText}>
              All nutritional information shown is based on a 100 g/100 mL serving size. Actual values are subject to change and may slightly vary from the information displayed. We make no guarantees regarding the real-time accuracy of these figures.
            </Text>
          </View>

        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E7D32", // Green accordion link color similar to Swish
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoNote: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F7",
  },
  infoNoteTitle: {
    width: 80,
    fontSize: 12,
    fontWeight: "600",
    color: "#475467",
  },
  infoNoteContent: {
    flex: 1,
    fontSize: 11,
    color: "#667085",
    lineHeight: 16,
  },
  table: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F7",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
    gap: 16,
  },
  tableLabel: {
    width: 120,
    fontSize: 13,
    fontWeight: "500",
    color: "#475467",
  },
  tableValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#101828",
  },
  disclaimerBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F7",
    paddingVertical: 12,
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475467",
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 10,
    color: "#98A2B3",
    lineHeight: 14,
  },
});

export default DishDetailsAccordion;
