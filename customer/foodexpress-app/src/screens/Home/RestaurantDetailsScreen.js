import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import { addToCart, increaseQuantity, decreaseQuantity } from "../../redux/slices/cartSlice";
import CustomizationBottomSheet from "../../components/CustomizationBottomSheet";
import api from "../../utils/api";

const DELIVERY_FEE = 39;

const RestaurantDetailsScreen = ({ route, navigation }) => {
  const restaurant = route?.params?.restaurant;
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items) || [];

  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [customizeVisible, setCustomizeVisible] = useState(false);

  const restaurantId = restaurant?._id || restaurant?.id;

  // ─── Load foods from this restaurant ────────────────────────────────────
  const loadFoods = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const { data } = await api.get("/foods", {
        params: { restaurant: restaurantId, limit: 40 },
      });
      setFoods(data.foods || []);
    } catch (err) {
      console.log("Failed to load restaurant foods:", err.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  // ─── Cart helpers ────────────────────────────────────────────────────────
  const getItemQty = (itemId) => {
    const matched = cartItems.filter(
      (ci) => ci.id === itemId || ci.id?.toString().startsWith(itemId?.toString())
    );
    return matched.reduce((sum, ci) => sum + ci.quantity, 0);
  };

  const handleAdd = (item) => {
    if (item.isCustomizable) {
      setSelectedFood(item);
      setCustomizeVisible(true);
    } else {
      dispatch(
        addToCart({
          id: item._id || item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image,
          restaurantName: restaurant?.name || "FoodExpress",
          restaurantId: restaurantId,
        })
      );
    }
  };

  const handleIncrease = (item) => {
    dispatch(increaseQuantity(item._id || item.id));
  };

  const handleDecrease = (item) => {
    dispatch(decreaseQuantity(item._id || item.id));
  };

  const handleCustomizationComplete = (customizationData) => {
    if (!selectedFood) return;
    const customId = `${selectedFood._id || selectedFood.id}-${customizationData.size}-${customizationData.addons.join("-")}`;
    dispatch(
      addToCart({
        id: customId,
        name: `${selectedFood.name} (${customizationData.size})`,
        price: customizationData.price,
        quantity: customizationData.quantity,
        image: selectedFood.image,
        restaurantName: restaurant?.name || "FoodExpress",
        restaurantId: restaurantId,
        customisationText: `${customizationData.size} | ${customizationData.addons.join(", ") || "No extras"}`,
      })
    );
    setSelectedFood(null);
  };

  // ─── Guard: no restaurant param ─────────────────────────────────────────
  if (!restaurant) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="store-off" size={64} color="#D0D5DD" />
        <Text style={styles.errorTitle}>Restaurant not found</Text>
        <Text style={styles.errorSubtitle}>We could not load the details for this restaurant.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const getRatingColor = (rating) => {
    if (rating >= 4.4) return "#1B5E20";
    if (rating >= 4.0) return "#2E7D32";
    if (rating >= 3.5) return "#4CAF50";
    return "#FF9F43";
  };

  const cuisineStr = Array.isArray(restaurant.cuisine)
    ? restaurant.cuisine.join(", ")
    : restaurant.cuisine || "Multi Cuisine";

  const cartTotal = cartItems.reduce((sum, ci) => sum + ci.quantity * ci.price, 0);
  const cartQty = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

  // ─── Food card renderer ───────────────────────────────────────────────────
  const renderFoodItem = ({ item }) => {
    const qty = getItemQty(item._id || item.id);
    const isVeg = item.isVeg !== undefined ? item.isVeg : true;

    return (
      <View style={styles.foodCard}>
        {/* Left: Info */}
        <View style={styles.foodInfo}>
          {/* Veg/Non-veg dot */}
          <View style={[styles.vegDot, { borderColor: isVeg ? "#2E7D32" : "#D92D20" }]}>
            <View style={[styles.vegDotInner, { backgroundColor: isVeg ? "#2E7D32" : "#D92D20" }]} />
          </View>

          {/* Bestseller badge */}
          {(item.isBestseller || item.isBestSeller) && (
            <View style={styles.bestsellerBadge}>
              <Text style={styles.bestsellerText}>⭐ Bestseller</Text>
            </View>
          )}

          <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.foodDesc} numberOfLines={2}>
            {item.description || "Fresh and delicious, made with quality ingredients."}
          </Text>

          {/* Rating */}
          {item.rating > 0 && (
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={12} color="#FFC72C" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            {item.originalPrice > item.price && (
              <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
            )}
            <Text style={styles.price}>₹{item.price}</Text>
          </View>
        </View>

        {/* Right: Image + ADD Button */}
        <View style={styles.foodImageSection}>
          <TouchableOpacity onPress={() => navigation.navigate("FoodDetails", { foodId: item._id || item.id })}>
            {item.image ? (
              <Image source={{ uri: item.image || undefined }} style={styles.foodImage} />
            ) : (
              <View style={[styles.foodImage, styles.foodImagePlaceholder]}>
                <MaterialCommunityIcons name="food" size={32} color="#D0D5DD" />
              </View>
            )}
          </TouchableOpacity>

          {qty === 0 ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(item)}>
              <Text style={styles.addBtnText}>ADD</Text>
              {item.isCustomizable && (
                <Text style={styles.customizeHint}>Customisable</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtnMinus} onPress={() => handleDecrease(item)}>
                <MaterialCommunityIcons name="minus" size={16} color="#039855" />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtnPlus} onPress={() => handleIncrease(item)}>
                <MaterialCommunityIcons name="plus" size={16} color="#039855" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <CustomScreenHeader title={restaurant?.name || "Restaurant Details"} navigation={navigation} />
      <View style={styles.container}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          {restaurant.image ? (
            <Image source={{ uri: restaurant.image || undefined }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={60} color="#EAECF0" />
            </View>
          )}
          {/* Gradient overlay */}
          <View style={styles.heroOverlay} />

        {/* Hero info */}
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{restaurant.name}</Text>
          <Text style={styles.heroCuisine}>{cuisineStr}</Text>
        </View>
      </View>

      {/* Restaurant Meta Card */}
      <View style={styles.metaCard}>
        <View style={styles.metaItem}>
          <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(restaurant.rating) }]}>
            <Text style={styles.ratingBadgeText}>{restaurant.rating || 4.2}</Text>
            <MaterialCommunityIcons name="star" size={11} color="#FFF" />
          </View>
          <Text style={styles.metaLabel}>Rating</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>{restaurant.deliveryTime || "25-35"}</Text>
          <Text style={styles.metaLabel}>mins</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>₹{restaurant.deliveryCharges !== undefined ? restaurant.deliveryCharges : DELIVERY_FEE}</Text>
          <Text style={styles.metaLabel}>Delivery</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <View style={[styles.statusBadge, { backgroundColor: restaurant.isOpen ? "#ECFDF3" : "#FEF3F2" }]}>
            <View style={[styles.statusDot, { backgroundColor: restaurant.isOpen ? "#039855" : "#D92D20" }]} />
            <Text style={[styles.statusText, { color: restaurant.isOpen ? "#027A48" : "#B42318" }]}>
              {restaurant.isOpen ? "Open" : "Closed"}
            </Text>
          </View>
          <Text style={styles.metaLabel}>Status</Text>
        </View>
      </View>

      {/* Menu List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      ) : (
        <FlatList
          data={foods}
          keyExtractor={(item) => (item._id || item.id)?.toString()}
          renderItem={renderFoodItem}
          ListHeaderComponent={
            <View style={styles.menuHeader}>
              <MaterialCommunityIcons name="silverware" size={18} color="#FF6F61" />
              <Text style={styles.menuHeaderText}>Menu ({foods.length} items)</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyMenu}>
              <MaterialCommunityIcons name="food-off" size={48} color="#D0D5DD" />
              <Text style={styles.emptyMenuTitle}>No items available</Text>
              <Text style={styles.emptyMenuSub}>This restaurant's menu will be updated soon.</Text>
            </View>
          }
          contentContainerStyle={styles.menuList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Cart Strip */}
      {cartQty > 0 && (
        <TouchableOpacity style={styles.cartStrip} onPress={() => navigation.navigate("Cart")} activeOpacity={0.9}>
          <View style={styles.cartStripLeft}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartQty}</Text>
            </View>
            <Text style={styles.cartStripText}>View Cart</Text>
          </View>
          <View style={styles.cartStripRight}>
            <Text style={styles.cartStripAmount}>₹{cartTotal}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* Customization Bottom Sheet */}
      <CustomizationBottomSheet
        visible={customizeVisible}
        onClose={() => { setCustomizeVisible(false); setSelectedFood(null); }}
        food={selectedFood}
        onAddComplete={handleCustomizationComplete}
      />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  // Error
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  errorTitle: { fontSize: 20, fontWeight: "700", color: "#344054", marginTop: 16 },
  errorSubtitle: { fontSize: 13, color: "#667085", textAlign: "center", marginTop: 8 },
  backBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#FF6F61", borderRadius: 12 },
  backBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  // Hero
  heroBanner: { height: 230, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroPlaceholder: { backgroundColor: "#EAECF0", alignItems: "center", justifyContent: "center" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  heroHeader: { position: "absolute", top: Platform.OS === "ios" ? 0 : 12, left: 0, right: 0, paddingHorizontal: 16 },
  heroBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
    marginTop: 8,
  },
  heroInfo: { position: "absolute", bottom: 16, left: 16, right: 16 },
  heroName: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  heroCuisine: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },

  // Meta card
  metaCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: -20,
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 10,
    elevation: 6, shadowColor: "#101828", shadowOpacity: 0.1, shadowRadius: 12,
  },
  metaItem: { alignItems: "center", flex: 1 },
  metaDivider: { width: 1, height: 32, backgroundColor: "#F2F4F7" },
  ratingBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 2 },
  ratingBadgeText: { fontSize: 13, fontWeight: "700", color: "#FFF" },
  metaValue: { fontSize: 14, fontWeight: "700", color: "#1D2939" },
  metaLabel: { fontSize: 11, color: "#667085", marginTop: 3 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },

  // Menu
  menuHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  menuHeaderText: { fontSize: 15, fontWeight: "800", color: "#1D2939" },
  menuList: { paddingBottom: 100, paddingTop: 8 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#667085" },
  emptyMenu: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyMenuTitle: { fontSize: 17, fontWeight: "700", color: "#344054", marginTop: 14 },
  emptyMenuSub: { fontSize: 13, color: "#667085", textAlign: "center", marginTop: 6 },

  // Food card
  foodCard: {
    flexDirection: "row", justifyContent: "space-between",
    backgroundColor: "#FFFFFF", marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "#F2F4F7",
    elevation: 2, shadowColor: "#101828", shadowOpacity: 0.04, shadowRadius: 6,
  },
  foodInfo: { flex: 1, marginRight: 12 },
  vegDot: { width: 16, height: 16, borderRadius: 2, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  vegDotInner: { width: 8, height: 8, borderRadius: 4 },
  bestsellerBadge: { backgroundColor: "#FFF7ED", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start", marginBottom: 6 },
  bestsellerText: { fontSize: 10, fontWeight: "700", color: "#C4320A" },
  foodName: { fontSize: 14, fontWeight: "700", color: "#101828" },
  foodDesc: { fontSize: 12, color: "#667085", marginTop: 4, lineHeight: 17 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 3 },
  ratingText: { fontSize: 11, color: "#344054", fontWeight: "600" },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  originalPrice: { fontSize: 12, color: "#98A2B3", textDecorationLine: "line-through" },
  price: { fontSize: 16, fontWeight: "800", color: "#039855" },

  // Food image + button
  foodImageSection: { alignItems: "center", width: 96 },
  foodImage: { width: 96, height: 80, borderRadius: 12 },
  foodImagePlaceholder: { backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },
  addBtn: {
    marginTop: 8, width: 80, height: 36,
    borderRadius: 10, borderWidth: 2, borderColor: "#039855",
    backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
  },
  addBtnText: { fontSize: 13, fontWeight: "800", color: "#039855" },
  customizeHint: { fontSize: 8, color: "#667085", textAlign: "center", marginTop: 2 },
  qtyControl: {
    marginTop: 8, flexDirection: "row", alignItems: "center",
    width: 96, height: 36, borderRadius: 10,
    backgroundColor: "#039855", justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  qtyBtnMinus: { width: 24, height: 24, alignItems: "center", justifyContent: "center", tintColor: "#FFF" },
  qtyBtnPlus: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  qtyValue: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },

  // Cart strip
  cartStrip: {
    position: "absolute", bottom: 16, left: 16, right: 16,
    backgroundColor: "#039855", borderRadius: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    elevation: 10, shadowColor: "#039855", shadowOpacity: 0.4, shadowRadius: 12,
  },
  cartStripLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cartBadge: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cartBadgeText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  cartStripText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  cartStripRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  cartStripAmount: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
});

export default RestaurantDetailsScreen;
