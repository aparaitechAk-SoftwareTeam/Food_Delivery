import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Text, ActivityIndicator, IconButton, Card, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Redux Actions & Utilities
import { fetchFoods } from "../../redux/slices/foodsSlice";
import { fetchFavorites, fetchWishlist } from "../../redux/slices/wishlistSlice";
import { fetchAddresses } from "../../redux/slices/authSlice";
import api from "../../utils/api";

// Time-of-day
import { useTimeOfDay } from "../../hooks/useTimeOfDay";
import { filterFoodsByPeriod } from "../../utils/timeOfDay";

// Components
import ScreenContainer from "../../components/ScreenContainer";
import LocationBottomSheet from "../../components/LocationBottomSheet";
import Header from "../../components/Header";
import SearchBar from "../../components/SearchBar";
import BannerCarousel from "../../components/BannerCarousel";
import RewardCard from "../../components/RewardCard";
import CategorySlider from "../../components/CategorySlider";
import OfferStrip from "../../components/OfferStrip";
import FoodSection from "../../components/FoodSection";
import FoodCard from "../../components/FoodCard";
import RestaurantCard from "../../components/RestaurantCard";
import CouponBanner from "../../components/CouponBanner";
import FloatingMenu from "../../components/FloatingMenu";
import MembershipCard from "../../components/MembershipCard";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import TimeMealSection from "../../components/TimeMealSection";

const { width } = Dimensions.get("window");

// Enable LayoutAnimation for Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental && !global.nativeFabricUIManager && !global.RN$Bridgeless) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const categoryImageMap = {
  "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80",
  "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80",
  "biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4d8?auto=format&fit=crop&w=200&q=80",
  "chinese": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=200&q=80",
  "south indian": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=200&q=80",
  "desserts": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=200&q=80",
  "beverages": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=200&q=80",
  "breakfast": "https://images.unsplash.com/photo-1496042399014-dc73c4f2bde1?auto=format&fit=crop&w=200&q=80",
  "snacks": "https://images.unsplash.com/photo-1599490659213-e2b9527bb087?auto=format&fit=crop&w=200&q=80",
  "combos": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80",
};

const getCategoryImage = (item) => {
  if (!item) return { uri: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=200&q=80" };
  if (item.image) return { uri: item.image };
  const lowerName = (item.name || "").toLowerCase();
  if (categoryImageMap[lowerName]) {
    return { uri: categoryImageMap[lowerName] };
  }
  return { uri: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=200&q=80" };
};

const HomeScreen = ({ navigation }) => {
  // ── Time-of-day ────────────────────────────────────────────────────────────
  const timeInfo = useTimeOfDay();
  const dispatch = useDispatch();

  // Redux Selectors
  const { categories, restaurants, foods, loading, error } = useSelector((state) => state.foods);
  const { user, activeAddress, token } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const cartTotalAmount = useSelector((state) => state.cart.totalAmount);

  // States
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Premium scrollable sections states
  const [bestsellers, setBestsellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [healthyMeals, setHealthyMeals] = useState([]);
  const [combos, setCombos] = useState([]);
  const [categorizedMenu, setCategorizedMenu] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [wholesomeExpanded, setWholesomeExpanded] = useState(false);

  // ── Meal-time foods (memoised, re-derived when foods list or time period changes) ──
  const timeMealFoods = useMemo(() => {
    const allFoods = foods && foods.length > 0 ? foods : [];
    return filterFoodsByPeriod(allFoods, timeInfo.period).slice(0, 10);
  }, [foods, timeInfo.period]);

  // IDs already shown in the time section — used to avoid duplication in Bestsellers
  const timeMealIdSet = useMemo(
    () => new Set(timeMealFoods.map((f) => (f._id || f.id)?.toString())),
    [timeMealFoods]
  );

  const dedupedBestsellers = useMemo(
    () => bestsellers.filter((f) => !timeMealIdSet.has((f._id || f.id)?.toString())),
    [bestsellers, timeMealIdSet]
  );

  const computedCategorizedMenu = useMemo(() => {
    const cats = categories && categories.length > 0 ? categories : [];
    const allFoods = foods && foods.length > 0 ? foods : [];

    if (cats.length === 0) return [];

    return cats.map(cat => {
      const catFoods = allFoods.filter(f => {
        if (!f.category) return false;
        if (typeof f.category === "object") {
          return f.category._id === cat._id || f.category.id === cat.id || f.category.name?.toLowerCase() === cat.name?.toLowerCase();
        }
        return f.category === cat._id || f.category === cat.id || f.category?.toLowerCase() === cat.name?.toLowerCase();
      });

      return {
        category: cat,
        totalCount: catFoods.length,
        foods: catFoods.slice(0, 4)
      };
    }).filter(group => group.totalCount > 0);
  }, [categories, foods]);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;

  // Load premium sections from backend
  const fetchPremiumSections = async () => {
    setLoadingSections(true);
    try {
      const results = await Promise.allSettled([
        api.get("/products/bestsellers"),
        api.get("/products/new-arrivals"),
        api.get("/products/healthy"),
        api.get("/products/combos"),
        api.get("/products/categorized")
      ]);

      const bestsellersData = results[0].status === "fulfilled" ? (results[0].value.data.foods || []) : [];
      const newArrivalsData = results[1].status === "fulfilled" ? (results[1].value.data.foods || []) : [];
      const healthyMealsData = results[2].status === "fulfilled" ? (results[2].value.data.foods || []) : [];
      const combosData = results[3].status === "fulfilled" ? (results[3].value.data.foods || []) : [];
      const categorizedMenuData = results[4].status === "fulfilled" ? (results[4].value.data || []) : [];

      setBestsellers(bestsellersData);
      setNewArrivals(newArrivalsData);
      setHealthyMeals(healthyMealsData);
      setCombos(combosData);
      setCategorizedMenu(categorizedMenuData);

      // Log failures for debugging
      results.forEach((res, index) => {
        if (res.status === "rejected") {
          console.warn(`Premium API endpoint index ${index} failed:`, res.reason?.message);
        }
      });
    } catch (err) {
      console.log("Error loading premium sections:", err.message);
    } finally {
      setLoadingSections(false);
    }
  };

  const loadData = () => {
    dispatch(fetchFoods());
    fetchPremiumSections();
    if (token) {
      dispatch(fetchFavorites());
      dispatch(fetchAddresses());
      dispatch(fetchWishlist());
    }
  };

  useEffect(() => {
    loadData();
  }, [dispatch, token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchFoods()),
      fetchPremiumSections()
    ]);
    if (token) {
      await dispatch(fetchFavorites());
      await dispatch(fetchWishlist());
    }
    setRefreshing(false);
  };

  // Toggle see more / see less with smooth animation
  const handleToggleWholesome = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setWholesomeExpanded(!wholesomeExpanded);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery("");
  };

  // Local Search & Filtering fallback
  const getFilteredRestaurants = () => {
    let list = restaurants || [];
    if (selectedCategory) {
      const cat = selectedCategory.toLowerCase();
      list = list.filter((r) => {
        if (!r.cuisine) return r.name.toLowerCase().includes(cat);
        if (Array.isArray(r.cuisine)) {
          return r.cuisine.some((c) => c.toLowerCase() === cat) || r.name.toLowerCase().includes(cat);
        }
        return r.cuisine.toLowerCase().includes(cat) || r.name.toLowerCase().includes(cat);
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => {
        if (!r.cuisine) return r.name.toLowerCase().includes(q);
        if (Array.isArray(r.cuisine)) {
          return r.cuisine.some((c) => c.toLowerCase().includes(q)) || r.name.toLowerCase().includes(q);
        }
        return r.cuisine.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
      });
    }
    return list;
  };

  const getFilteredFoods = () => {
    let list = foods || [];
    if (selectedCategory) {
      list = list.filter((f) => f.category?.name.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) =>
        f.name.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  };

  const filteredRestaurants = getFilteredRestaurants();
  const filteredFoods = getFilteredFoods();

  const handleViewAllBestsellers = () => {
    navigation.navigate("FoodListing", { filterType: "bestsellers", title: "🔥 Bestsellers" });
  };

  const handleViewAllNewArrivals = () => {
    navigation.navigate("FoodListing", { filterType: "new-arrivals", title: "🌟 Fresh Arrivals" });
  };

  const handleViewAllCombos = () => {
    navigation.navigate("FoodListing", { filterType: "combos", title: "🍱 Curated Combos" });
  };

  const handleViewAllCategory = (catName) => {
    navigation.navigate("FoodListing", { filterType: "category", category: catName, title: catName });
  };

  // Loading & Error States
  if (loading && !refreshing && restaurants.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSkeleton type="feed" />
      </View>
    );
  }

  if (error && restaurants.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ErrorState onRetry={loadData} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Sticky Header */}
        <Header
          activeAddress={activeAddress}
          onAddressPress={() => setLocationSheetVisible(true)}
          onNotificationPress={() => Alert.alert("Notifications", "No new notifications.")}
          onProfilePress={() => {
            if (!token) {
              navigation.navigate("Login", { redirectTo: "Main", redirectTab: "Profile" });
            } else {
              navigation.navigate("Profile");
            }
          }}
          onWalletPress={() => Alert.alert("Wallet", "Wallet balance: ₹500 (mock)")}
          user={user}
        />

        {/* Scrollable Area */}
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#FF6F61"]} />
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* Search Section */}
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSubmit={() => {
              if (searchQuery) {
                navigation.navigate("FoodListing", { searchQuery });
              }
            }}
          />

          {/* Banners & Cards Grid */}
          {!searchQuery && !selectedCategory ? (
            <>
              <BannerCarousel
                onBannerPress={(banner) => {
                  setSelectedCategory(banner.cta);
                }}
              />
              <RewardCard
                onClaim={() => Alert.alert("Congratulations!", "₹50 Coupon code applied.")}
              />
              <OfferStrip
                onPressItem={(item) => {
                  Alert.alert(item.title, item.desc);
                }}
              />
            </>
          ) : null}

          {/* Categories Horizontal Chip Slider */}
          <CategorySlider
            categories={categories.slice(0, 25)}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(selectedCategory === cat.name ? null : cat.name);
            }}
          />

          {/* Main Feed Content */}
          {filteredRestaurants.length === 0 && filteredFoods.length === 0 ? (
            <EmptyState onAction={handleClearFilters} />
          ) : (
            <>
              {/* If search query is active, display matching grid */}
              {(searchQuery || selectedCategory) ? (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Matching Foods</Text>
                  </View>
                  <View style={styles.foodGridRow}>
                    {filteredFoods.map((item) => (
                      <FoodCard key={item.id || item._id} food={item} navigation={navigation} />
                    ))}
                  </View>
                </>
              ) : (
                <>

                  {/* Dynamic Section 1: 🔥 Bestsellers (deduped) */}
                  {dedupedBestsellers.length > 0 && (
                    <View style={styles.premiumSection}>
                      <View style={styles.sectionHeaderRow}>
                        <View>
                          <Text style={styles.sectionTitle}>🔥 Bestsellers</Text>
                          <Text style={styles.sectionSubtitle}>Most loved dishes near you</Text>
                        </View>
                        <TouchableOpacity onPress={handleViewAllBestsellers}>
                          <Text style={styles.viewAllLink}>View All</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                        {dedupedBestsellers.map((item) => (
                          <FoodCard key={item.id || item._id} food={item} navigation={navigation} />
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Dynamic Section 2: 🌟 Fresh Arrivals */}
                  {newArrivals.length > 0 && (
                    <View style={styles.premiumSection}>
                      <View style={styles.sectionHeaderRow}>
                        <View>
                          <Text style={styles.sectionTitle}>🌟 Fresh Arrivals</Text>
                          <Text style={styles.sectionSubtitle}>Recently added dishes</Text>
                        </View>
                        <TouchableOpacity onPress={handleViewAllNewArrivals}>
                          <Text style={styles.viewAllLink}>View All</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                        {newArrivals.map((item) => (
                          <FoodCard key={item.id || item._id} food={item} navigation={navigation} />
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Membership Card Banner */}
                  <MembershipCard
                    onPress={() => Alert.alert("Gold Program", "Join Gold Membership today for free deliveries!")}
                  />

                  {/* Dynamic Section 3: 🥗 Wholesome Meals (With height animation collapse) */}
                  {healthyMeals.length > 0 && (
                    <View style={styles.premiumSection}>
                      <View style={styles.sectionHeaderRow}>
                        <View>
                          <Text style={styles.sectionTitle}>🥗 Wholesome Meals</Text>
                          <Text style={styles.sectionSubtitle}>Healthy, nutritious & balanced meals</Text>
                        </View>
                      </View>
                      
                      <View style={styles.gridContainer}>
                        {(wholesomeExpanded ? healthyMeals : healthyMeals.slice(0, 6)).map((item) => (
                          <View key={item.id || item._id} style={styles.gridHalfCol}>
                            <FoodCard food={item} navigation={navigation} />
                          </View>
                        ))}
                      </View>

                      {healthyMeals.length > 6 && (
                        <Button
                          mode="outlined"
                          onPress={handleToggleWholesome}
                          style={styles.seeMoreBtn}
                          textColor="#FF6F61"
                        >
                          {wholesomeExpanded ? "Show Less" : "See More"}
                        </Button>
                      )}
                    </View>
                  )}

                  {/* Dynamic Section 4: 🍱 Curated Combos */}
                  {combos.length > 0 && (
                    <View style={styles.premiumSection}>
                      <View style={styles.sectionHeaderRow}>
                        <View>
                          <Text style={styles.sectionTitle}>🍱 Curated Combos</Text>
                          <Text style={styles.sectionSubtitle}>Perfect meal combinations</Text>
                        </View>
                        <TouchableOpacity onPress={handleViewAllCombos}>
                          <Text style={styles.viewAllLink}>View All</Text>
                        </TouchableOpacity>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                        {combos.map((item) => (
                          <FoodCard key={item.id || item._id} food={item} navigation={navigation} />
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Dynamic Category Independent Grids */}
                  {computedCategorizedMenu.map((group) => (
                    <View key={group.category._id || group.category.id} style={styles.categorizedSection}>
                      <View style={styles.sectionHeaderRow}>
                        <View style={styles.catHeaderLeft}>
                          <Image
                            source={getCategoryImage(group.category)}
                            style={styles.catImage}
                            resizeMode="cover"
                          />
                          <View style={styles.catHeaderTextCol}>
                            <Text style={styles.catTitle}>{group.category.name}</Text>
                            <Text style={styles.catCount}>{group.totalCount} options available</Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => handleViewAllCategory(group.category.name)}>
                          <Text style={styles.viewAllLink}>View All</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.gridContainer}>
                        {group.foods.map((item) => (
                          <View key={item.id || item._id} style={styles.gridHalfCol}>
                            <FoodCard food={item} navigation={navigation} />
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}

                </>
              )}
            </>
          )}

          {/* Footer Info */}
          <View style={styles.footer}>
            <View style={styles.footerLinks}>
              <Text style={styles.footerLinkText}>About</Text>
              <Text style={styles.footerDot}>•</Text>
              <Text style={styles.footerLinkText}>Support</Text>
              <Text style={styles.footerDot}>•</Text>
              <Text style={styles.footerLinkText}>Terms</Text>
              <Text style={styles.footerDot}>•</Text>
              <Text style={styles.footerLinkText}>Privacy</Text>
            </View>
            <Text style={styles.footerVersion}>FoodExpress v2.1.2 • Made with ❤️</Text>
          </View>
        </Animated.ScrollView>

        {/* Sticky Coupon Banner (disappears on scroll) */}
        {cartItems.length === 0 && (
          <CouponBanner
            scrollY={scrollY}
            onPress={() => Alert.alert("Promo Applied", "Flat ₹150 OFF coupon automatically added at checkout.")}
          />
        )}

        {/* Floating Category Menu Jump-scroll */}
        <FloatingMenu
          categories={categories.slice(0, 15)}
          onSelectCategory={(cat) => {
            handleViewAllCategory(cat.name);
          }}
        />

        {/* Floating Cart Strip */}
        {cartItems.length > 0 && (
          <TouchableOpacity
            style={styles.cartStrip}
            onPress={() => navigation.navigate("Cart")}
            activeOpacity={0.9}
          >
            <View style={styles.cartStripLeft}>
              <View style={styles.cartIconWrapper}>
                <MaterialCommunityIcons name="shopping" size={18} color="#FF6F61" />
              </View>
              <View>
                <Text style={styles.cartQtyText}>
                  {cartItems.reduce((sum, i) => sum + i.quantity, 0)} items added
                </Text>
                <Text style={styles.cartRestText}>{cartItems[0]?.restaurantName || "FoodExpress"}</Text>
              </View>
            </View>
            <View style={styles.cartStripRight}>
              <Text style={styles.cartViewText}>View Cart • ₹{cartTotalAmount}</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* Location Sheet */}
        <LocationBottomSheet
          visible={locationSheetVisible}
          onClose={() => setLocationSheetVisible(false)}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 96,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  premiumSection: {
    marginVertical: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1D2939",
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#667085",
    marginTop: 2,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF6F61",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  horizontalList: {
    paddingLeft: 8,
    paddingRight: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    justifyContent: "space-between",
  },
  gridHalfCol: {
    width: "48%",
    alignItems: "center",
    marginBottom: 8,
  },
  seeMoreBtn: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    borderColor: "#FF6F61",
  },
  categorizedSection: {
    marginVertical: 14,
    borderTopWidth: 8,
    borderTopColor: "#F9FAFB",
    paddingTop: 14,
  },
  catHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  catIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  catHeaderTextCol: {
    flex: 1,
  },
  catTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1D2939",
  },
  catCount: {
    fontSize: 11,
    color: "#667085",
    marginTop: 1,
  },
  restaurantsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    borderTopWidth: 8,
    borderTopColor: "#F9FAFB",
    paddingTop: 20,
  },
  restaurantsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1D2939",
  },
  foodGridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F2F4F7",
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  footerLinkText: {
    fontSize: 11,
    color: "#667085",
    fontWeight: "500",
  },
  footerDot: {
    marginHorizontal: 8,
    color: "#D0D5DD",
    fontSize: 8,
  },
  footerVersion: {
    fontSize: 10,
    color: "#98A2B3",
  },
  cartStrip: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#FF6F61",
    borderRadius: 12,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cartStripLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cartQtyText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cartRestText: {
    fontSize: 10,
    color: "#FFEAEA",
    marginTop: 1,
  },
  cartStripRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartViewText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginRight: 4,
  },
  catImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 10,
  },
});

export default HomeScreen;
