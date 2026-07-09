import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Linking } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import orderService from "../../services/orderService";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      const data = await orderService.getOrderDetails(orderId);
      setOrder(data);
    } catch (err) {
      console.log("Error fetching order in tracking:", err);
      const isAuthErr =
        err.message?.includes("Token") ||
        err.message?.includes("authorized") ||
        err.message?.includes("not valid") ||
        err.message?.includes("401");
      if (isAuthErr) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please log in again to continue.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              },
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    
    // Poll every 3 seconds for real-time order state updates
    const interval = setInterval(fetchDetails, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color="#ff6b00" size="large" />
        <Text style={styles.loadingText}>Connecting to GPS...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Could not load tracking information.</Text>
      </View>
    );
  }

  // Get index of the current status
  const statuses = ["Placed", "Accepted", "Preparing", "Ready for Pickup", "Rider Assigned", "Picked Up", "On The Way", "Delivered"];
  
  // Map backend status to our tracking status index
  let currentStatusIndex = 0;
  if (order.status === "Pending") currentStatusIndex = 0;
  else if (order.status === "Confirmed" || order.status === "Accepted") currentStatusIndex = 1;
  else if (order.status === "Preparing") {
    if (order.deliveryStatus === "Arrived At Restaurant") {
      currentStatusIndex = 3;
    } else if (order.deliveryStatus === "Accepted" || order.deliveryStatus === "Assigned") {
      currentStatusIndex = 4;
    } else {
      currentStatusIndex = 2;
    }
  } else if (order.deliveryStatus === "Picked Up") {
    currentStatusIndex = 5;
  } else if (order.status === "Out For Delivery" || order.deliveryStatus === "On The Way" || order.deliveryStatus === "Arrived") {
    currentStatusIndex = 6;
  } else if (order.status === "Delivered" || order.status === "Completed" || order.deliveryStatus === "Delivered" || order.deliveryStatus === "Completed") {
    currentStatusIndex = 7;
  } else if (order.status === "Cancelled") {
    currentStatusIndex = -1;
  }

  const renderTimelineStep = (title, subtitle, index, icon) => {
    const isCompleted = currentStatusIndex >= index && currentStatusIndex !== -1;
    const isActive = currentStatusIndex === index;
    
    let circleBg = "#eee";
    let iconColor = "#888";
    let textColor = "#777";
    let borderStyle = "dashed";
    
    if (isCompleted) {
      circleBg = "#e8f5e9";
      iconColor = "#2e7d32";
      textColor = "#333";
    }
    if (isActive) {
      circleBg = "#fff3e0";
      iconColor = "#ff6b00";
      textColor = "#ff6b00";
      borderStyle = "solid";
    }

    return (
      <View style={styles.stepRow} key={index}>
        <View style={styles.stepIndicatorCol}>
          <View style={[styles.stepCircle, { backgroundColor: circleBg, borderColor: isCompleted || isActive ? iconColor : "#ccc" }]}>
            <MaterialCommunityIcons
              name={isActive ? "dots-horizontal" : isCompleted ? "check" : icon}
              size={18}
              color={iconColor}
            />
          </View>
          {index < statuses.length - 1 && (
            <View
              style={[
                styles.stepLine,
                {
                  borderColor: currentStatusIndex > index ? "#2e7d32" : "#ccc",
                  borderStyle: borderStyle,
                },
              ]}
            />
          )}
        </View>
        <View style={styles.stepContentCol}>
          <Text style={[styles.stepTitle, isActive && styles.activeStepTitle, isCompleted && styles.completedStepTitle]}>
            {title}
          </Text>
          <Text style={styles.stepSubtitle}>{subtitle}</Text>
        </View>
      </View>
    );
  };

  const stepsData = [
    { title: "Placed", subtitle: "We have received your order", icon: "clipboard-text-outline" },
    { title: "Accepted", subtitle: "Restaurant has confirmed your order", icon: "check-decagram-outline" },
    { title: "Preparing", subtitle: "Kitchen is preparing your delicious meal", icon: "fire" },
    { title: "Ready for Pickup", subtitle: "Food package is ready for pickup", icon: "food-takeout-box-outline" },
    { title: "Rider Assigned", subtitle: "Rider is assigned to deliver your order", icon: "account-check-outline" },
    { title: "Picked Up", subtitle: "Rider has picked up your package", icon: "package-variant-closed" },
    { title: "On The Way", subtitle: "Rider is rushing to your address", icon: "moped" },
    { title: "Delivered", subtitle: "Order delivered successfully!", icon: "home-circle-outline" },
  ];

  const handleCallRider = () => {
    Linking.openURL("tel:+919876543210");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* ETA Banner */}
      <View style={styles.etaCard}>
        {order.status === "Cancelled" ? (
          <View style={styles.cancelledHeader}>
            <MaterialCommunityIcons name="alert-circle" size={40} color="#d32f2f" />
            <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            <Text style={styles.cancelledSubtitle}>This order has been cancelled.</Text>
          </View>
        ) : order.status === "Delivered" ? (
          <View style={styles.cancelledHeader}>
            <MaterialCommunityIcons name="check-circle" size={40} color="#2e7d32" />
            <Text style={[styles.cancelledTitle, { color: "#2e7d32" }]}>Delivered</Text>
            <Text style={styles.cancelledSubtitle}>Hope you enjoyed your meal!</Text>
          </View>
        ) : (
          <View style={styles.etaHeader}>
            <Text style={styles.etaLabel}>Estimated Delivery Time</Text>
            <Text style={styles.etaTime}>25 - 35 Mins</Text>
            <View style={styles.progressRow}>
              <ActivityIndicator color="#ff6b00" size={14} style={{ marginRight: 6 }} />
              <Text style={styles.progressLabel}>
                {order.status === "Pending" ? "Waiting for acceptance" : order.status === "Confirmed" ? "Preparing food" : "Rider out for delivery"}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Payment Information Card */}
      <View style={styles.paymentInfoCard}>
        <View style={styles.paymentRow}>
          <MaterialCommunityIcons name="wallet-outline" size={20} color="#ff6b00" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentValue}>{order.paymentMethod}</Text>
          </View>
        </View>
        <View style={styles.paymentDivider} />
        <View style={styles.paymentRow}>
          <MaterialCommunityIcons name="credit-card-check-outline" size={20} color="#ff6b00" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentLabel}>Payment Status</Text>
            <Text style={[styles.paymentValue, { color: order.paymentStatus === "Paid" ? "#2e7d32" : "#f59e0b", fontWeight: "bold" }]}>
              {order.paymentStatus}
            </Text>
          </View>
        </View>
      </View>

      {/* Map Mock representation */}
      <View style={styles.mapMockCard}>
        <View style={styles.mapBackground}>
          <MaterialCommunityIcons name="map" size={54} color="#ddd" />
          <Text style={styles.mapText}>Live GPS Tracking Map</Text>
          <View style={styles.mapPinsRow}>
            <View style={styles.mapPin}>
              <MaterialCommunityIcons name="store" size={24} color="#ff6b00" />
              <Text style={styles.pinLabel}>Shop</Text>
            </View>
            <View style={[styles.mapPin, { marginHorizontal: 32 }]}>
              <MaterialCommunityIcons name="moped" size={28} color="#0288d1" />
              <Text style={[styles.pinLabel, { color: "#0288d1" }]}>Rider</Text>
            </View>
            <View style={styles.mapPin}>
              <MaterialCommunityIcons name="home-map-marker" size={24} color="#2e7d32" />
              <Text style={[styles.pinLabel, { color: "#2e7d32" }]}>Home</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Rider Info Card */}
      {order.status !== "Cancelled" && (
        order.deliveryBoy ? (
          <View style={styles.riderCard}>
            <Image
              source={{ uri: (typeof order.deliveryBoy === 'object' && order.deliveryBoy.profilePhoto) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" }}
              style={styles.riderAvatar}
            />
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>
                {typeof order.deliveryBoy === 'object' ? order.deliveryBoy.name : 'Assigned Rider'}
              </Text>
              <Text style={styles.riderDetails}>FoodExpress Delivery Executive</Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={14} color="#ffb300" />
                <Text style={styles.ratingText}>
                  {typeof order.deliveryBoy === 'object' ? `${order.deliveryBoy.vehicleType || 'Bike'} (${order.deliveryBoy.vehicleNumber || 'Plate Pending'})` : ''}
                </Text>
              </View>
            </View>
            {typeof order.deliveryBoy === 'object' && order.deliveryBoy.phone && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${order.deliveryBoy.phone}`)}
              >
                <MaterialCommunityIcons name="phone" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.riderCard}>
            <View style={[styles.riderAvatar, { backgroundColor: "#fff3e0", alignItems: "center", justifyContent: "center" }]}>
              <MaterialCommunityIcons name="account-clock-outline" size={24} color="#ff6b00" />
            </View>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>Rider Assignment Pending</Text>
              <Text style={styles.riderDetails}>Selecting the best rider for your delivery...</Text>
            </View>
          </View>
        )
      )}

      {/* Status Timeline */}
      <Text style={styles.sectionTitle}>Delivery Status</Text>
      <View style={styles.timelineCard}>
        {stepsData.map((step, index) => renderTimelineStep(step.title, step.subtitle, index, step.icon))}
      </View>
    </ScrollView>
  );
};

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
  etaCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  etaHeader: {
    alignItems: "center",
  },
  etaLabel: {
    fontSize: 13,
    color: "#777",
    fontWeight: "500",
  },
  etaTime: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ff6b00",
    marginVertical: 6,
    letterSpacing: 0.5,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  cancelledHeader: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelledTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginTop: 8,
  },
  cancelledSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  mapMockCard: {
    backgroundColor: "#fff",
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
    marginBottom: 16,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: "#e0f2f1",
    alignItems: "center",
    justifyContent: "center",
  },
  mapText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#00796b",
    marginTop: 4,
    marginBottom: 16,
  },
  mapPinsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapPin: {
    alignItems: "center",
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#e65100",
    marginTop: 2,
  },
  riderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eee",
  },
  riderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riderName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  riderDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    color: "#777",
    marginLeft: 4,
  },
  callBtn: {
    backgroundColor: "#4caf50",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4caf50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#666",
    marginLeft: 4,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timelineCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 64,
  },
  stepIndicatorCol: {
    alignItems: "center",
    width: 32,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLine: {
    flex: 1,
    width: 0,
    borderWidth: 1,
    marginVertical: 4,
  },
  stepContentCol: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 2,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  activeStepTitle: {
    color: "#ff6b00",
    fontWeight: "bold",
  },
  completedStepTitle: {
    color: "#222",
  },
  stepSubtitle: {
    fontSize: 11,
    color: "#777",
    marginTop: 3,
    lineHeight: 14,
  },
  paymentInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentLabel: {
    fontSize: 11,
    color: "#888",
  },
  paymentValue: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
});

export default OrderTrackingScreen;
