import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, SafeAreaView } from "react-native";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import { Text, Divider, Portal, Dialog, RadioButton, Snackbar, ActivityIndicator } from "react-native-paper";
import { useDispatch } from "react-redux";
import orderService from "../../services/orderService";
import { cancelOrderThunk } from "../../redux/slices/ordersSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const dispatch = useDispatch();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("Ordered by mistake");
  const [cancelLoading, setCancelLoading] = useState(false);
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const fetchDetails = async (initial = false) => {
    try {
      if (initial) setLoading(true);
      const data = await orderService.getOrderDetails(orderId);
      setOrder(data);
    } catch (err) {
      console.log("Error loading order details:", err);
      if (initial) Alert.alert("Error", "Could not load order details.");
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails(true);
    const interval = setInterval(() => fetchDetails(false), 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancelOrder = () => {
    setCancelLoading(true);
    dispatch(cancelOrderThunk({ id: orderId, reason: cancelReason }))
      .unwrap()
      .then((updatedOrder) => {
        setOrder(updatedOrder);
        setCancelVisible(false);
        setSnackbarMsg("Order cancelled successfully");
        setSnackbarVisible(true);
      })
      .catch((err) => {
        const errorMsg = typeof err === "string" ? err : (err?.message || "Could not cancel order.");
        Alert.alert("Error", errorMsg);
      })
      .finally(() => {
        setCancelLoading(false);
      });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color="#ff6b00" size="large" />
        <Text style={styles.loadingText}>Fetching order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order not found.</Text>
      </View>
    );
  }

  const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const isCancellable = order.status === "Pending" || order.status === "Confirmed";

  return (
    <Portal.Host>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <CustomScreenHeader title="Order Details" navigation={navigation} />
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Status Header */}
        <View style={styles.statusHeaderCard}>
          <Text style={styles.orderNumberTitle}>Order #{order.orderNumber}</Text>
          <Text style={styles.orderTimeText}>{dayjs(order.createdAt).format("DD MMMM YYYY, h:mm A")}</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Status: </Text>
            <Text style={[styles.statusValue, { color: order.status === "Cancelled" ? "#c62828" : order.status === "Delivered" ? "#2e7d32" : "#ff6b00" }]}>
              {order.status}
            </Text>
          </View>

          {order.cancellationReason && (
            <View style={styles.cancelReasonBox}>
              <Text style={styles.cancelReasonLabel}>Reason: </Text>
              <Text style={styles.cancelReasonText}>{order.cancellationReason}</Text>
            </View>
          )}

          {isCancellable && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setCancelVisible(true)}
            >
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Restaurant Summary */}
        <View style={styles.card}>
          <View style={styles.restaurantRow}>
            <Image
              source={{ uri: order.restaurant?.image || "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=120&q=80" }}
              style={styles.restaurantImage}
            />
            <View style={styles.restaurantDetails}>
              <Text style={styles.restaurantName}>{order.restaurant?.name || "Restaurant"}</Text>
              <Text style={styles.restaurantAddress}>
                {Array.isArray(order.restaurant?.cuisine)
                  ? order.restaurant.cuisine.join(", ")
                  : typeof order.restaurant?.cuisine === "string"
                  ? order.restaurant.cuisine
                  : "Multi Cuisine"}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Listing */}
        <Text style={styles.sectionTitle}>Items Ordered</Text>
        <View style={styles.card}>
          {order.items?.map((item, index) => (
            <View key={item.food?._id || item.food?.id || index}>
              {index > 0 && <Divider style={styles.itemDivider} />}
              <View style={styles.foodItemRow}>
                <View style={styles.foodInfo}>
                  <View style={styles.vegIconContainer}>
                    <MaterialCommunityIcons
                      name="circle-slice-8"
                      size={14}
                      color={item.food?.isVeg ? "#0f8a5f" : "#b22222"}
                    />
                    <Text style={styles.foodNameText}>{item.food?.name || "Dish"}</Text>
                  </View>
                  <Text style={styles.qtyText}>Qty: {item.quantity} x ₹{item.price}</Text>
                </View>
                <Text style={styles.foodSubtotal}>₹{item.price * item.quantity}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Billing Details */}
        <Text style={styles.sectionTitle}>Bill Summary</Text>
        <View style={styles.card}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: "#2e7d32" }]}>Discount</Text>
              <Text style={[styles.billValue, { color: "#2e7d32" }]}>-₹{order.discount}</Text>
            </View>
          )}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Partner Fee</Text>
            <Text style={styles.billValue}>₹{order.deliveryCharge}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes and Charges</Text>
            <Text style={styles.billValue}>₹{order.tax}</Text>
          </View>
          <Divider style={styles.billDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{order.totalAmount}</Text>
          </View>
        </View>

        {/* Delivery Details */}
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account" size={18} color="#666" style={styles.detailIcon} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailTextLabel}>Customer</Text>
              <Text style={styles.detailTextVal}>{order.user?.name || "Foodie Guest"}</Text>
            </View>
          </View>
          <Divider style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={18} color="#666" style={styles.detailIcon} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailTextLabel}>Deliver to</Text>
              <Text style={styles.detailTextVal}>
                {order.address?.line1}, {order.address?.line2 ? `${order.address.line2}, ` : ""}{order.address?.city}, {order.address?.state} - {order.address?.postalCode}
              </Text>
            </View>
          </View>
          <Divider style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="cash" size={18} color="#666" style={styles.detailIcon} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailTextLabel}>Payment Method</Text>
              <Text style={styles.detailTextVal}>{order.paymentMethod || "Cash on Delivery"}</Text>
            </View>
          </View>
          <Divider style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="credit-card-check-outline" size={18} color="#666" style={styles.detailIcon} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailTextLabel}>Payment Status</Text>
              <Text style={[styles.detailTextVal, { color: order.paymentStatus === "Paid" ? "#0f8a5f" : "#ff6b00", fontWeight: "bold" }]}>
                {order.paymentStatus || "Pending"}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions bottom */}
        {order.status !== "Delivered" && order.status !== "Cancelled" && (
          <TouchableOpacity
            style={styles.trackOrderBtn}
            onPress={() => navigation.navigate("OrderTracking", { orderId })}
          >
            <MaterialCommunityIcons name="moped" size={24} color="#fff" />
            <Text style={styles.trackOrderBtnText}>Track Live Order</Text>
          </TouchableOpacity>
        )}
        
        {/* Cancel Reason Dialog */}
        <Portal>
          <Dialog visible={cancelVisible} onDismiss={() => setCancelVisible(false)}>
            <Dialog.Title>Cancel Order</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogDescription}>
                Why do you want to cancel this order?
              </Text>
              <RadioButton.Group onValueChange={value => setCancelReason(value)} value={cancelReason}>
                <View style={styles.radioRow}>
                  <RadioButton value="Ordered by mistake" color="#ff6b00" />
                  <Text style={styles.radioLabel}>Ordered by mistake</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="Delivery taking too long" color="#ff6b00" />
                  <Text style={styles.radioLabel}>Delivery taking too long</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="Change of plans" color="#ff6b00" />
                  <Text style={styles.radioLabel}>Change of plans</Text>
                </View>
                <View style={styles.radioRow}>
                  <RadioButton value="Found better option" color="#ff6b00" />
                  <Text style={styles.radioLabel}>Found better option</Text>
                </View>
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <AppButton mode="text" onPress={() => setCancelVisible(false)} textColor="#666">
                Back
              </AppButton>
              <AppButton
                loading={cancelLoading}
                onPress={handleCancelOrder}
                textColor="#d32f2f"
              >
                Confirm Cancel
              </AppButton>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2000}
        >
          {snackbarMsg}
        </Snackbar>
      </ScrollView>
      </SafeAreaView>
    </Portal.Host>
  );
};

// Simple AppButton helper inside
const AppButton = ({ loading, children, onPress, textColor, mode = "text" }) => (
  <TouchableOpacity onPress={onPress} disabled={loading} style={styles.btnAction}>
    {loading ? <ActivityIndicator size="small" color="#ff6b00" /> : <Text style={[styles.btnActionText, { color: textColor }]}>{children}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#d32f2f",
  },
  statusHeaderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  orderNumberTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  orderTimeText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 13,
    color: "#555",
  },
  statusValue: {
    fontSize: 13,
    fontWeight: "bold",
  },
  cancelReasonBox: {
    flexDirection: "row",
    backgroundColor: "#ffebee",
    padding: 8,
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
    marginTop: 4,
  },
  cancelReasonLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#c62828",
  },
  cancelReasonText: {
    fontSize: 11,
    color: "#c62828",
  },
  cancelBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#d32f2f",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  cancelBtnText: {
    color: "#d32f2f",
    fontWeight: "bold",
    fontSize: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  restaurantImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  restaurantDetails: {
    marginLeft: 12,
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  restaurantAddress: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#666",
    marginLeft: 4,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  foodItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  foodInfo: {
    flex: 1,
  },
  vegIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  foodNameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 6,
  },
  qtyText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  foodSubtotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  itemDivider: {
    backgroundColor: "#f5f5f5",
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: "#666",
  },
  billValue: {
    fontSize: 13,
    color: "#333",
  },
  billDivider: {
    marginVertical: 10,
    backgroundColor: "#eee",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff6b00",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailIcon: {
    marginRight: 12,
  },
  detailTextCol: {
    flex: 1,
  },
  detailTextLabel: {
    fontSize: 11,
    color: "#888",
  },
  detailTextVal: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
    lineHeight: 18,
  },
  detailDivider: {
    backgroundColor: "#f5f5f5",
  },
  trackOrderBtn: {
    backgroundColor: "#ff6b00",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#ff6b00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  trackOrderBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  dialogDescription: {
    color: "#555",
    marginBottom: 16,
    fontSize: 14,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  btnAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnActionText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default OrderDetailsScreen;
