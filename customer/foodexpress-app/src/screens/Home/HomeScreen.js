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
  Modal,
  Easing,
} from "react-native";
import { Text, ActivityIndicator, IconButton, Card, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../../constants/ThemeContext";

// Redux Actions & Utilities
import { fetchFoods } from "../../redux/slices/foodsSlice";
import { fetchFavorites, fetchWishlist } from "../../redux/slices/wishlistSlice";
import { fetchAddresses, fetchUserProfile } from "../../redux/slices/authSlice";
import { fetchRewardStatus, claimReward } from "../../redux/slices/rewardSlice";
import api from "../../utils/api";
import bannerService from "../../services/bannerService";
import sectionService from "../../services/sectionService";
import { CameraView, useCameraPermissions } from "expo-camera";

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
  const dispatch = useDispatch();
  const { isDark, theme } = useThemeContext();

  // Redux Selectors
  const { categories: rawCategories, restaurants, foods, loading, error } = useSelector((state) => state.foods);
  const categories = useMemo(() => (rawCategories || []).filter(c => c && c.isVisible !== false), [rawCategories]);
  const { user, activeAddress, token } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const cartTotalAmount = useSelector((state) => state.cart.totalAmount);
  const { reward, progress, remainingTime, status: rewardStatus } = useSelector((state) => state.rewards);

  // States
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [banners, setBanners] = useState([]);
  const [featuredSections, setFeaturedSections] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [homeSections, setHomeSections] = useState([]);

  // Camera & Voice states
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [wholesomeExpanded, setWholesomeExpanded] = useState(false);

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

  const fetchBanners = async () => {
    try {
      const data = await bannerService.getBanners();
      setBanners(data || []);
    } catch (err) {
      console.log("Error loading banners:", err.message);
    }
  };

  const fetchFeaturedSections = async () => {
    try {
      const data = await sectionService.getSections();
      setFeaturedSections(data || []);
    } catch (err) {
      console.log("Error loading featured sections:", err.message);
    }
  };

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get("/coupons");
      setCoupons(data || []);
    } catch (err) {
      console.log("Error loading coupons:", err.message);
    }
  };

  const fetchHomeSections = async () => {
    try {
      const { data } = await api.get("/home-sections");
      setHomeSections(Array.isArray(data) ? data.sort((a, b) => a.displayOrder - b.displayOrder) : []);
    } catch (err) {
      console.log("Error loading home sections:", err.message);
    }
  };

  const startListening = () => {
    setIsListening(true);
    setRecognizedText("Listening...");
    
    pulseAnim.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      const foodOptions = ["Chicken Biryani", "Double Cheese Pizza", "Healthy Salad", "Chocolate Waffle", "Paneer Tikka"];
      const randomFood = foodOptions[Math.floor(Math.random() * foodOptions.length)];
      setRecognizedText(`"${randomFood}"`);
      setIsListening(false);
      
      setTimeout(() => {
        setVoiceModalVisible(false);
        setSearchQuery(randomFood);
        navigation.navigate("FoodListing", { searchQuery: randomFood });
      }, 1200);
    }, 2500);
  };

  const handleVoicePress = () => {
    setVoiceModalVisible(true);
    startListening();
  };

  const handleScanPress = async () => {
    if (!permission) {
      return;
    }
    if (!permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Permission Required", "Camera permission is needed to scan QR codes.");
        return;
      }
    }
    setScanned(false);
    setQrModalVisible(true);
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setQrModalVisible(false);
    
    const scannedCode = (data || "").trim();
    Alert.alert(
      "QR Code Scanned",
      `Coupon Code: "${scannedCode}"`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Copy & Use Coupon",
          onPress: () => {
            setSearchQuery(scannedCode);
            Alert.alert("Coupon Saved", `Coupon "${scannedCode}" set! You can paste/apply it in checkout.`);
          }
        }
      ]
    );
  };

  const loadData = (initial = false) => {
    dispatch(fetchFoods({ limit: 1000 }));
    fetchBanners();
    fetchFeaturedSections();
    fetchCoupons();
    fetchHomeSections();
    if (token) {
      dispatch(fetchRewardStatus());
      if (initial) {
        dispatch(fetchUserProfile());
        dispatch(fetchAddresses());
      }
      dispatch(fetchFavorites());
      dispatch(fetchWishlist());
    }
  };

  useEffect(() => {
    loadData(true);
  }, [dispatch, token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchFoods({ limit: 1000 })),
      fetchBanners(),
      fetchFeaturedSections(),
      fetchHomeSections()
    ]);
    if (token) {
      await Promise.all([
        dispatch(fetchFavorites()),
        dispatch(fetchWishlist()),
        dispatch(fetchRewardStatus())
      ]);
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

  const getExtendedCategories = () => {
    const list = [...(categories || [])];
    const hasCombos = list.some((c) => (c.name || "").toLowerCase() === "combos");
    if (!hasCombos) {
      list.push({
        _id: "virtual-combos-id",
        id: "virtual-combos-id",
        name: "Combos",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80",
      });
    }
    return list;
  };

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
    if (catName?.toLowerCase() === "combos") {
      handleViewAllCombos();
    } else {
      navigation.navigate("FoodListing", { filterType: "category", category: catName, title: catName });
    }
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}>
        {/* Sticky Header */}
        <Header
          activeAddress={activeAddress}
          onAddressPress={() => setLocationSheetVisible(true)}
          onNotificationPress={() => {
            navigation.navigate("Notifications");
          }}
          onProfilePress={() => {
            if (!token) {
              navigation.navigate("Login", { redirectTo: "Main", redirectTab: "Profile" });
            } else {
              navigation.navigate("Profile");
            }
          }}
          onWalletPress={() => {
            if (!token) {
              Alert.alert("FE Wallet", "Please log in to view your wallet balance.");
              return;
            }
            const balance = user?.walletBalance !== undefined ? user.walletBalance : 150.00;
            Alert.alert("FE Wallet", `Wallet balance: ₹${balance.toFixed(2)}`);
          }}
          onCouponsPress={() => {
            if (coupons.length === 0) {
              Alert.alert("Active Coupons", "No active coupons available at the moment.");
              return;
            }
            const couponList = coupons
              .map(c => `• ${c.code}: ${c.discountType === "percentage" ? `${c.value}% OFF` : `₹${c.value} OFF`}${c.minOrderAmount ? ` (Min order: ₹${c.minOrderAmount})` : ""}`)
              .join("\n\n");
            Alert.alert("Active Coupons", couponList);
          }}
          user={user}
          walletBalance={user?.walletBalance !== undefined ? user.walletBalance : 150.00}
          activeCouponsCount={coupons.length}
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
            onVoicePress={handleVoicePress}
            onScanPress={handleScanPress}
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
                banners={banners}
                onBannerPress={(banner) => {
                  if (banner.redirectType === "Foods" || (banner.foods && banner.foods.length > 0)) {
                    navigation.navigate("FoodListing", {
                      filterType: "banner",
                      foods: banner.foods,
                      discountPercentage: banner.discountPercentage || 0,
                      category: banner.title || "Special Deals",
                      bannerImage: banner.image
                    });
                  } else {
                    setSelectedCategory(banner.cta);
                  }
                }}
              />
              {token && reward ? (
                <RewardCard
                  reward={reward}
                  onClaim={() => {
                    dispatch(claimReward())
                      .unwrap()
                      .then((res) => {
                        Alert.alert(
                          "🎉 Congratulations!",
                          `Your ₹${res?.coupon?.value || reward?.cashbackAmount || 150} Cashback Coupon has been added to your Wallet.`,
                          [{ text: "OK", onPress: () => dispatch(fetchRewardStatus()) }]
                        );
                        dispatch(fetchUserProfile());
                      })
                      .catch((err) => {
                        Alert.alert("Error", err || "Failed to claim cashback");
                      });
                  }}
                />
              ) : null}
              <OfferStrip
                onPressItem={(item) => {
                  if (item.id === "membership") {
                    navigation.navigate("GoldMembership");
                  } else if (item.id === "referral") {
                    navigation.navigate("Referral");
                  } else if (item.id === "cashback") {
                    navigation.navigate("CashbackDeals");
                  }
                }}
              />
            </>
          ) : null}

          {/* Categories Horizontal Chip Slider */}
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
                  {/* Dynamic Server-Driven Home Layout Sections */}
                  {homeSections.map((sec) => {
                    if (!sec.isVisible) return null;

                    switch (sec.key) {
                      case "banners":
                        return (
                          <BannerCarousel
                            key={sec.key}
                            banners={banners}
                            onBannerPress={(banner) => {
                              if (banner.redirectType === "Foods" || (banner.foods && banner.foods.length > 0)) {
                                navigation.navigate("FoodListing", {
                                  filterType: "banner",
                                  foods: banner.foods,
                                  discountPercentage: banner.discountPercentage || 0,
                                  category: banner.title || "Special Deals",
                                  bannerImage: banner.image
                                });
                              } else {
                                setSelectedCategory(banner.cta);
                              }
                            }}
                          />
                        );

                      case "categories":
                        return (
                          <CategorySlider
                            key={sec.key}
                            categories={getExtendedCategories().slice(0, 25)}
                            selectedCategory={selectedCategory}
                            onSelectCategory={(cat) => {
                              if (cat.name?.toLowerCase() === "combos") {
                                handleViewAllCombos();
                              } else {
                                setSelectedCategory(selectedCategory === cat.name ? null : cat.name);
                              }
                            }}
                          />
                        );

                      case "featured_restaurants": {
                        const featuredRests = restaurants.filter(r => r.isFeatured && r.isActive !== false);
                        if (featuredRests.length === 0) return null;
                        return (
                          <View key={sec.key} style={styles.premiumSection}>
                            <View style={styles.sectionHeaderRow}>
                              <Text style={styles.sectionTitle}>{sec.title}</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                              {featuredRests.sort((a,b) => b.priority - a.priority).map((rest) => (
                                <RestaurantCard key={rest._id || rest.id} restaurant={rest} navigation={navigation} />
                              ))}
                            </ScrollView>
                          </View>
                        );
                      }

                      case "popular_foods": {
                        const popularFoodsList = foods.filter(f => f.isPopular && f.isAvailable !== false);
                        if (popularFoodsList.length === 0) return null;
                        return (
                          <View key={sec.key} style={styles.premiumSection}>
                            <View style={styles.sectionHeaderRow}>
                              <Text style={styles.sectionTitle}>{sec.title}</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                              {popularFoodsList.sort((a,b) => b.sortOrder - a.sortOrder).map((item) => (
                                <FoodCard key={item._id || item.id} food={item} navigation={navigation} />
                              ))}
                            </ScrollView>
                          </View>
                        );
                      }

                      case "recommended_items": {
                        const recommendedFoods = foods.filter(f => f.isRecommended && f.isAvailable !== false);
                        if (recommendedFoods.length === 0) return null;
                        return (
                          <View key={sec.key} style={styles.premiumSection}>
                            <View style={styles.sectionHeaderRow}>
                              <Text style={styles.sectionTitle}>{sec.title}</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                              {recommendedFoods.sort((a,b) => b.sortOrder - a.sortOrder).map((item) => (
                                <FoodCard key={item._id || item.id} food={item} navigation={navigation} />
                              ))}
                            </ScrollView>
                          </View>
                        );
                      }

                      case "offers":
                        return (
                          <OfferStrip
                            key={sec.key}
                            onPressItem={(item) => {
                              if (item.id === "membership") {
                                navigation.navigate("GoldMembership");
                              } else if (item.id === "referral") {
                                navigation.navigate("Referral");
                              } else if (item.id === "cashback") {
                                navigation.navigate("CashbackDeals");
                              }
                            }}
                          />
                        );

                      case "coupons":
                        if (coupons.length === 0) return null;
                        return (
                          <View key={sec.key} style={{ marginHorizontal: 16, marginVertical: 12 }}>
                            <Button 
                              mode="outlined" 
                              textColor="#FF6F61" 
                              style={{ borderColor: "#FF6F61", borderRadius: 12 }}
                              onPress={() => {
                                const couponList = coupons
                                  .map(c => `• ${c.code}: ${c.discountType === "percentage" ? `${c.value}% OFF` : `₹${c.value} OFF`}${c.minOrderAmount ? ` (Min order: ₹${c.minOrderAmount})` : ""}`)
                                  .join("\n\n");
                                Alert.alert("Active Coupons", couponList);
                              }}
                            >
                              🎉 View Active Coupons ({coupons.length})
                            </Button>
                          </View>
                        );

                      case "trending_restaurants": {
                        const trendingRests = restaurants.filter(r => r.isTrending && r.isActive !== false);
                        if (trendingRests.length === 0) return null;
                        return (
                          <View key={sec.key} style={styles.premiumSection}>
                            <View style={styles.sectionHeaderRow}>
                              <Text style={styles.sectionTitle}>{sec.title}</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                              {trendingRests.sort((a,b) => b.priority - a.priority).map((rest) => (
                                <RestaurantCard key={rest._id || rest.id} restaurant={rest} navigation={navigation} />
                              ))}
                            </ScrollView>
                          </View>
                        );
                      }

                      case "new_arrivals": {
                        const newRests = restaurants.filter(r => r.isNewRestaurant && r.isActive !== false);
                        if (newRests.length === 0) return null;
                        return (
                          <View key={sec.key} style={styles.premiumSection}>
                            <View style={styles.sectionHeaderRow}>
                              <Text style={styles.sectionTitle}>{sec.title}</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                              {newRests.sort((a,b) => b.priority - a.priority).map((rest) => (
                                <RestaurantCard key={rest._id || rest.id} restaurant={rest} navigation={navigation} />
                              ))}
                            </ScrollView>
                          </View>
                        );
                      }

                      case "top_rated": {
                        const topFoods = foods.filter(f => f.rating >= 4.5 && f.isAvailable !== false);
                        if (topFoods.length === 0) return null;
                        return (
                          <View key={sec.key} style={styles.premiumSection}>
                            <View style={styles.sectionHeaderRow}>
                              <Text style={styles.sectionTitle}>{sec.title}</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                              {topFoods.map((item) => (
                                <FoodCard key={item._id || item.id} food={item} navigation={navigation} />
                              ))}
                            </ScrollView>
                          </View>
                        );
                      }

                      case "best_sellers": {
                        const bestSellerFoods = foods.filter(f => f.isBestSeller && f.isAvailable !== false);
                        if (bestSellerFoods.length === 0) return null;
                        return (
                          <View key={sec.key} style={styles.premiumSection}>
                            <View style={styles.sectionHeaderRow}>
                              <Text style={styles.sectionTitle}>{sec.title}</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                              {bestSellerFoods.sort((a,b) => b.sortOrder - a.sortOrder).map((item) => (
                                <FoodCard key={item._id || item.id} food={item} navigation={navigation} />
                              ))}
                            </ScrollView>
                          </View>
                        );
                      }

                      case "recently_added": {
                        const recentFoods = [...foods].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
                        if (recentFoods.length === 0) return null;
                        return (
                          <View key={sec.key} style={styles.premiumSection}>
                            <View style={styles.sectionHeaderRow}>
                              <Text style={styles.sectionTitle}>{sec.title}</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                              {recentFoods.map((item) => (
                                <FoodCard key={item._id || item.id} food={item} navigation={navigation} />
                              ))}
                            </ScrollView>
                          </View>
                        );
                      }

                      case "membership":
                        return (
                          <MembershipCard
                            key={sec.key}
                            onPress={() => navigation.navigate("GoldMembership")}
                          />
                        );

                      case "referral":
                        return token && reward ? (
                          <RewardCard
                            key={sec.key}
                            reward={reward}
                            onClaim={() => {
                              dispatch(claimReward())
                                .unwrap()
                                .then((res) => {
                                  Alert.alert(
                                    "🎉 Congratulations!",
                                    `Your ₹${res?.coupon?.value || reward?.cashbackAmount || 150} Cashback Coupon has been added to your Wallet.`,
                                    [{ text: "OK", onPress: () => dispatch(fetchRewardStatus()) }]
                                  );
                                  dispatch(fetchUserProfile());
                                })
                                .catch((err) => {
                                  Alert.alert("Error", err || "Failed to claim cashback");
                                });
                            }}
                          />
                        ) : null;

                      default:
                        return null;
                    }
                  })}

                  {/* Fallback categorized category grid if homeSections config not yet loaded */}
                  {homeSections.length === 0 && computedCategorizedMenu.map((group) => (
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

                  {/* Render custom sections from MongoDB */}
                  {featuredSections.map((sec) => {
                    const secId = sec._id || sec.id;
                    const secItems = sec.items || [];
                    if (secItems.length === 0) return null;
                    return (
                      <View key={secId} style={styles.premiumSection}>
                        <View style={styles.sectionHeaderRow}>
                          <View>
                            <Text style={styles.sectionTitle}>{sec.title}</Text>
                            <Text style={styles.sectionSubtitle}>{sec.subtitle || ""}</Text>
                          </View>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                          {secItems.map((item) => (
                            <FoodCard key={item._id || item.id} food={item} navigation={navigation} />
                          ))}
                        </ScrollView>
                      </View>
                    );
                  })}
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
          categories={getExtendedCategories().slice(0, 15)}
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

        {/* QR Scanner Modal */}
        <Modal
          visible={qrModalVisible}
          onRequestClose={() => setQrModalVisible(false)}
          animationType="slide"
        >
          <SafeAreaView style={styles.scannerContainer}>
            {qrModalVisible && (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
            )}
            {/* Overlay mask */}
            <View style={styles.overlayContainer}>
              <View style={styles.unfocusedContainer} />
              <View style={styles.middleRow}>
                <View style={styles.unfocusedContainer} />
                <View style={styles.focusedContainer}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <View style={styles.unfocusedContainer} />
              </View>
              <View style={styles.unfocusedContainer} />
            </View>

            {/* Header/Footer Controls */}
            <View style={styles.scannerHeader}>
              <Text style={styles.scannerTitle}>Scan QR Code</Text>
              <Text style={styles.scannerSubtitle}>Align QR code inside the box to scan</Text>
            </View>

            <TouchableOpacity style={styles.closeScannerButton} onPress={() => setQrModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>

        {/* Voice Search Modal */}
        <Modal
          visible={voiceModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setVoiceModalVisible(false)}
        >
          <View style={styles.voiceModalContainer}>
            <Animated.View style={[styles.voicePulseCircle, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.voicePulseCircleInner}>
                <MaterialCommunityIcons name="microphone" size={32} color="#FFFFFF" />
              </View>
            </Animated.View>
            <Text style={styles.voiceText}>{recognizedText}</Text>
            <Text style={styles.voiceSubtext}>
              {isListening ? "Listening for your food cravings..." : "Recognized! Redirecting..."}
            </Text>
            
            <TouchableOpacity 
              style={[styles.closeScannerButton, { top: 50, right: 20 }]} 
              onPress={() => setVoiceModalVisible(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Modal>
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
    paddingTop: Platform.OS === "android" ? 12 : 6,
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
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  middleRow: {
    flexDirection: "row",
    height: 250,
  },
  focusedContainer: {
    width: 250,
    position: "relative",
    backgroundColor: "transparent",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#FF6F61",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerHeader: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  scannerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 8,
  },
  closeScannerButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  voiceModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  voicePulseCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255, 111, 97, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  voicePulseCircleInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FF6F61",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#FF6F61",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voiceText: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 30,
  },
  voiceSubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 12,
    textAlign: "center",
  },
});

export default HomeScreen;
