import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, SafeAreaView, TextInput, Modal } from "react-native";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import { Text, Divider, Portal, Dialog, RadioButton, Snackbar, ActivityIndicator, Button } from "react-native-paper";
import { useDispatch } from "react-redux";
import orderService from "../../services/orderService";
import { cancelOrderThunk } from "../../redux/slices/ordersSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import api from "../../utils/api";

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

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState(null);

  const showAlert = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const fetchDetails = async (initial = false) => {
    try {
      if (initial) setLoading(true);
      const data = await orderService.getOrderDetails(orderId);
      setOrder(data);
      
      // Load reviews if the order is completed or delivered
      if (data && (data.status === "Delivered" || data.status === "Completed")) {
        try {
          const res = await api.get(`/reviews/order/${orderId}`);
          setReviews(res.data || []);
        } catch (err) {
          console.log("Error loading reviews for order:", err);
        }
      }
    } catch (err) {
      console.log("Error loading order details:", err);
      if (initial) showAlert("Error", "Could not load order details.");
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails(true);

    // Only poll for non-terminal orders. Delivered/Cancelled/Completed orders
    // won't change anymore — polling them wastes API quota.
    const TERMINAL_STATES = ["Delivered", "Cancelled", "Completed"];
    const isTerminalState = (status) => TERMINAL_STATES.includes(status);

    let interval = null;

    // Start a 15-second polling interval (down from 3s) — socket events provide
    // immediate updates when connected; this is just a fallback.
    if (!isTerminalState(undefined)) {
      interval = setInterval(async () => {
        // Re-check after each fetch: if terminal, stop the interval
        try {
          const currentData = await orderService.getOrderDetails(orderId);
          if (currentData) {
            setOrder(currentData);
            if (isTerminalState(currentData.status)) {
              clearInterval(interval);
              interval = null;
            }
          }
        } catch (err) {
          console.log("Error polling order details:", err);
        }
      }, 15000); // 15 seconds — down from 3s
    }

    return () => {
      if (interval) clearInterval(interval);
    };
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
        showAlert("Error", errorMsg);
      })
      .finally(() => {
        setCancelLoading(false);
      });
  };

  const getReviewForFood = (foodId) => {
    return reviews.find(r => r.food === foodId || r.food?._id === foodId || r.food?.id === foodId);
  };
  
  const hasReviewed = (foodId) => {
    return !!getReviewForFood(foodId);
  };

  const handleOpenReviewModal = (item) => {
    const foodId = item.food?._id || item.food?.id;
    const foodName = item.food?.name;
    const existing = getReviewForFood(foodId);
    
    setSelectedFood({ id: foodId, name: foodName });
    
    if (existing) {
      setIsEditing(true);
      setExistingReviewId(existing._id);
      setReviewRating(existing.rating);
      setReviewTitle(existing.title || "");
      setReviewComment(existing.comment || "");
      setReviewImages(existing.images || []);
    } else {
      setIsEditing(false);
      setExistingReviewId(null);
      setReviewRating(5);
      setReviewTitle("");
      setReviewComment("");
      setReviewImages([]);
    }
    setReviewModalVisible(true);
  };

  const handleSimulateAddImage = () => {
    if (reviewImages.length >= 3) {
      showAlert("Limit Reached", "You can upload a maximum of 3 images.");
      return;
    }
    const sampleImages = [
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80"
    ];
    const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setReviewImages(prev => [...prev, randomImg]);
  };

  const handleSubmitReview = async () => {
    if (reviewComment.trim().length < 10) {
      showAlert("Validation Error", "Review description must be at least 10 characters.");
      return;
    }
    
    const payload = {
      foodId: selectedFood.id,
      orderId,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
      images: reviewImages
    };
    
    try {
      if (isEditing) {
        await api.put(`/reviews/${existingReviewId}`, payload);
        showAlert("Success", "Your review has been updated successfully.");
      } else {
        await api.post("/reviews", payload);
        showAlert("Success", "Thank you for sharing your feedback!");
      }
      setReviewModalVisible(false);
      fetchDetails(false);
    } catch (err) {
      console.log("Error submitting review:", err);
      const errMsg = err.response?.data?.message || "Could not submit review.";
      showAlert("Error", errMsg);
    }
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
                  
                  {/* Write/Edit Review Button */}
                  {(order.status === "Delivered" || order.status === "Completed") && (
                    <TouchableOpacity
                      style={styles.reviewItemBtn}
                      onPress={() => handleOpenReviewModal(item)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={hasReviewed(item.food?._id || item.food?.id) ? "star" : "star-outline"}
                        size={14}
                        color="#ff6b00"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.reviewItemBtnText}>
                        {hasReviewed(item.food?._id || item.food?.id) ? "View/Edit Review" : "Write Review"}
                      </Text>
                    </TouchableOpacity>
                  )}
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
          <Dialog 
            visible={cancelVisible} 
            onDismiss={() => setCancelVisible(false)}
            style={{ 
              backgroundColor: "#0f172a", 
              borderRadius: 20, 
              borderWidth: 1, 
              borderColor: "#334155", 
              paddingHorizontal: 4,
              elevation: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 15,
            }}
          >
            <Dialog.Title style={{ color: "#ffffff", fontSize: 18, fontWeight: "900", borderBottomWidth: 1, borderBottomColor: "#1e293b", paddingBottom: 10, marginBottom: 8 }}>
              Cancel Order
            </Dialog.Title>
            <Dialog.Content style={{ paddingTop: 4 }}>
              <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600", marginBottom: 14 }}>
                Why do you want to cancel this order?
              </Text>
              <RadioButton.Group onValueChange={value => setCancelReason(value)} value={cancelReason}>
                {[
                  "Ordered by mistake",
                  "Delivery taking too long",
                  "Change of plans",
                  "Found better option"
                ].map((reasonText) => {
                  const isSelected = cancelReason === reasonText;
                  return (
                    <TouchableOpacity
                      key={reasonText}
                      activeOpacity={0.7}
                      onPress={() => setCancelReason(reasonText)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: isSelected ? "#1e293b" : "#020617",
                        borderColor: isSelected ? "#ef4444" : "#334155",
                        borderWidth: 1.5,
                        borderRadius: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        marginVertical: 4,
                      }}
                    >
                      <RadioButton value={reasonText} color="#ef4444" uncheckedColor="#64748b" />
                      <Text style={{ fontSize: 13, fontWeight: isSelected ? "700" : "500", color: isSelected ? "#ffffff" : "#cbd5e1", marginLeft: 8 }}>
                        {reasonText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}>
              <AppButton mode="text" onPress={() => setCancelVisible(false)} textColor="#94a3b8" labelStyle={{ fontSize: 13, fontWeight: "700" }}>
                Back
              </AppButton>
              <AppButton
                loading={cancelLoading}
                onPress={handleCancelOrder}
                buttonColor="#ef4444"
                textColor="#ffffff"
                style={{ borderRadius: 10, paddingHorizontal: 12 }}
                labelStyle={{ fontSize: 13, fontWeight: "bold" }}
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

      {/* Write / Edit Review Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? "Edit Review" : "Write Review"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedFood?.name}
            </Text>
            <Divider style={styles.modalDivider} />

            {/* Star Selection */}
            <Text style={styles.inputLabel}>Rating</Text>
            <View style={styles.starsSelectionRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setReviewRating(s)}>
                  <MaterialCommunityIcons
                    name={s <= reviewRating ? "star" : "star-outline"}
                    size={32}
                    color="#ff6b00"
                    style={{ marginRight: 8 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Review Title */}
            <Text style={styles.inputLabel}>Title (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={reviewTitle}
              onChangeText={setReviewTitle}
              placeholder="E.g., Delicious!, Fast delivery"
              placeholderTextColor="#999"
            />

            {/* Review Description */}
            <Text style={styles.inputLabel}>Description (Min 10 characters)</Text>
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: "top", paddingTop: 8 }]}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="How was the taste? Was it fresh? (Min 10 characters)"
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={3}
            />

            {/* Food Photos */}
            <View style={styles.photoSectionHeader}>
              <Text style={styles.inputLabel}>Photos ({reviewImages.length}/3)</Text>
              {reviewImages.length < 3 && (
                <TouchableOpacity onPress={handleSimulateAddImage} style={styles.addImageLink}>
                  <Text style={styles.addImageLinkText}>+ Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {reviewImages.length > 0 && (
              <View style={styles.photoPreviewRow}>
                {reviewImages.map((imgUrl, idx) => (
                  <View key={idx} style={styles.photoThumbnailContainer}>
                    <Image source={{ uri: imgUrl }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.removePhotoBadge}
                      onPress={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <MaterialCommunityIcons name="close-circle" size={16} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalButtons}>
              <Button
                mode="text"
                onPress={() => setReviewModalVisible(false)}
                textColor="#666"
                style={styles.modalCancel}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmitReview}
                buttonColor="#ff6b00"
                style={styles.modalSave}
              >
                Submit
              </Button>
            </View>
          </View>
        </View>
      </Modal>

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
  reviewItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#ff6b00",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  reviewItemBtnText: {
    color: "#ff6b00",
    fontSize: 11,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "88%",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  modalDivider: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 6,
  },
  modalInput: {
    height: 42,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    backgroundColor: "#f9f9f9",
    fontSize: 14,
    color: "#333",
  },
  starsSelectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  photoSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  addImageLink: {
    paddingVertical: 2,
  },
  addImageLinkText: {
    color: "#ff6b00",
    fontSize: 12,
    fontWeight: "bold",
  },
  photoPreviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
    gap: 8,
  },
  photoThumbnailContainer: {
    position: "relative",
    width: 56,
    height: 56,
  },
  photoThumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removePhotoBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  modalCancel: {
    marginRight: 8,
  },
  modalSave: {
    borderRadius: 8,
    paddingHorizontal: 12,
  },
});

export default OrderDetailsScreen;
