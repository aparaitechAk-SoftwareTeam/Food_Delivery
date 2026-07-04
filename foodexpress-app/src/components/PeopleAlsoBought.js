import React from "react";
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, increaseQuantity, decreaseQuantity } from "../redux/slices/cartSlice";

const PeopleAlsoBought = ({ recommendedFoods = [] }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items) || [];

  if (!recommendedFoods || recommendedFoods.length === 0) return null;
  // Filter out any null/undefined items from the list
  const validFoods = recommendedFoods.filter(Boolean);
  if (validFoods.length === 0) return null;


  const handleCardPress = (item) => {
    navigation.push("FoodDetails", { foodId: item._id || item.id });
  };

  const handleAddPress = (item) => {
    dispatch(
      addToCart({
        id: item._id || item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
        restaurantName: item.restaurant?.name || "",
      })
    );
  };

  const renderRecommendCard = ({ item }) => {
    if (!item) return null;
    const isVeg = item.isVeg !== undefined ? item.isVeg : true;
    const isBestseller = item.isBestseller || item.isBestSeller;
    
    // Check if item is in cart (aggregate qty across variants)
    const baseId = (item._id || item.id)?.toString();
    const itemQty = cartItems
      .filter((ci) => ci.id?.toString() === baseId || ci.id?.toString().startsWith(baseId))
      .reduce((sum, ci) => sum + ci.quantity, 0);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.95}
        onPress={() => handleCardPress(item)}
      >
        {/* Food Image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image || undefined }} style={styles.image} resizeMode="cover" />
          
          {/* Bestseller badge */}
          {isBestseller && (
            <View style={styles.bestsellerBadge}>
              <MaterialCommunityIcons name="star" size={8} color="#FFFFFF" style={{ marginRight: 2 }} />
              <Text style={styles.bestsellerText}>BESTSELLER</Text>
            </View>
          )}

          {/* Floating ADD Button */}
          <View style={styles.addBtnContainer}>
            {itemQty > 0 ? (
              <View style={styles.qtyContainer}>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => dispatch(decreaseQuantity(item._id || item.id))}
                >
                  <MaterialCommunityIcons name="minus" size={12} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{itemQty}</Text>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => dispatch(increaseQuantity(item._id || item.id))}
                >
                  <MaterialCommunityIcons name="plus" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addBtn} 
                onPress={() => handleAddPress(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.addBtnText}>ADD</Text>
                <MaterialCommunityIcons name="plus" size={10} color="#039855" style={{ marginLeft: 1 }} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content Info */}
        <View style={styles.infoWrapper}>
          {/* Veg/Non-Veg Icon */}
          <View style={styles.iconRow}>
            <View style={[styles.vegBadge, isVeg ? styles.vegBorder : styles.nonVegBorder]}>
              <View style={[styles.vegDot, { backgroundColor: isVeg ? "#2E7D32" : "#D92D20" }]} />
            </View>
          </View>

          {/* Food Name */}
          <Text style={styles.foodName} numberOfLines={1}>
            {item.name}
          </Text>

          {/* Price */}
          <Text style={styles.price}>₹{item.price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>People also bought</Text>
      <FlatList
        data={validFoods}
        renderItem={renderRecommendCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item, index) => (item?._id || item?.id || index)?.toString()}
        snapToInterval={146}
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  card: {
    width: 130,
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAECF0",
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: 110,
    position: "relative",
    backgroundColor: "#F2F4F7",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  bestsellerBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#E29578",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestsellerText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  addBtnContainer: {
    position: "absolute",
    bottom: -12,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#039855",
    borderRadius: 8,
    width: 68,
    height: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#039855",
  },
  qtyContainer: {
    backgroundColor: "#039855",
    borderRadius: 8,
    width: 72,
    height: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  qtyBtn: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  infoWrapper: {
    padding: 8,
    paddingTop: 16,
  },
  iconRow: {
    marginBottom: 4,
  },
  vegBadge: {
    width: 14,
    height: 14,
    borderWidth: 1.2,
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  foodName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2A37",
    marginBottom: 2,
  },
  price: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4B5563",
  },
});

export default PeopleAlsoBought;
