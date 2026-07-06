import React, { useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Animated, Alert, Platform } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, removeFromCart, increaseQuantity, decreaseQuantity } from "../redux/slices/cartSlice";
import { addFoodToWishlist, removeFoodFromWishlist } from "../redux/slices/wishlistSlice";
import CustomizationBottomSheet from "./CustomizationBottomSheet";

const FoodCard = ({ food, navigation }) => {
  const dispatch = useDispatch();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const isAvailable = food.isAvailable !== false;

  // Redux Selectors
  const token = useSelector((state) => state.auth.token);
  const cartItems = useSelector((state) => state.cart.items) || [];
  const wishlistFoods = useSelector((state) => state.wishlist.items) || [];

  const baseId = (food?.id || food?._id)?.toString();
  // Aggregate quantity across all customization variants
  const itemQty = cartItems
    .filter((ci) => ci.id?.toString() === baseId || ci.id?.toString().startsWith(baseId))
    .reduce((sum, ci) => sum + ci.quantity, 0);

  const isWishlisted = wishlistFoods.some(
    (f) => (f.id || f._id || f)?.toString() === (food?.id || food?._id || food)?.toString()
  );

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddToCart = () => {
    animatePress();
    if (food.isCustomizable) {
      setCustomizeVisible(true);
      return;
    }
    dispatch(
      addToCart({
        id: food._id || food.id,
        name: food.name,
        price: food.price,
        quantity: 1,
        image: food.image,
        restaurantName: food.restaurant?.name || "",
        restaurantId: food.restaurant?._id || food.restaurant?.id || food.restaurant,
      })
    );
  };

  const handleIncrement = () => {
    if (food.isCustomizable) {
      setCustomizeVisible(true);
      return;
    }
    dispatch(increaseQuantity(food._id || food.id));
  };

  const handleDecrement = () => {
    dispatch(decreaseQuantity(food._id || food.id));
  };

  const handleCustomizationComplete = (customizationData) => {
    const customId = `${food._id || food.id}-${customizationData.size}-${customizationData.addons.join("-")}`;
    dispatch(
      addToCart({
        id: customId,
        name: `${food.name} (${customizationData.size})`,
        price: customizationData.price,
        quantity: customizationData.quantity,
        image: food.image,
        restaurantName: food.restaurant?.name || "",
        restaurantId: food.restaurant?._id || food.restaurant?.id || food.restaurant,
        customisationText: `${customizationData.size} | ${customizationData.addons.join(", ") || "No extras"}`,
      })
    );
  };

  const handleWishlistPress = () => {
    if (!token) {
      if (Platform.OS === "web") {
        const confirmLogin = window.confirm("Please login to save this food to your wishlist. Go to Login page?");
        if (confirmLogin) {
          navigation.navigate("Login");
        }
      } else {
        Alert.alert(
          "Login Required",
          "Please login to save this food to your wishlist.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Login", onPress: () => navigation.navigate("Login") },
          ]
        );
      }
      return;
    }
    if (isWishlisted) {
      dispatch(removeFoodFromWishlist(food.id || food._id));
    } else {
      dispatch(addFoodToWishlist(food));
    }
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }, !isAvailable && { opacity: 0.6 }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation && navigation.navigate("FoodDetails", { foodId: food.id || food._id })}
      >
        {/* Top Section: Image & Badges */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: food.image || undefined }} style={styles.image} resizeMode="cover" blurRadius={!isAvailable ? 8 : 0} />
          {!isAvailable && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableOverlayText}>Currently Unavailable</Text>
            </View>
          )}
          <View style={styles.overlayRow}>
            {/* Veg/Non-Veg Badge */}
            <View style={[styles.vegBadge, food.isVeg ? styles.vegBorder : styles.nonVegBorder]}>
              <View style={[styles.vegDot, { backgroundColor: food.isVeg ? "#2E7D32" : "#D92D20" }]} />
            </View>

            {/* Wishlist Heart */}
            <TouchableOpacity
              style={styles.heartButton}
              onPress={handleWishlistPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={20}
                color={isWishlisted ? "#FF6F61" : "#475467"}
              />
            </TouchableOpacity>
          </View>

          {food.isBestSeller && (
            <View style={styles.bestsellerBadge}>
              <MaterialCommunityIcons name="fire" size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
              <Text style={styles.bestsellerText}>BESTSELLER</Text>
            </View>
          )}

          {food.isNewArrival && (
            <View style={styles.newBadge}>
              <Text style={styles.newText}>NEW</Text>
            </View>
          )}

          {/* Discount Overlay Badge */}
          {food.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{food.discountPercentage}% OFF</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoWrapper}>
          {/* Restaurant Name */}
          <Text style={styles.restaurantName} numberOfLines={1}>
            {food.restaurant?.name || "FoodExpress Kitchen"}
          </Text>

          {/* Food Name */}
          <Text style={styles.foodName} numberOfLines={1}>
            {food.name}
          </Text>

          {/* Ratings & Prep Time */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="star" size={14} color="#FF9F43" />
              <Text style={styles.metaText}>{food.rating || "4.1"}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={12} color="#667085" />
              <Text style={styles.metaText}>{food.preparationTime || 20} min</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Price & Quantity Controls */}
      <View style={[styles.infoWrapper, { paddingTop: 0 }]}>
        <View style={styles.footerRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{food.price}</Text>
            {food.discountPercentage > 0 && (
              <Text style={styles.originalPrice}>₹{food.originalPrice}</Text>
            )}
          </View>

          {!isAvailable ? (
            <TouchableOpacity
              style={styles.notifyButton}
              onPress={() => Alert.alert("Notification Subscribed", `We will notify you when ${food.name} is back in stock!`)}
              activeOpacity={0.8}
            >
              <Text style={styles.notifyButtonText}>Notify Me</Text>
            </TouchableOpacity>
          ) : itemQty > 0 ? (
            <View style={styles.qtyContainer}>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrement}>
                <MaterialCommunityIcons name="minus" size={16} color="#FF6F61" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{itemQty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrement}>
                <MaterialCommunityIcons name="plus" size={16} color="#FF6F61" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddToCart}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>ADD</Text>
              <MaterialCommunityIcons name="plus" size={12} color="#FF6F61" style={styles.addPlusIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Customization Bottom Sheet */}
      <CustomizationBottomSheet
        visible={customizeVisible}
        onClose={() => setCustomizeVisible(false)}
        food={food}
        onAddComplete={handleCustomizationComplete}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F2F4F7",
    overflow: "hidden",
    marginHorizontal: 8,
    marginVertical: 6,
    width: 172,
    elevation: 3,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  imageWrapper: {
    height: 120,
    width: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlayRow: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vegBadge: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  heartButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  discountBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#D92D20",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  infoWrapper: {
    padding: 10,
  },
  restaurantName: {
    fontSize: 10,
    color: "#667085",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  foodName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1D2939",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 11,
    color: "#475467",
    marginLeft: 3,
    fontWeight: "500",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D0D5DD",
    marginHorizontal: 6,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1D2939",
  },
  originalPrice: {
    fontSize: 11,
    color: "#98A2B3",
    textDecorationLine: "line-through",
    marginLeft: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FF6F61",
    borderRadius: 8,
    width: 64,
    height: 30,
    elevation: 1,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF6F61",
  },
  addPlusIcon: {
    marginLeft: 2,
    marginTop: 1,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0EE",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE4E2",
    width: 68,
    height: 30,
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  qtyBtn: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF6F61",
  },
  bestsellerBadge: {
    position: "absolute",
    top: 32,
    left: 8,
    backgroundColor: "#FF9F43",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  bestsellerText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  newBadge: {
    position: "absolute",
    top: 32,
    right: 8,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  unavailableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  unavailableOverlayText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  notifyButton: {
    backgroundColor: "#FF6F61",
    borderRadius: 8,
    width: 72,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
  },
  notifyButtonText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default FoodCard;
