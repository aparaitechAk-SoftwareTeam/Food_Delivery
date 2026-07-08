import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const LoadingSkeleton = ({ type = "feed" }) => {
  const shimmerValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const animatedStyle = {
    opacity: shimmerValue,
  };

  if (type === "categories") {
    return (
      <View style={styles.horizontalRow}>
        {[1, 2, 3, 4, 5].map((key) => (
          <View key={key} style={styles.categoryItem}>
            <Animated.View style={[styles.circlePlaceholder, animatedStyle]} />
            <Animated.View style={[styles.textPlaceholderShort, animatedStyle]} />
          </View>
        ))}
      </View>
    );
  }

  if (type === "banners") {
    return (
      <Animated.View style={[styles.bannerPlaceholder, animatedStyle]} />
    );
  }

  if (type === "restaurant") {
    return (
      <View style={styles.restaurantCard}>
        <Animated.View style={[styles.imagePlaceholderLarge, animatedStyle]} />
        <View style={styles.cardInfo}>
          <Animated.View style={[styles.textPlaceholderLong, animatedStyle]} />
          <Animated.View style={[styles.textPlaceholderMedium, animatedStyle]} />
          <View style={styles.badgeRow}>
            <Animated.View style={[styles.badgePlaceholder, animatedStyle]} />
            <Animated.View style={[styles.badgePlaceholder, animatedStyle]} />
          </View>
        </View>
      </View>
    );
  }

  // Default: "feed" skeleton containing header, search, category, banner, food cards
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerRow}>
        <View>
          <Animated.View style={[styles.textPlaceholderShort, animatedStyle]} />
          <Animated.View style={[styles.textPlaceholderLong, animatedStyle]} />
        </View>
        <Animated.View style={[styles.circlePlaceholderSmall, animatedStyle]} />
      </View>

      {/* Search Bar Skeleton */}
      <Animated.View style={[styles.searchPlaceholder, animatedStyle]} />

      {/* Categories Skeleton */}
      <View style={styles.horizontalRow}>
        {[1, 2, 3, 4, 5].map((key) => (
          <View key={key} style={styles.categoryItem}>
            <Animated.View style={[styles.circlePlaceholder, animatedStyle]} />
            <Animated.View style={[styles.textPlaceholderShort, animatedStyle]} />
          </View>
        ))}
      </View>

      {/* Banner Skeleton */}
      <Animated.View style={[styles.bannerPlaceholder, animatedStyle]} />

      {/* Food Cards Grid Skeleton */}
      <View style={styles.gridContainer}>
        {[1, 2, 3, 4].map((key) => (
          <View key={key} style={styles.foodCard}>
            <Animated.View style={[styles.imagePlaceholder, animatedStyle]} />
            <Animated.View style={[styles.textPlaceholderMedium, animatedStyle, { marginTop: 10 }]} />
            <Animated.View style={[styles.textPlaceholderShort, animatedStyle, { marginTop: 6 }]} />
            <View style={styles.priceRow}>
              <Animated.View style={[styles.textPlaceholderShort, animatedStyle, { width: 50 }]} />
              <Animated.View style={[styles.buttonPlaceholder, animatedStyle]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "between",
    alignItems: "center",
    marginBottom: 20,
  },
  horizontalRow: {
    flexDirection: "row",
    marginVertical: 16,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 20,
  },
  circlePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E0E0E0",
    marginBottom: 8,
  },
  circlePlaceholderSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  textPlaceholderShort: {
    width: 60,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  textPlaceholderMedium: {
    width: 120,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  textPlaceholderLong: {
    width: 180,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginBottom: 6,
  },
  searchPlaceholder: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  bannerPlaceholder: {
    height: 150,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  foodCard: {
    width: width * 0.44,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  imagePlaceholder: {
    height: 110,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  buttonPlaceholder: {
    width: 50,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#E0E0E0",
  },
  restaurantCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  imagePlaceholderLarge: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  badgePlaceholder: {
    width: 60,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginRight: 8,
  },
});

export default LoadingSkeleton;
