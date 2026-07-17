import React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { addToCart, increaseQuantity, decreaseQuantity } from "../redux/slices/cartSlice";

const StickyBottomBar = ({ food, onAddPress }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
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
      onAddPress(false);
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

      {/* Right part: Add / Quantity Selector + Order Now buttons */}
      <View style={styles.rightCol}>
        {food.isAvailable === false ? (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: "#FF6F61", width: 140 }]} 
            onPress={() => require("react-native").Alert.alert("Notification Subscribed", `We will notify you when ${food.name} is back in stock!`)} 
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Notify Me</Text>
          </TouchableOpacity>
        ) : inCart ? (
          <View style={styles.rowActions}>
            <View style={styles.qtyContainer}>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrement} activeOpacity={0.8}>
                <MaterialCommunityIcons name="minus" size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{totalQty}</Text>
              {food.isCustomizable ? (
                <TouchableOpacity style={styles.qtyBtn} onPress={() => onAddPress(false)} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrement} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.addButton, styles.orderNowButton]} 
              onPress={() => navigation.navigate("Cart")}
              activeOpacity={0.8}
            >
              <Text style={styles.orderNowText}>ORDER NOW</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.rowActions}>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => onAddPress(false)} 
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>ADD</Text>
              <MaterialCommunityIcons name="plus" size={12} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addButton, styles.orderNowButton]} 
              onPress={() => onAddPress(true)} 
              activeOpacity={0.8}
            >
              <Text style={styles.orderNowText}>ORDER NOW</Text>
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
    paddingHorizontal: 16,
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
    gap: 8,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
  },
  textContainer: {
    justifyContent: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101828",
  },
  taxLabel: {
    fontSize: 10,
    color: "#98A2B3",
    fontWeight: "500",
    marginTop: 1,
  },
  rightCol: {
    justifyContent: "center",
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addButton: {
    backgroundColor: "#039855", // Green Swish add button
    borderRadius: 12,
    height: 42,
    width: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  orderNowButton: {
    backgroundColor: "#ff6b00", // Orange Swish button
    width: 104,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  orderNowText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  qtyContainer: {
    backgroundColor: "#039855",
    borderRadius: 12,
    height: 42,
    width: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  qtyBtn: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});

export default StickyBottomBar;
