import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, BackHandler } from "react-native";
import { Text } from "react-native-paper";
import { useDispatch } from "react-redux";
import { fetchOrders } from "../../redux/slices/ordersSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const OrderSuccessScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { orderId, orderNumber, totalAmount, paymentMethod, address } = route.params || {};

  // Auto-refresh orders list in the background on mount
  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Handle auto-redirect after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleViewOrders();
    }, 3000);

    // Prevent going back to checkout screen via hardware back button
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => true);

    return () => {
      clearTimeout(timer);
      backHandler.remove();
    };
  }, []);

  const handleViewOrders = () => {
    // Navigate to Main tabs, specifically to the Orders tab
    navigation.navigate("Main", { screen: "Orders" });
  };

  const handleContinueShopping = () => {
    navigation.navigate("Main", { screen: "Home" });
  };

  return (
    <View style={styles.container}>
      {/* Animated Success Checkmark */}
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="check-circle" size={100} color="#0f8a5f" />
      </View>

      <Text variant="headlineMedium" style={styles.successTitle}>
        Order Placed Successfully!
      </Text>
      <Text variant="bodyMedium" style={styles.successSubtitle}>
        Thank you! Your order has been placed successfully.
      </Text>

      {/* Order Details Card */}
      <View style={styles.card}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order ID / No:</Text>
          <Text style={styles.detailValue}>#{orderNumber || "FE-ORD"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Amount:</Text>
          <Text style={styles.detailValue}>₹{totalAmount?.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method:</Text>
          <Text style={styles.detailValue}>{paymentMethod}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Estimated Delivery:</Text>
          <Text style={styles.detailValueHighlight}>30 - 45 mins</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Delivery Address:</Text>
          <Text style={styles.detailValueAddress} numberOfLines={2}>
            {address ? `${address.line1}, ${address.city}` : "Baramati"}
          </Text>
        </View>
      </View>

      <Text style={styles.redirectText}>
        Redirecting to My Orders in a few seconds...
      </Text>

      {/* Action Buttons */}
      <View style={styles.btnContainer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleViewOrders}>
          <Text style={styles.primaryBtnText}>View My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleContinueShopping}>
          <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontWeight: "900",
    color: "#1d2939",
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtitle: {
    color: "#667085",
    textAlign: "center",
    marginBottom: 32,
    fontSize: 14,
  },
  card: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eaecf0",
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f4f7",
  },
  detailLabel: {
    fontSize: 13,
    color: "#475467",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#1d2939",
    fontWeight: "600",
  },
  detailValueHighlight: {
    fontSize: 14,
    color: "#ff6b00",
    fontWeight: "700",
  },
  detailValueAddress: {
    fontSize: 13,
    color: "#1d2939",
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  redirectText: {
    fontSize: 12,
    color: "#98a2b3",
    marginBottom: 32,
    fontStyle: "italic",
  },
  btnContainer: {
    width: "100%",
  },
  primaryBtn: {
    backgroundColor: "#ff6b00",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#ff6b00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: "#ff6b00",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: "#ff6b00",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default OrderSuccessScreen;
