import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Switch,
  Alert,
} from "react-native";
import {
  Text,
  Avatar,
  Card,
  useTheme,
  IconButton,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ScreenContainer from "../../components/ScreenContainer";
import { fetchFoods } from "../../redux/slices/foodsSlice";
import { toggleFavoriteRestaurant, fetchFavorites, fetchWishlist } from "../../redux/slices/wishlistSlice";
import { fetchAddresses } from "../../redux/slices/authSlice";
import LocationBottomSheet from "../../components/LocationBottomSheet";
import * as Location from "expo-location";
import { setActiveAddress } from "../../redux/slices/authSlice";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Redux Selectors
  const { categories, restaurants, loading } = useSelector((state) => state.foods);
  const { user, activeAddress, token } = useSelector((state) => state.auth);
  const { favorites } = useSelector((state) => state.wishlist);
  const cartItems = useSelector((state) => state.cart.items);
  const cartTotalAmount = useSelector((state) => state.cart.totalAmount);

  // Component States
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [greeting, setGreeting] = useState("Hello");
  const [searchQuery, setSearchQuery] = useState("");

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Set up Welcome Greeting and Fade-in Animation
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good Morning");
    else if (hours < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchFoods());
    if (token) {
      dispatch(fetchFavorites());
      dispatch(fetchAddresses());
      dispatch(fetchWishlist());
    }
    checkLocationPermission();
  }, [dispatch, token]);

  // Check location permission on launch
  const checkLocationPermission = async () => {
    if (!activeAddress) {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const geocoded = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (geocoded && geocoded.length > 0) {
            const place = geocoded[0];
            dispatch(
              setActiveAddress({
                label: "Current Location",
                line1: place.name || `${place.streetNumber || ""} ${place.street || ""}`,
                line2: place.district || place.subregion || "",
                city: place.city || place.subregion || "",
                state: place.region || "",
                postalCode: place.postalCode || "",
                country: place.country || "India",
              })
            );
          }
        }
      } catch (error) {
        // fail silently
      }
    }
  };

  const handleFavoriteToggle = (restaurant) => {
    if (!token) {
      Alert.alert(
        "Login Required",
        "Please log in to manage your favorite restaurants.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login", { redirectTo: "Main", redirectTab: "Home" }) }
        ]
      );
      return;
    }
    dispatch(toggleFavoriteRestaurant(restaurant));
  };

  const isFavorite = (restaurantId) => {
    return favorites.some(
      (fav) => (fav._id || fav.id)?.toString() === restaurantId?.toString()
    );
  };

  // Filter restaurants based on veg toggle and selected category
  const getFilteredRestaurants = () => {
    let list = restaurants || [];
    if (vegOnly) {
      // Filter Veg-friendly restaurants
      list = list.filter((r) =>
        r.name.toLowerCase().includes("pizza") ||
        r.name.toLowerCase().includes("dine") ||
        r.cuisine?.toLowerCase().includes("south indian") ||
        r.cuisine?.toLowerCase().includes("pizza")
      );
    }
    if (selectedCategory) {
      list = list.filter(
        (r) => r.cuisine?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    return list;
  };

  // Render Cuisines/Categories
  const renderCategoryItem = ({ item }) => {
    const isSelected = selectedCategory?.toLowerCase() === item.name.toLowerCase();
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isSelected && styles.categoryItemActive,
        ]}
        onPress={() => setSelectedCategory(isSelected ? null : item.name)}
      >
        <Text style={styles.categoryIcon}>
          {item.name === "Pizza"
            ? "🍕"
            : item.name === "Burger"
            ? "🍔"
            : item.name === "Biryani"
            ? "🍛"
            : item.name === "Chinese"
            ? "🍜"
            : item.name === "South Indian"
            ? "🥞"
            : item.name === "Desserts"
            ? "🍰"
            : "🥤"}
        </Text>
        <Text
          style={[
            styles.categoryName,
            isSelected && styles.categoryNameActive,
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render Restaurants Card (Fast Delivery)
  const renderRestaurantCard = ({ item }) => {
    const favorited = isFavorite(item._id || item.id);
    
    // Custom mock discount badge per restaurant
    const discountText =
      item.name === "McDonald's"
        ? "50% OFF UPTO ₹80 | AD"
        : item.name === "Pizza Hut"
        ? "ITEMS AT ₹59 | AD"
        : item.name === "Local Dine"
        ? "60% OFF UPTO ₹120"
        : "30% OFF UPTO ₹75";

    return (
      <Card style={styles.restaurantCard}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.restaurantImage} />
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountText}</Text>
          </View>
          <TouchableOpacity
            style={styles.heartButton}
            onPress={() => handleFavoriteToggle(item)}
          >
            <MaterialCommunityIcons
              name={favorited ? "heart" : "heart-outline"}
              size={22}
              color={favorited ? "#ff3366" : "#fff"}
            />
          </TouchableOpacity>
        </View>
        <Card.Content style={styles.cardContent}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="star" size={14} color="#ffb300" />
            <Text style={styles.metaRating}>{item.rating}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaTime}>{item.deliveryTime}</Text>
          </View>
          <Text style={styles.cuisineText} numberOfLines={1}>
            {item.cuisine || "Indian, Fast Food"}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  // Header, welcome, banners and categories inside ListHeaderComponent for FlatList virtualization
  const renderListHeader = () => {
    const displayName = user?.name || "foodie";
    
    return (
      <View style={styles.headerWrapper}>
        {/* Pink Curved Header Section */}
        <View style={styles.pinkContainer}>
          {/* Background Text Pattern 'HUNGRY' */}
          <View style={styles.backgroundPatternContainer}>
            <Text style={styles.patternText}>HUNGRY HUNGRY HUNGRY</Text>
            <Text style={styles.patternText}>HUNGRY HUNGRY HUNGRY</Text>
            <Text style={styles.patternText}>HUNGRY HUNGRY HUNGRY</Text>
          </View>

          {/* Top Address & Profile Bar */}
          <SafeAreaView>
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.locationContainer}
                onPress={() => setLocationSheetVisible(true)}
              >
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons
                    name="near-me"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.locationTitle}>
                    {activeAddress?.postalCode || "57"}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={18}
                    color="#fff"
                  />
                </View>
                <Text style={styles.locationSubtitle} numberOfLines={1}>
                  {activeAddress
                    ? `${activeAddress.line1}, ${activeAddress.city}`
                    : "Tap to set delivery address..."}
                </Text>
              </TouchableOpacity>

              <View style={styles.rightHeaderIcons}>
                <View style={styles.buyOneBadge}>
                  <Text style={styles.buyOneText}>BUY ONE</Text>
                  <MaterialCommunityIcons name="fire" size={14} color="#ff6b00" />
                </View>
                <TouchableOpacity onPress={() => {
                  if (!token) {
                    navigation.navigate("Login", { redirectTo: "Main", redirectTab: "Profile" });
                  } else {
                    navigation.navigate("Profile");
                  }
                }}>
                  <Avatar.Image
                    size={36}
                    source={{
                      uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                    }}
                    style={styles.avatar}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* Search Bar Row with Veg Toggle */}
          <View style={styles.searchRow}>
            <TouchableOpacity
              style={styles.searchBarWrapper}
              onPress={() => navigation.navigate("Search")}
            >
              <MaterialCommunityIcons name="magnify" size={22} color="#666" style={styles.searchIcon} />
              <Text style={styles.searchPlaceholder}>Search for 'Sweets'</Text>
              <MaterialCommunityIcons name="microphone" size={22} color="#ff6b00" style={styles.micIcon} />
            </TouchableOpacity>
            
            <View style={styles.vegToggleContainer}>
              <Text style={styles.vegText}>VEG</Text>
              <Switch
                value={vegOnly}
                onValueChange={setVegOnly}
                trackColor={{ false: "#ccc", true: "#4caf50" }}
                thumbColor="#fff"
                style={styles.vegSwitch}
              />
            </View>
          </View>

          {/* Welcome section */}
          <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim }]}>
            <Text style={styles.welcomeText}>
              Welcome, <Text style={styles.welcomeName}>foodie!</Text>
            </Text>
          </Animated.View>

          {/* Promotional Banner Grid */}
          <View style={styles.bannersGrid}>
            {/* Left Big Banner */}
            <TouchableOpacity
              style={styles.bigBanner}
              onPress={() => navigation.navigate("FoodListing", { category: "Burger" })}
            >
              <View style={styles.bannerTextCol}>
                <Text style={styles.bannerTag}>🔥 99 store</Text>
                <Text style={styles.bannerTitle}>Meals At ₹99</Text>
              </View>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80" }}
                style={styles.bannerBigImage}
              />
            </TouchableOpacity>

            {/* Right Banners Column */}
            <View style={styles.bannerCol}>
              <TouchableOpacity
                style={styles.smallBanner}
                onPress={() => navigation.navigate("FoodListing", { category: "Pizza" })}
              >
                <View style={styles.bannerSmallTextCol}>
                  <Text style={styles.bannerSmallTitle}>Flat ₹150 OFF</Text>
                  <Text style={styles.bannerSmallDesc}>& More</Text>
                </View>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1594007653308-d4d8d2ab5d73?auto=format&fit=crop&w=200&q=80" }}
                  style={styles.bannerSmallImage}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallBanner, { marginTop: 8 }]}
                onPress={() => navigation.navigate("FoodListing", { category: "Biryani" })}
              >
                <View style={styles.bannerSmallTextCol}>
                  <Text style={styles.bannerSmallTitle}>Get 60% OFF</Text>
                  <Text style={styles.bannerSmallDesc}>+ Cashback</Text>
                </View>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1605476879656-3b27c8d9db90?auto=format&fit=crop&w=200&q=80" }}
                  style={styles.bannerSmallImage}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Scrollable Categories / Cuisines */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionHeaderTitle}>What's on your mind?</Text>
          <FlatList
            data={categories}
            keyExtractor={(item) => (item.id || item._id).toString()}
            renderItem={renderCategoryItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContainer}
          />
        </View>

        {/* Fast Delivery List Title */}
        <View style={styles.fastDeliveryTitleContainer}>
          <Text style={styles.sectionHeaderTitle}>Fast delivery</Text>
        </View>
      </View>
    );
  };

  const filteredRestaurants = getFilteredRestaurants();

  return (
    <View style={styles.container}>
      <ScreenContainer
        scrollable={false}
        style={{ padding: 0 }}
      >
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => (item.id || item._id).toString()}
          renderItem={renderRestaurantCard}
          ListHeaderComponent={renderListHeader}
          refreshing={loading}
          onRefresh={() => dispatch(fetchFoods())}
          numColumns={2}
          columnWrapperStyle={styles.restaurantsGridRow}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              {loading ? (
                <ActivityIndicator color="#ff6b00" size="large" />
              ) : (
                <Text style={styles.emptyText}>No restaurants found matching this filter.</Text>
              )}
            </View>
          }
        />

        {/* Floating Cart Strip */}
        {cartItems.length > 0 && (
          <TouchableOpacity
            style={styles.cartStrip}
            onPress={() => navigation.navigate("Cart")}
          >
            <View style={styles.cartStripLeft}>
              <Text style={styles.cartStripQuantity}>
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
              </Text>
              <Text style={styles.cartStripPrice}>₹{cartTotalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.cartStripRight}>
              <Text style={styles.cartStripText}>View Cart</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        {/* Location Selection Bottom Sheet */}
        <LocationBottomSheet
          visible={locationSheetVisible}
          onClose={() => setLocationSheetVisible(false)}
        />
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
  },
  mainScrollContent: {
    paddingBottom: 80,
  },
  headerWrapper: {
    width: "100%",
  },
  pinkContainer: {
    backgroundColor: "#b3103f", // Crimson pink color matching reference
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 16,
    paddingBottom: 28,
    position: "relative",
    overflow: "hidden",
  },
  backgroundPatternContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.04,
    justifyContent: "center",
    alignItems: "center",
  },
  patternText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 56,
    transform: [{ rotate: "-15deg" }],
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  locationContainer: {
    flex: 1,
    marginRight: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 6,
    marginRight: 2,
  },
  locationSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  rightHeaderIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  buyOneBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    marginRight: 10,
  },
  buyOneText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
    marginRight: 2,
  },
  avatar: {
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    color: "#888",
    fontSize: 14,
  },
  micIcon: {
    marginLeft: 8,
  },
  vegToggleContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vegText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#4caf50",
    marginBottom: 2,
  },
  vegSwitch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
    height: 20,
    width: 32,
  },
  welcomeSection: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
  },
  welcomeName: {
    fontStyle: "italic",
    color: "#ffd54f", // Yellow foodie text
    fontWeight: "bold",
  },
  bannersGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bigBanner: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 24,
    padding: 16,
    justifyContent: "space-between",
    overflow: "hidden",
    height: 156,
  },
  bannerTextCol: {
    zIndex: 2,
  },
  bannerTag: {
    color: "#ffd54f",
    fontWeight: "bold",
    fontSize: 12,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  bannerBigImage: {
    position: "absolute",
    bottom: -10,
    right: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  bannerCol: {
    width: "49%",
    justifyContent: "space-between",
  },
  smallBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    height: 74,
  },
  bannerSmallTextCol: {
    flex: 1,
    zIndex: 2,
  },
  bannerSmallTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  bannerSmallDesc: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    marginTop: 2,
  },
  bannerSmallImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 8,
  },
  categoriesContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
  },
  categoryScrollContainer: {
    paddingVertical: 4,
  },
  categoryItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  categoryItemActive: {
    borderColor: "#ff6b00",
    backgroundColor: "#fffdfa",
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  categoryNameActive: {
    color: "#ff6b00",
  },
  fastDeliveryTitleContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  restaurantsGridRow: {
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  restaurantCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  imageContainer: {
    position: "relative",
    height: 120,
  },
  restaurantImage: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  discountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 6,
    borderRadius: 15,
  },
  cardContent: {
    padding: 10,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  metaRating: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#444",
    marginLeft: 2,
  },
  metaDot: {
    fontSize: 11,
    color: "#888",
    marginHorizontal: 4,
  },
  metaTime: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
  },
  cuisineText: {
    fontSize: 11,
    color: "#777",
    marginTop: 4,
  },
  emptyListContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
  },
  cartStrip: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "#ff6b00",
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cartStripLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartStripQuantity: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 8,
  },
  cartStripPrice: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cartStripRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartStripText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 6,
  },
});

export default HomeScreen;
