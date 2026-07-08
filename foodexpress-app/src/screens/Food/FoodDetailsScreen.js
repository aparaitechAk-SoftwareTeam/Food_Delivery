import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Animated, 
  Dimensions, 
  Platform,
  TouchableOpacity
} from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice";

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

  const fetchFoodDetails = () => {
    setLoading(true);
    setError(null);
    foodService.getFoodDetails(foodId)
      .then((response) => {
        if (!response) {
          setError("No food details found");
        } else {
          setFood(response);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load food details");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFoodDetails();
  }, [foodId]);

  const handleStickyAddPress = () => {
    if (food.isCustomizable) {
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
    <View style={styles.container}>
      <ScrollView 
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

        {/* 5. Recommended / People Also Bought */}
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
    </View>
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
});

export default FoodDetailsScreen;
