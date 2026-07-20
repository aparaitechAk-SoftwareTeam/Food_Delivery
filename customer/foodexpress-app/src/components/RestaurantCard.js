import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { toggleFavoriteRestaurant } from "../redux/slices/wishlistSlice";
import { useThemeContext } from "../constants/ThemeContext";

const RestaurantCard = ({ restaurant, navigation }) => {
  const dispatch = useDispatch();
  const { isDark, theme } = useThemeContext();

  // Redux Selectors
  const token = useSelector((state) => state.auth.token);
  const favoriteRestaurants = useSelector((state) => state.wishlist.favorites) || [];

  const isFavorite = favoriteRestaurants.some((r) => (r.id || r._id) === (restaurant.id || restaurant._id));

  const handleFavoritePress = (e) => {
    e.stopPropagation();
    if (!token) {
      Alert.alert(
        "Login Required",
        "Please login to add this restaurant to your favorites.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login") },
        ]
      );
      return;
    }
    dispatch(toggleFavoriteRestaurant(restaurant));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.4) return "#1B5E20";
    if (rating >= 4.0) return "#2E7D32";
    if (rating >= 3.5) return "#4CAF50";
    return "#FF9F43";
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}
      onPress={() => navigation.navigate("RestaurantDetail", { restaurant })}
      activeOpacity={0.9}
    >
      {/* Landscape Image Header */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: restaurant.image }} style={styles.image} resizeMode="cover" />
        
        {/* Favorite & Closed Overlays */}
        <View style={styles.overlayTop}>
          {!restaurant.isOpen && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>CLOSED NOW</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.favoriteBtn, { backgroundColor: isDark ? "#2a2a2a" : "#FFFFFF" }]}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isFavorite ? "star" : "star-outline"}
              size={20}
              color={isFavorite ? "#FFC72C" : (isDark ? "#bbbbbb" : "#475467")}
            />
          </TouchableOpacity>
        </View>

        {/* Coupon Discount Banner */}
        {restaurant.offerPercentage > 0 && (
          <View style={styles.offerBadge}>
            <MaterialCommunityIcons name="ticket-percent" size={14} color="#FFFFFF" />
            <Text style={styles.offerText}>{restaurant.offerPercentage}% OFF up to ₹120</Text>
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(restaurant.rating) }]}>
            <Text style={styles.ratingText}>{restaurant.rating}</Text>
            <MaterialCommunityIcons name="star" size={12} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </View>
        </View>

        {/* Cuisine List */}
        <Text style={[styles.cuisines, { color: theme.colors.subtext }]} numberOfLines={1}>
          {Array.isArray(restaurant.cuisine)
            ? restaurant.cuisine.join(", ")
            : typeof restaurant.cuisine === "string"
            ? restaurant.cuisine
            : "North Indian, Fast Food"}
        </Text>

        {/* Distance, Delivery Time, Address */}
        <View style={[styles.metaRow, { borderTopColor: theme.colors.divider }]}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="map-marker-distance" size={14} color={theme.colors.subtext} />
            <Text style={[styles.metaText, { color: theme.colors.subtext }]}>{restaurant.distance || "2.4"} km</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.subtext} />
            <Text style={[styles.metaText, { color: theme.colors.subtext }]}>{restaurant.deliveryTime || "25-35 mins"}</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={13} color={theme.colors.subtext} />
            <Text style={[styles.metaText, { color: theme.colors.subtext }]}>{restaurant.restaurantType || "Multi Cuisine"}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  imageWrapper: {
    height: 150,
    width: "100%",
    position: "relative",
    backgroundColor: "#EAECF0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlayTop: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closedBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  closedText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  favoriteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  offerBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6F61",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    elevation: 2,
  },
  offerText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  infoContainer: {
    padding: 14,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cuisines: {
    fontSize: 13,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D0D5DD",
    marginHorizontal: 8,
  },
});

export default RestaurantCard;
