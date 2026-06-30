import React, { useEffect, useState, useRef } from "react";
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

const { width } = Dimensions.get("window");

// Enable LayoutAnimation for Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const HomeScreen = ({ navigation }) => {
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

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;

  // Load premium sections from backend
  const fetchPremiumSections = async () => {
    setLoadingSections(true);
    try {
      const [resBest, resNew, resHealthy, resCombos, resCategorized] = await Promise.all([
        api.get("/products/bestsellers"),
        api.get("/products/new-arrivals"),
        api.get("/products/healthy"),
        api.get("/products/combos"),
        api.get("/products/categorized")
      ]);
      setBestsellers(resBest.data.foods || []);
      setNewArrivals(resNew.data.foods || []);
      setHealthyMeals(resHealthy.data.foods || []);
      setCombos(resCombos.data.foods || []);
      setCategorizedMenu(resCategorized.data || []);
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

<<<<<<< HEAD
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
              color={favorited ? "#22C55E" : "#fff"}
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
=======
  const handleViewAllNewArrivals = () => {
    navigation.navigate("FoodListing", { filterType: "new-arrivals", title: "🌟 Fresh Arrivals" });
>>>>>>> e425c86c801fcd601a7e2e77e3c7d6edab9bb6f0
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
<<<<<<< HEAD
      <View style={styles.headerWrapper}>
        {/* Green Curved Header Section */}
        <View style={styles.headerContainer}>
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
                  <MaterialCommunityIcons name="fire" size={14} color="#22C55E" />
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
              <MaterialCommunityIcons name="microphone" size={22} color="#22C55E" style={styles.micIcon} />
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
=======
      <View style={styles.centerContainer}>
        <LoadingSkeleton type="feed" />
>>>>>>> e425c86c801fcd601a7e2e77e3c7d6edab9bb6f0
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
<<<<<<< HEAD
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              {loading ? (
                <ActivityIndicator color="#22C55E" size="large" />
              ) : (
                <Text style={styles.emptyText}>No restaurants found matching this filter.</Text>
              )}
            </View>
=======
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#FF6F61"]} />
>>>>>>> e425c86c801fcd601a7e2e77e3c7d6edab9bb6f0
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

                  <View style={styles.restaurantsHeader}>
                    <MaterialCommunityIcons name="silverware" size={20} color="#FF6F61" style={{ marginRight: 6 }} />
                    <Text style={styles.restaurantsTitle}>Matching Restaurants</Text>
                  </View>
                  {filteredRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id || restaurant._id}
                      restaurant={restaurant}
                      navigation={navigation}
                    />
                  ))}
                </>
              ) : (
                <>
                  {/* Dynamic Section 1: 🔥 Bestsellers */}
                  {bestsellers.length > 0 && (
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
                        {bestsellers.map((item) => (
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

                  {/* Dynamic Category Independent Grids (10 sections for home preview) */}
                  {categorizedMenu.slice(0, 10).map((group) => (
                    <View key={group.category._id || group.category.id} style={styles.categorizedSection}>
                      <View style={styles.sectionHeaderRow}>
                        <View style={styles.catHeaderLeft}>
                          <Image
                            source={{ uri: group.category.image || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=200&q=80" }}
                            style={styles.catImage}
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

                  {/* Restaurants Recommendation Section */}
                  <View style={styles.restaurantsHeader}>
                    <MaterialCommunityIcons name="silverware" size={20} color="#FF6F61" style={{ marginRight: 6 }} />
                    <Text style={styles.restaurantsTitle}>Recommended Restaurants</Text>
                  </View>

                  {filteredRestaurants.slice(0, 15).map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id || restaurant._id}
                      restaurant={restaurant}
                      navigation={navigation}
                    />
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
<<<<<<< HEAD
  headerContainer: {
    backgroundColor: "#16A34A", // Dark green color matching modern theme
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
=======
  centerContainer: {
    flex: 1,
>>>>>>> e425c86c801fcd601a7e2e77e3c7d6edab9bb6f0
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
<<<<<<< HEAD
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
    borderColor: "#22C55E",
    backgroundColor: "#DCFCE7",
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
    color: "#16A34A",
  },
  fastDeliveryTitleContainer: {
    marginTop: 24,
=======
>>>>>>> e425c86c801fcd601a7e2e77e3c7d6edab9bb6f0
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
<<<<<<< HEAD
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "#22C55E",
    padding: 14,
    borderRadius: 16,
=======
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#FF6F61",
    borderRadius: 12,
    height: 52,
>>>>>>> e425c86c801fcd601a7e2e77e3c7d6edab9bb6f0
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
    resizeMode: "cover",
  },
});

export default HomeScreen;
