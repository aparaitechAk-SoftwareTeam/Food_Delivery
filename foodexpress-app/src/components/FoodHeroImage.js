import React from "react";
import { View, StyleSheet, Image, TouchableOpacity, Share, Alert, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { addFoodToWishlist, removeFoodFromWishlist } from "../redux/slices/wishlistSlice";

const FoodHeroImage = ({ food }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const token = useSelector((state) => state.auth.token);
  const wishlistItems = useSelector((state) => state.wishlist.items) || [];
  const isFav = wishlistItems.some((w) => (w.id || w._id)?.toString() === (food?.id || food?._id)?.toString());


  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  const handleShare = async () => {
    try {
      const shareOptions = {
        message: `Check out ${food.name} on FoodExpress! Only for ₹${food.price}. \n\n${food.description || ""}`,
      };
      await Share.share(shareOptions);
    } catch (error) {
      console.log("Error sharing:", error.message);
    }
  };

  const handleWishlistToggle = () => {
    if (!token) {
      Alert.alert(
        "Login Required",
        "Please log in to add items to your wishlist.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login", { redirectTo: "FoodDetails", redirectParams: { foodId: food?.id || food?._id } }) }
        ]
      );
      return;
    }
    if (isFav) {
      dispatch(removeFoodFromWishlist(food?.id || food?._id));
    } else {
      dispatch(addFoodToWishlist(food));
    }
  };

  if (!food) return null;

  return (
    <View style={styles.container}>
      <Image source={{ uri: food?.image || undefined }} style={styles.image} resizeMode="cover" />
      
      {/* Navigation & Action Overlays */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBack} activeOpacity={0.8}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#1F1F1F" />
        </TouchableOpacity>

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleShare} activeOpacity={0.8}>
            <MaterialCommunityIcons name="share-variant-outline" size={22} color="#1F1F1F" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleWishlistToggle} activeOpacity={0.8}>
            <MaterialCommunityIcons 
              name={isFav ? "heart" : "heart-outline"} 
              size={22} 
              color={isFav ? "#FF6F61" : "#1F1F1F"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 300,
    position: "relative",
    backgroundColor: "#E1E1E1",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  headerRow: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 36,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  rightActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default FoodHeroImage;
