import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
  Linking,
} from "react-native";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import {
  Text,
  Card,
  Searchbar,
  Chip,
  ActivityIndicator,
  IconButton,
  Button,
  Divider,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fetchFoods } from "../../redux/slices/foodsSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import { toggleFavoriteRestaurant, fetchFavorites, addFoodToWishlist, removeFoodFromWishlist } from "../../redux/slices/wishlistSlice";
import FilterDrawer from "../../components/FilterDrawer";
import FoodCard from "../../components/FoodCard";
import api from "../../utils/api";

const FoodListingScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();

  // Redux Selectors
  const { categories: rawCategories, loading } = useSelector((state) => state.foods);
  const categories = useMemo(() => (rawCategories || []).filter(c => c && c.isVisible !== false), [rawCategories]);
  const { favorites, items: wishlistItems } = useSelector((state) => state.wishlist);
  const { token } = useSelector((state) => state.auth);

  // Pagination & Filtering Local States
  const [foodsList, setFoodsList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationLoading, setPaginationLoading] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    category: route.params?.category || "",
    price: "",
    rating: "",
    deliveryTime: "",
    discount: "",
    restaurantType: "",
    isOpen: "",
    vegType: "",
    sort: "recommended",
  });

  // Modal Visibilities
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [isGridView, setIsGridView] = useState(false);

  // Load initial route parameters
  useEffect(() => {
    if (route.params?.category && route.params?.filterType === "category") {
      setActiveFilters((prev) => ({ ...prev, category: route.params.category }));
    } else if (route.params?.restaurant) {
      setSearchQuery(route.params.restaurant);
    }
  }, [route.params]);

  // Load pages when search query or filters change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadFoods(1, true);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeFilters]);

  // Fetch foods with page pagination
  const loadFoods = async (page = 1, shouldReset = false) => {
    if (page > 1 && paginationLoading) return;
    
    if (page === 1) {
      setPaginationLoading(false);
    } else {
      setPaginationLoading(true);
    }

    const filterType = route.params?.filterType;
    if (filterType === "banner") {
      const bannerFoods = route.params?.foods || [];
      const bannerDiscount = route.params?.discountPercentage || 0;
      
      let finalFoods = [];
      if (bannerFoods.length > 0 && typeof bannerFoods[0] === "string") {
        try {
          const { data } = await api.get(`/foods?ids=${bannerFoods.join(",")}`);
          const fetchedFoods = data.foods || [];
          // Filter locally to be 100% safe in case the backend ignored the 'ids' parameter (e.g. Render fallback)
          finalFoods = fetchedFoods.filter(f => bannerFoods.includes(f._id || f.id));
        } catch (err) {
          console.log("Error fetching banner foods by IDs:", err);
        }
      } else {
        finalFoods = bannerFoods.filter(food => food && typeof food === "object" && (food.id || food._id));
      }

      let processedFoods = finalFoods.map(food => {
        if (bannerDiscount > 0) {
          const originalPrice = food.price;
          const discountedPrice = Math.round(originalPrice * (1 - bannerDiscount / 100));
          return {
            ...food,
            originalPrice: originalPrice,
            price: discountedPrice,
            discountPercentage: bannerDiscount
          };
        }
        return food;
      });

      if (searchQuery) {
        processedFoods = processedFoods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }

      setFoodsList(processedFoods);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalCount(processedFoods.length);
      setPaginationLoading(false);
      return;
    }

    let endpoint = "/foods";
    if (filterType === "bestsellers") endpoint = "/products/bestsellers";
    else if (filterType === "new-arrivals") endpoint = "/products/new-arrivals";
    else if (filterType === "healthy") endpoint = "/products/healthy";
    else if (filterType === "combos") endpoint = "/products/combos";
    else if (filterType === "category") endpoint = `/products/category/${route.params?.category}`;
    else if (filterType === "cuisine") endpoint = `/products/cuisine/${route.params?.cuisine}`;

    const params = {
      q: searchQuery || undefined,
      category: activeFilters.category || undefined,
      price: activeFilters.price || undefined,
      rating: activeFilters.rating || undefined,
      deliveryTime: activeFilters.deliveryTime || undefined,
      discount: activeFilters.discount || undefined,
      restaurantType: activeFilters.restaurantType || undefined,
      isOpen: activeFilters.isOpen || undefined,
      vegType: activeFilters.vegType || undefined,
      sort: activeFilters.sort !== "recommended" ? activeFilters.sort : undefined,
      page,
      limit: 15,
    };

    try {
      let response;
      if (filterType) {
        const { data } = await api.get(endpoint, { params });
        response = data;
      } else {
        response = await dispatch(fetchFoods(params)).unwrap();
      }
      const newFoods = response.foods || [];
      
      if (shouldReset || page === 1) {
        setFoodsList(newFoods);
      } else {
        setFoodsList((prev) => [...prev, ...newFoods]);
      }
      
      setCurrentPage(response.page || 1);
      setTotalPages(response.pages || 1);
      setTotalCount(response.total || 0);
    } catch (err) {
      // fail silently
    } finally {
      setPaginationLoading(false);
    }
  };

  const handleEndReached = () => {
    if (currentPage < totalPages && !loading && !paginationLoading) {
      loadFoods(currentPage + 1, false);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setActiveFilters((prev) => ({ ...prev, ...newFilters }));
    setFilterDrawerVisible(false);
  };

  const handleResetFilters = () => {
    setActiveFilters({
      category: "",
      price: "",
      rating: "",
      deliveryTime: "",
      discount: "",
      restaurantType: "",
      isOpen: "",
      vegType: "",
      sort: "recommended",
    });
    setSearchQuery("");
  };

  const toggleFavorite = (item) => {
    if (!token) {
      Alert.alert(
        "Login Required",
        "Please log in to add items to your wishlist.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login", { redirectTo: "FoodListing", redirectParams: route.params }) }
        ]
      );
      return;
    }
    const fid = item.id || item._id;
    if (isFavorited(item)) {
      dispatch(removeFoodFromWishlist(fid));
    } else {
      dispatch(addFoodToWishlist(item));
    }
  };

  const isFavorited = (item) => {
    const fid = item.id || item._id;
    return wishlistItems.some((w) => (w.id || w._id)?.toString() === fid?.toString());
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.category) count++;
    if (activeFilters.price) count++;
    if (activeFilters.rating) count++;
    if (activeFilters.deliveryTime) count++;
    if (activeFilters.discount) count++;
    if (activeFilters.restaurantType) count++;
    if (activeFilters.isOpen === "true") count++;
    if (activeFilters.vegType) count++;
    if (activeFilters.sort !== "recommended") count++;
    return count;
  };

  // Actions Live Implementation
  const handleBookNow = (item) => {
    const restName = typeof item.restaurant === "object" ? item.restaurant?.name : item.restaurant;
    dispatch(
      addToCart({
        id: item._id || item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
        restaurantName: restName || "FoodExpress Restaurant",
        restaurantId: item.restaurant?._id || item.restaurant?.id || item.restaurant,
      })
    );
    navigation.navigate("Cart");
  };

  const handleChat = (item) => {
    const phone = item.restaurant?.contactNumber || "+919158852129";
    Linking.openURL(`sms:${phone}`).catch(() => {
      Alert.alert("Error", "SMS client could not be opened.");
    });
  };

  const handleCall = (item) => {
    const phone = item.restaurant?.contactNumber || "+919158852129";
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Error", "Phone dialer could not be opened.");
    });
  };

  const handleSortSelect = (option) => {
    setActiveFilters((prev) => ({ ...prev, sort: option }));
    setSortModalVisible(false);
  };

  const renderCategorySliderItem = ({ item }) => {
    const isSelected = activeFilters.category?.toLowerCase() === item.name.toLowerCase();
    const emoji =
      item.name === "Pizza" ? "🍕" :
      item.name === "Burger" ? "🍔" :
      item.name === "Biryani" ? "🍛" :
      item.name === "Chinese" ? "🍜" :
      item.name === "South Indian" ? "🥞" :
      item.name === "Desserts" ? "🍰" :
      item.name === "Beverages" ? "🥤" :
      item.name === "Fast Food" ? "🍟" : "🍪";

    return (
      <TouchableOpacity
        style={styles.circularCategoryItem}
        onPress={() =>
          setActiveFilters((prev) => ({
            ...prev,
            category: isSelected ? "" : item.name,
          }))
        }
      >
        <View style={[styles.circularIconBg, isSelected && styles.circularIconBgActive]}>
          <Text style={styles.circularIconText}>{emoji}</Text>
        </View>
        <Text style={[styles.circularCategoryLabel, isSelected && styles.circularCategoryLabelActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFoodCard = ({ item }) => {
    const isAvailable = item.isAvailable !== false;
    const isFav = isFavorited(item);
    const rest = item.restaurant || {};
    const restName = rest.name || item.restaurant;
    const catName = typeof item.category === "object" ? item.category?.name : item.category;
    
    // Offer percentage string
    const discountText = item.discountPercentage > 0 
      ? `${item.discountPercentage}% OFF` 
      : rest.offerPercentage > 0 
        ? `${rest.offerPercentage}% OFF` 
        : "Flat ₹50 OFF";

    const responseTime = rest.deliveryTime || `${item.preparationTime || 20} mins`;
    const reviewsCount = rest.reviewCount || 250;
    const distance = rest.distance || 1.2;

    return (
      <Card style={[styles.card, !isAvailable && { opacity: 0.6 }]}>
        <View style={styles.cardRow}>
          {/* Left - Image, badge, heart */}
          <View style={styles.leftSection}>
            <Image source={{ uri: item.image }} style={styles.cardImage} blurRadius={!isAvailable ? 8 : 0} />
            {!isAvailable && (
              <View style={styles.unavailableOverlay}>
                <Text style={styles.unavailableOverlayText}>Currently Unavailable</Text>
              </View>
            )}
            <View style={styles.offerBadge}>
              <Text style={styles.offerText}>{discountText}</Text>
            </View>
            <TouchableOpacity style={styles.heartButton} onPress={() => toggleFavorite(item)}>
              <MaterialCommunityIcons
                name={isFav ? "heart" : "heart-outline"}
                size={20}
                color={isFav ? "#ff3366" : "#fff"}
              />
            </TouchableOpacity>
          </View>

          {/* Right - Product & Restaurant metadata */}
          <View style={styles.rightSection}>
            <View style={styles.titleRow}>
              <Text style={styles.providerName} numberOfLines={1}>
                {item.name}
              </Text>
              <MaterialCommunityIcons
                name="decagram"
                size={16}
                color="#4caf50"
                style={styles.verifiedBadge}
              />
            </View>
            
            <Text style={styles.subtext} numberOfLines={1}>
              by {restName} {rest.restaurantType ? `(${rest.restaurantType})` : ""}
            </Text>

            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={14} color="#ffb300" />
              <Text style={styles.ratingText}>
                {item.rating || 4.2} ({reviewsCount} reviews) • {responseTime}
              </Text>
            </View>

            <Text style={styles.categoryInfo}>
              {catName || "Dishes"} • {item.isVeg ? "Pure Veg 🟢" : "Non-Veg 🔴"}
            </Text>

            <Text style={styles.descText} numberOfLines={2}>
              {item.description || "Fresh and hot delicious food delivered quickly to your doorstep."}
            </Text>

            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={12} color="#666" />
              <Text style={styles.locationText}>
                {rest.address ? rest.address.split(",")[1]?.trim() || "Baramati" : "Baramati"} • {distance} km away
              </Text>
              
              <View style={styles.priceRow}>
                {item.originalPrice > item.price && (
                  <Text style={styles.originalPriceText}>₹{item.originalPrice}</Text>
                )}
                <Text style={styles.priceTag}>₹{item.price}</Text>
              </View>
            </View>
          </View>
        </View>

        <Divider />

        {/* Action Row */}
        <View style={styles.actionsRow}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate("FoodDetails", { foodId: item.id || item._id, discountPercentage: item.discountPercentage })}
            style={styles.actionBtn}
            labelStyle={styles.actionLabel}
            textColor="#555"
          >
            Details
          </Button>
          {!isAvailable ? (
            <Button
              mode="contained"
              onPress={() => Alert.alert("Notification Subscribed", `We will notify you when ${item.name} is back in stock!`)}
              style={[styles.actionBtn, styles.bookBtn]}
              labelStyle={styles.bookLabel}
              buttonColor="#ff6b00"
            >
              Notify Me
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={() => handleBookNow(item)}
              style={[styles.actionBtn, styles.bookBtn]}
              labelStyle={styles.bookLabel}
              buttonColor="#ff6b00"
            >
              Order Now
            </Button>
          )}
          <IconButton
            icon="chat-processing-outline"
            iconColor="#ff6b00"
            size={20}
            onPress={() => handleChat(item)}
            style={styles.iconActionBtn}
          />
          <IconButton
            icon="phone-outline"
            iconColor="#4caf50"
            size={20}
            onPress={() => handleCall(item)}
            style={styles.iconActionBtn}
          />
        </View>
      </Card>
    );
  };

  const activeFiltersCount = getActiveFiltersCount();

  const getBannerPromoTotals = () => {
    let totalOriginal = 0;
    let totalDiscounted = 0;
    foodsList.forEach(item => {
      const orig = item.originalPrice || item.price;
      const disc = item.price;
      totalOriginal += orig;
      totalDiscounted += disc;
    });
    return { totalOriginal, totalDiscounted };
  };

  const renderBannerPromoCard = () => {
    if (route.params?.filterType !== "banner" || foodsList.length === 0) return null;
    const bannerDiscount = route.params?.discountPercentage || 0;
    const { totalOriginal, totalDiscounted } = getBannerPromoTotals();
    
    return (
      <View style={styles.promoCardContainer}>
        <View style={styles.promoCardHeader}>
          <MaterialCommunityIcons name="tag-heart" size={24} color="#ff6b00" />
          <Text style={styles.promoCardTitle}>
            Special {route.params?.category || "Promo"} Deal
          </Text>
        </View>
        
        <Text style={styles.promoCardSubtitle}>
          {"Get these selected dishes at "}{bannerDiscount}{"% OFF! Add them to your cart to enjoy this discount."}
        </Text>
        
        <View style={styles.promoCardPricingRow}>
          <View>
            <Text style={styles.promoPriceLabel}>Original Total</Text>
            <Text style={styles.promoOriginalPrice}>₹{totalOriginal}</Text>
          </View>
          
          <View style={styles.promoArrowContainer}>
            <MaterialCommunityIcons name="arrow-right-bold" size={20} color="#ff6b00" />
            <Text style={styles.promoDiscountText}>{`${bannerDiscount}% OFF`}</Text>
          </View>
          
          <View>
            <Text style={styles.promoPriceLabel}>Offer Price</Text>
            <Text style={styles.promoDiscountedPrice}>₹{totalDiscounted}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHeaderComponent = () => {
    return (
      <View style={styles.headerContainer}>
        {route.params?.bannerImage && (
          <Image
            source={{ uri: route.params.bannerImage }}
            style={styles.bannerHeaderImage}
            resizeMode="cover"
          />
        )}
        {/* Horizontally scrolling Category Circle Icons */}
        <View style={styles.categorySection}>
          <FlatList
            data={categories}
            keyExtractor={(item, index) => {
              if (!item) return `empty-cat-${index}`;
              const itemId = item.id || item._id;
              return itemId ? itemId.toString() : `cat-index-${index}`;
            }}
            renderItem={renderCategorySliderItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryListContent}
          />
        </View>

        {/* Sticky Filter Bar Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContainer}
          style={styles.chipsScroll}
        >
          <Chip
            icon="filter-variant"
            onPress={() => setFilterDrawerVisible(true)}
            style={styles.filterChip}
            selected={activeFiltersCount > 0}
          >
            Filter {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
          </Chip>
          
          <Chip
            icon="sort"
            onPress={() => setSortModalVisible(true)}
            style={styles.filterChip}
            selected={activeFilters.sort !== "recommended"}
          >
            Sort By
          </Chip>

          <Chip
            onPress={() =>
              setActiveFilters((prev) => ({
                ...prev,
                vegType: prev.vegType === "veg" ? "" : "veg",
              }))
            }
            style={styles.filterChip}
            selected={activeFilters.vegType === "veg"}
            icon="leaf"
          >
            Veg Only
          </Chip>

          <Chip
            onPress={() =>
              setActiveFilters((prev) => ({
                ...prev,
                price: prev.price === "under_100" ? "" : "under_100",
              }))
            }
            style={styles.filterChip}
            selected={activeFilters.price === "under_100"}
          >
            Under ₹100
          </Chip>

          <Chip
            onPress={() =>
              setActiveFilters((prev) => ({
                ...prev,
                rating: prev.rating === "4.0" ? "" : "4.0",
              }))
            }
            style={styles.filterChip}
            selected={activeFilters.rating === "4.0"}
            icon="star"
          >
            Rating 4.0+
          </Chip>

          <Chip
            onPress={() =>
              setActiveFilters((prev) => ({
                ...prev,
                discount: prev.discount === "20_plus" ? "" : "20_plus",
              }))
            }
            style={styles.filterChip}
            selected={activeFilters.discount === "20_plus"}
          >
            Offers (20%+)
          </Chip>

          <Chip
            onPress={() =>
              setActiveFilters((prev) => ({
                ...prev,
                restaurantType: prev.restaurantType === "Pure Veg" ? "" : "Pure Veg",
              }))
            }
            style={styles.filterChip}
            selected={activeFilters.restaurantType === "Pure Veg"}
          >
            Pure Veg Rest
          </Chip>

          <Chip
            onPress={() =>
              setActiveFilters((prev) => ({
                ...prev,
                isOpen: prev.isOpen === "true" ? "" : "true",
              }))
            }
            style={styles.filterChip}
            selected={activeFilters.isOpen === "true"}
          >
            Open Now
          </Chip>

          {activeFiltersCount > 0 && (
            <Chip onPress={handleResetFilters} style={styles.resetChip}>
              Reset
            </Chip>
          )}
        </ScrollView>

        {renderBannerPromoCard()}

        {/* Results title and dynamic count */}
        <View style={styles.titleContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleText}>Top Products & Restaurants</Text>
            <Text style={styles.countText}>
              {loading && currentPage === 1 ? "Searching..." : `${totalCount} results match filters`}
            </Text>
          </View>
          <IconButton
            icon={isGridView ? "view-list" : "view-grid"}
            iconColor="#ff6b00"
            size={22}
            onPress={() => setIsGridView(!isGridView)}
            style={{ margin: 0 }}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <CustomScreenHeader title={route.params?.category || "Explore Menu"} navigation={navigation} showBack={true} redirectToHome={true} />
      <View style={styles.container}>
        {/* Sticky Search Bar */}
        <View style={styles.searchHeader}>
        <Searchbar
          placeholder="Search for food, restaurants, cuisines..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          icon="magnify"
          clearIcon="close"
          right={() => (
            <IconButton
              icon="microphone"
              iconColor="#ff6b00"
              size={22}
              onPress={() => Alert.alert("Voice Search", "Listening...")}
            />
          )}
        />
      </View>

      {/* Main lists */}
      <FlatList
        key={isGridView ? "grid" : "list"}
        numColumns={isGridView ? 2 : 1}
        data={foodsList}
        keyExtractor={(item, index) => {
          if (!item) return `empty-item-${index}`;
          const itemId = item.id || item._id;
          return itemId ? itemId.toString() : `item-index-${index}`;
        }}
        renderItem={isGridView ? ({ item }) => <FoodCard food={item} navigation={navigation} /> : renderFoodCard}
        ListHeaderComponent={renderHeaderComponent}
        refreshing={loading && currentPage === 1}
        onRefresh={() => loadFoods(1, true)}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          paginationLoading ? (
            <ActivityIndicator color="#ff6b00" size="small" style={{ marginVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            {loading && currentPage === 1 ? (
              <ActivityIndicator color="#ff6b00" size="large" />
            ) : (
              <>
                <Text style={styles.emptyTitle}>No Results Found</Text>
                <Text style={styles.emptySubtitle}>
                  Try clearing active filters or modifying search terms.
                </Text>
                <Button
                  mode="contained"
                  onPress={handleResetFilters}
                  buttonColor="#ff6b00"
                  style={styles.resetBtn}
                >
                  Clear Filters
                </Button>
              </>
            )}
          </View>
        }
      />

      {/* Drawer */}
      <FilterDrawer
        visible={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        filters={activeFilters}
        onApply={handleApplyFilters}
        categories={categories}
      />

      {/* Sort sheet */}
      <Modal
        visible={sortModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <TouchableOpacity style={styles.sortSheet} activeOpacity={1}>
            <View style={styles.sortHeader}>
              <Text style={styles.sortTitle}>Sort By</Text>
              <IconButton icon="close" onPress={() => setSortModalVisible(false)} size={22} />
            </View>
            <Divider />
            
            <ScrollView>
              {[
                { label: "Recommended / Popularity", value: "recommended" },
                { label: "Rating: High to Low", value: "rating_desc" },
                { label: "Price: Low to High", value: "price_asc" },
                { label: "Price: High to Low", value: "price_desc" },
                { label: "Discount: High to Low", value: "discount_desc" },
                { label: "New Arrivals", value: "newest" },
                { label: "Delivery Time", value: "delivery_time" },
              ].map((opt) => {
                const isSelected = activeFilters.sort === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.sortOption, isSelected && styles.sortOptionActive]}
                    onPress={() => handleSortSelect(opt.value)}
                  >
                    <Text style={[styles.sortText, isSelected && styles.sortTextActive]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={20} color="#ff6b00" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    zIndex: 10,
  },
  searchBar: {
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    height: 48,
    elevation: 0,
  },
  listContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    backgroundColor: "#fff",
  },
  categorySection: {
    marginVertical: 12,
  },
  categoryListContent: {
    paddingHorizontal: 16,
  },
  circularCategoryItem: {
    alignItems: "center",
    marginRight: 18,
    width: 64,
  },
  circularIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  circularIconBgActive: {
    borderColor: "#ff6b00",
    backgroundColor: "#fffdf9",
  },
  circularIconText: {
    fontSize: 24,
  },
  circularCategoryLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
    marginTop: 6,
    textAlign: "center",
  },
  circularCategoryLabelActive: {
    color: "#ff6b00",
    fontWeight: "bold",
  },
  chipsScroll: {
    maxHeight: 48,
  },
  chipsScrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: "center",
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: "#f5f5f5",
    height: 32,
  },
  resetChip: {
    backgroundColor: "#fff0f0",
    borderColor: "#ffcccc",
    borderWidth: 1,
    height: 32,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  countText: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
    padding: 12,
  },
  leftSection: {
    position: "relative",
    width: 100,
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  offerBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#e53935",
    paddingVertical: 3,
    alignItems: "center",
  },
  offerText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
  },
  heartButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 5,
    borderRadius: 13,
  },
  rightSection: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  providerName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  subtext: {
    fontSize: 11,
    color: "#666",
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    color: "#555",
    fontWeight: "600",
    marginLeft: 4,
  },
  categoryInfo: {
    fontSize: 11,
    color: "#777",
    marginTop: 4.5,
    fontWeight: "600",
  },
  descText: {
    fontSize: 11.5,
    color: "#666",
    marginTop: 4,
    lineHeight: 15,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  locationText: {
    fontSize: 10.5,
    color: "#777",
    marginLeft: 2,
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  originalPriceText: {
    fontSize: 11,
    color: "#888",
    textDecorationLine: "line-through",
    marginRight: 4,
  },
  priceTag: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ff6b00",
    marginRight: 4,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fafafa",
  },
  actionBtn: {
    height: 36,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "bold",
    marginVertical: 0,
    paddingVertical: 0,
  },
  bookBtn: {
    flex: 1,
  },
  bookLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    marginVertical: 0,
    paddingVertical: 0,
  },
  iconActionBtn: {
    margin: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    height: 36,
    width: 36,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    marginTop: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 6.5,
  },
  resetBtn: {
    marginTop: 16,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sortSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: "50%",
  },
  sortHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sortTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sortOptionActive: {
    backgroundColor: "#fffbf5",
  },
  sortText: {
    fontSize: 14,
    color: "#555",
  },
  sortTextActive: {
    color: "#ff6b00",
    fontWeight: "bold",
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
    fontSize: 9,
    fontWeight: "805",
    textTransform: "uppercase",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  bannerHeaderImage: {
    width: "100%",
    height: 160,
    marginBottom: 12,
  },
  promoCardContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FEB2B2",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  promoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  promoCardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#C53030",
  },
  promoCardSubtitle: {
    fontSize: 12,
    color: "#742A2A",
    lineHeight: 16,
    marginBottom: 12,
  },
  promoCardPricingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#FED7D7",
  },
  promoPriceLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#9B2C2C",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  promoOriginalPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#A0AEC0",
    textDecorationLine: "line-through",
  },
  promoArrowContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  promoDiscountText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#E53E3E",
    marginTop: 2,
  },
  promoDiscountedPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: "#E53E3E",
  },
});

export default FoodListingScreen;
