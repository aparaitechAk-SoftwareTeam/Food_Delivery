import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Animated, 
  Dimensions, 
  Platform,
  TouchableOpacity,
  SafeAreaView,
  Image
} from "react-native";
import { Text, Button, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import { addToCart } from "../../redux/slices/cartSlice";
import api from "../../utils/api";
import dayjs from "dayjs";

// Components
import FoodHeroImage from "../../components/FoodHeroImage";
import FoodInfo from "../../components/FoodInfo";
import PriceSection from "../../components/PriceSection";
import DishDetailsAccordion from "../../components/DishDetailsAccordion";
import PeopleAlsoBought from "../../components/PeopleAlsoBought";
import OfferBanner from "../../components/OfferBanner";
import StickyBottomBar from "../../components/StickyBottomBar";
import CustomizationBottomSheet from "../../components/CustomizationBottomSheet";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";

// Services
import foodService from "../../services/foodService";

const { width, height } = Dimensions.get("window");

const FoodDetailsScreen = ({ route, navigation }) => {
  const { foodId } = route.params;
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customiseVisible, setCustomiseVisible] = useState(false);
  const [redirectOnCustomise, setRedirectOnCustomise] = useState(false);
  const dispatch = useDispatch();

  // Shimmer animation for skeleton
  const shimmerValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loading) {
      const animation = Animated.loop(
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
      animation.start();
      return () => animation.stop();
    }
  }, [loading]);

  const fetchFoodDetails = (initial = false) => {
    if (initial) {
      setLoading(true);
      setError(null);
    }
    foodService.getFoodDetails(foodId)
      .then((response) => {
        if (!response) {
          if (initial) setError("No food details found");
        } else {
          setFood(response);
        }
        if (initial) setLoading(false);
      })
      .catch((err) => {
        if (initial) {
          setError(err.message || "Failed to load food details");
          setLoading(false);
        }
      });
  };

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);

  const fetchFoodReviews = async (page = 1, append = false) => {
    if (reviewsLoading) return;
    setReviewsLoading(true);
    try {
      const res = await api.get(`/reviews/food/${foodId}?page=${page}&limit=10`);
      if (res.data) {
        const { reviews: newReviews, stats: newStats } = res.data;
        if (newReviews) {
          if (append) {
            setReviews(prev => [...prev, ...newReviews]);
          } else {
            setReviews(newReviews);
          }
          if (newReviews.length < 10) {
            setHasMoreReviews(false);
          } else {
            setHasMoreReviews(true);
          }
        }
        if (newStats) {
          setStats(newStats);
        }
      }
    } catch (err) {
      console.log("Error loading food reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodDetails(true);
    setReviews([]);
    setReviewsPage(1);
    setHasMoreReviews(true);
    fetchFoodReviews(1, false);
    const interval = setInterval(() => {
      fetchFoodDetails(false);
      fetchFoodReviews(1, false);
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [foodId]);

  const handleStickyAddPress = (shouldRedirect = false) => {
    if (food.isCustomizable) {
      setRedirectOnCustomise(shouldRedirect);
      setCustomiseVisible(true);
    } else {
      // Add directly to cart
      dispatch(
        addToCart({
          id: food._id || food.id,
          name: food.name,
          price: food.price,
          quantity: 1,
          image: food.image,
          restaurantName: food.restaurant?.name || "Krushna's Restaurant",
          restaurantId: food.restaurant?._id || food.restaurant?.id || food.restaurant,
        })
      );
      if (shouldRedirect) {
        navigation.navigate("Cart");
      }
    }
  };

  const handleCustomizationComplete = (customizationData) => {
    // Generate unique ID in cart for this customized item
    const customId = `${food._id || food.id}-${customizationData.size}-${customizationData.addons.join("-")}`;
    const desc = `${customizationData.size} | ${customizationData.addons.join(", ") || "No extra toppings"}`;
    
    dispatch(
      addToCart({
        id: customId,
        name: `${food.name} (${customizationData.size})`,
        price: customizationData.price,
        quantity: customizationData.quantity,
        image: food.image,
        restaurantName: food.restaurant?.name || "Krushna's Restaurant",
        restaurantId: food.restaurant?._id || food.restaurant?.id || food.restaurant,
        customisationText: desc,
        instructions: customizationData.instructions,
      })
    );

    if (redirectOnCustomise) {
      navigation.navigate("Cart");
    }
  };

  if (loading) {
    const animatedStyle = { opacity: shimmerValue };
    return (
      <View style={styles.skeletonContainer}>
        {/* Hero image skeleton */}
        <Animated.View style={[styles.skeletonHero, animatedStyle]} />
        <View style={styles.skeletonPadding}>
          {/* Title skeleton */}
          <Animated.View style={[styles.skeletonTitle, animatedStyle]} />
          <Animated.View style={[styles.skeletonTextLong, animatedStyle]} />
          <Animated.View style={[styles.skeletonTextShort, animatedStyle]} />
          {/* Price skeleton */}
          <Animated.View style={[styles.skeletonPrice, animatedStyle]} />
          {/* Accordion skeleton */}
          <Animated.View style={[styles.skeletonAccordionHeader, animatedStyle]} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorWrapper}>
        <ErrorState 
          title="Oops! Something went wrong" 
          description={error} 
          onRetry={fetchFoodDetails} 
        />
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.errorWrapper}>
        <EmptyState 
          title="Food Item Not Found" 
          description="We couldn't retrieve details for this item." 
          actionText="Go Back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <CustomScreenHeader title={food?.name || "Food Details"} navigation={navigation} />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Image */}
        <FoodHeroImage food={food} />

        {/* 2. Food Info */}
        <FoodInfo food={food} />

        {/* 3. Pricing */}
        <PriceSection food={food} />

        {/* 4. Accordion Details */}
        <DishDetailsAccordion food={food} />

        {/* 5. Customer Reviews Section */}
        <View style={styles.reviewsSection}>
          <Text style={styles.reviewsTitle}>Customer Reviews</Text>
          
          {stats.totalReviews > 0 ? (
            <View style={styles.statsCard}>
              <View style={styles.overallRatingRow}>
                <Text style={styles.ratingNumber}>{stats.averageRating}</Text>
                <View style={styles.starsWrapper}>
                  <View style={{ flexDirection: "row", marginBottom: 4 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <MaterialCommunityIcons
                        key={i}
                        name="star"
                        size={18}
                        color={i < Math.round(stats.averageRating) ? "#FFD54F" : "#E4E7EC"}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewCountText}>{stats.totalReviews} Reviews</Text>
                </View>
              </View>

              <Divider style={styles.statsDivider} />

              {/* Rating breakdown bars */}
              <View style={styles.breakdownContainer}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.breakdown?.[rating] || 0;
                  const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 105 : 0;
                  return (
                    <View key={rating} style={styles.breakdownRow}>
                      <Text style={styles.breakdownStars}>{rating} Star</Text>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` }]} />
                      </View>
                      <Text style={styles.breakdownCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.noReviewsCard}>
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to order and review this dish!</Text>
            </View>
          )}

          {reviews.map((rev) => (
            <View key={rev._id} style={styles.reviewItemCard}>
              <View style={styles.reviewUserHeader}>
                {rev.user?.profilePhoto ? (
                  <Image source={{ uri: rev.user.profilePhoto }} style={styles.reviewAvatar} />
                ) : (
                  <View style={styles.reviewAvatarPlaceholder}>
                    <MaterialCommunityIcons name="account" size={20} color="#666" />
                  </View>
                )}
                <View style={styles.reviewUserInfo}>
                  <Text style={styles.reviewUserName}>{rev.user?.name || "Anonymous User"}</Text>
                  <Text style={styles.reviewDate}>{dayjs(rev.createdAt).format("DD MMM YYYY")}</Text>
                </View>
                <View style={styles.reviewStarsRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <MaterialCommunityIcons
                      key={i}
                      name="star"
                      size={14}
                      color={i < rev.rating ? "#FFD54F" : "#E4E7EC"}
                    />
                  ))}
                </View>
              </View>

              {rev.title && <Text style={styles.reviewItemTitle}>{rev.title}</Text>}
              <Text style={styles.reviewItemComment}>{rev.comment}</Text>

              {rev.images && rev.images.length > 0 && (
                <View style={styles.reviewImagesRow}>
                  {rev.images.map((imgUrl, imgIdx) => (
                    <Image key={imgIdx} source={{ uri: imgUrl }} style={styles.reviewFoodImage} />
                  ))}
                </View>
              )}
            </View>
          ))}

          {hasMoreReviews && reviews.length > 0 && (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={() => {
                const nextPage = reviewsPage + 1;
                setReviewsPage(nextPage);
                fetchFoodReviews(nextPage, true);
              }}
              activeOpacity={0.8}
            >
              {reviewsLoading ? (
                <ActivityIndicator color="#ff6b00" size="small" />
              ) : (
                <Text style={styles.loadMoreText}>Show More Reviews</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 6. Recommended / People Also Bought */}
        <PeopleAlsoBought recommendedFoods={food.recommendedFoods} />
      </ScrollView>

      {/* 6. Sticky Bottom Banner & Bar */}
      <View style={styles.bottomStickyWrapper}>
        <OfferBanner />
        <StickyBottomBar food={food} onAddPress={handleStickyAddPress} />
      </View>

      {/* 7. Customization Bottom Sheet */}
      <CustomizationBottomSheet
        visible={customiseVisible}
        onClose={() => setCustomiseVisible(false)}
        food={food}
        onAddComplete={handleCustomizationComplete}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 180, // High enough padding to scroll past sticky bottoms
  },
  bottomStickyWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 100,
  },
  errorWrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  // Skeleton Styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  skeletonHero: {
    width: "100%",
    height: 300,
    backgroundColor: "#E4E7EC",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  skeletonPadding: {
    padding: 16,
  },
  skeletonTitle: {
    width: width * 0.6,
    height: 24,
    backgroundColor: "#F2F4F7",
    borderRadius: 6,
    marginBottom: 16,
  },
  skeletonTextLong: {
    width: width * 0.9,
    height: 14,
    backgroundColor: "#F2F4F7",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTextShort: {
    width: width * 0.45,
    height: 14,
    backgroundColor: "#F2F4F7",
    borderRadius: 4,
    marginBottom: 24,
  },
  skeletonPrice: {
    width: 80,
    height: 20,
    backgroundColor: "#F2F4F7",
    borderRadius: 4,
    marginBottom: 24,
  },
  skeletonAccordionHeader: {
    width: "100%",
    height: 48,
    backgroundColor: "#F2F4F7",
    borderRadius: 8,
  },
  reviewsSection: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1D2939",
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F2F4F7",
  },
  overallRatingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: "900",
    color: "#1D2939",
    marginRight: 16,
  },
  starsWrapper: {
    justifyContent: "center",
  },
  reviewCountText: {
    fontSize: 12,
    color: "#667085",
  },
  statsDivider: {
    marginVertical: 14,
    backgroundColor: "#E4E7EC",
  },
  breakdownContainer: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  breakdownStars: {
    width: 48,
    fontSize: 11,
    color: "#475467",
    fontWeight: "500",
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#E4E7EC",
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFD54F",
    borderRadius: 3,
  },
  breakdownCount: {
    width: 24,
    fontSize: 11,
    color: "#475467",
    textAlign: "right",
    fontWeight: "bold",
  },
  noReviewsCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F2F4F7",
  },
  noReviewsText: {
    fontSize: 12,
    color: "#667085",
    textAlign: "center",
  },
  reviewItemCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  reviewUserHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E4E7EC",
  },
  reviewAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewUserInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reviewUserName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#344054",
  },
  reviewDate: {
    fontSize: 10,
    color: "#98A2B3",
    marginTop: 1,
  },
  reviewStarsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewItemTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1D2939",
    marginBottom: 4,
  },
  reviewItemComment: {
    fontSize: 13,
    color: "#475467",
    lineHeight: 18,
  },
  reviewImagesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 8,
  },
  reviewFoodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
  loadMoreBtn: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 8,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
  },
  loadMoreText: {
    color: "#ff6b00",
    fontSize: 13,
    fontWeight: "bold",
  },
});

export default FoodDetailsScreen;
