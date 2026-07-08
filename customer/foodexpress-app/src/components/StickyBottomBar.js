import React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, increaseQuantity, decreaseQuantity } from "../redux/slices/cartSlice";

const StickyBottomBar = ({ food, onAddPress }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items) || [];

  // Guard against undefined food
  const foodId = food?._id || food?.id;
  
  // Find if this item is in the cart
  const matchedCartItems = cartItems.filter((item) => 
    item.id === foodId || 
    item.id?.toString().startsWith(foodId?.toString() || "__NONE__")
  );
  
  const inCart = matchedCartItems.length > 0;
  const totalQty = matchedCartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Don't render until food is ready
  if (!food) return null;

  const handleIncrement = () => {
    if (food.isCustomizable) {
      onAddPress();
      return;
    }
    dispatch(increaseQuantity(foodId));
  };

  const handleDecrement = () => {
    dispatch(decreaseQuantity(foodId));
  };

  return (
    <View style={styles.container}>
      {/* Left part: Small Food Image & Price */}
      <View style={styles.leftCol}>
        <Image source={{ uri: food.image || undefined }} style={styles.thumbnail} />
        <View style={styles.textContainer}>
          <Text style={styles.price}>₹{food.price}</Text>
          <Text style={styles.taxLabel}>Taxes included</Text>
        </View>
      </View>

      {/* Right part: Add / Quantity Selector button */}
      <View style={styles.rightCol}>
        {food.isAvailable === false ? (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: "#FF6F61" }]} 
            onPress={() => require("react-native").Alert.alert("Notification Subscribed", `We will notify you when ${food.name} is back in stock!`)} 
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Notify Me</Text>
          </TouchableOpacity>
        ) : inCart ? (
          <View style={styles.qtyContainer}>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrement} activeOpacity={0.8}>
              <MaterialCommunityIcons name="minus" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{totalQty}</Text>
            {food.isCustomizable ? (
              // For customizable food, pressing plus opens customization bottom sheet to allow adding with different options
              <TouchableOpacity style={styles.qtyBtn} onPress={onAddPress} activeOpacity={0.8}>
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrement} activeOpacity={0.8}>
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.addButtonWrapper}>
            {food.isCustomizable && (
              <Text style={styles.customiseLabel}>Customise</Text>
            )}
            <TouchableOpacity 
              style={[styles.addButton, food.isCustomizable ? styles.customiseAddButton : {}]} 
              onPress={onAddPress} 
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>ADD</Text>
              <MaterialCommunityIcons name="plus" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#EAECF0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
    height: 78,
  },
  leftCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
  },
  textContainer: {
    justifyContent: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: "#101828",
  },
  taxLabel: {
    fontSize: 11,
    color: "#98A2B3",
    fontWeight: "500",
    marginTop: 1,
  },
  rightCol: {
    justifyContent: "center",
  },
  addButtonWrapper: {
    alignItems: "center",
    position: "relative",
  },
  customiseLabel: {
    fontSize: 8,
    color: "#039855",
    fontWeight: "800",
    textTransform: "uppercase",
    position: "absolute",
    top: -12,
    zIndex: 10,
    backgroundColor: "#E6F4EA",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#A3CFBB",
  },
  addButton: {
    backgroundColor: "#039855", // Green Swish add button
    borderRadius: 12,
    height: 42,
    width: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  customiseAddButton: {
    borderTopWidth: 0, // styled cleanly
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  qtyContainer: {
    backgroundColor: "#039855",
    borderRadius: 12,
    height: 42,
    width: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});

export default StickyBottomBar;
