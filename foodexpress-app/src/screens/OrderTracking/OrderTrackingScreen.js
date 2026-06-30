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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    
    // Poll every 10 seconds to show dynamic status changes if they occur
    const interval = setInterval(fetchDetails, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color="#22C55E" size="large" />
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
  const statuses = ["Pending", "Confirmed", "Preparing", "Rider Assigned", "Out For Delivery", "Delivered"];
  
  // Map backend status to our tracking status index
  let currentStatusIndex = 0;
  if (order.status === "Confirmed") currentStatusIndex = 1;
  else if (order.status === "Preparing") currentStatusIndex = 2;
  else if (order.status === "Out For Delivery") currentStatusIndex = 4;
  else if (order.status === "Delivered") currentStatusIndex = 5;
  else if (order.status === "Cancelled") currentStatusIndex = -1;

  // We can inject "Rider Assigned" (index 3) when preparation is underway to look premium!
  if (order.status === "Preparing" && new Date(order.createdAt).getTime() % 2 === 0) {
    currentStatusIndex = 3;
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
      circleBg = "#DCFCE7";
      iconColor = "#16A34A";
      textColor = "#16A34A";
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
    { title: "Order Placed", subtitle: "We have received your order request", icon: "clipboard-text-outline" },
    { title: "Order Accepted", subtitle: "Restaurant has confirmed your order", icon: "check-decagram-outline" },
    { title: "Food Preparing", subtitle: "Kitchen is preparing your delicious meal", icon: "fire" },
    { title: "Rider Assigned", subtitle: "Delivery executive is picking up the food", icon: "account-check-outline" },
    { title: "Out for Delivery", subtitle: "Rider is rushing to your address", icon: "moped" },
    { title: "Delivered", subtitle: "Food has reached your door! Enjoy!", icon: "home-circle-outline" },
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
              <ActivityIndicator color="#22C55E" size={14} style={{ marginRight: 6 }} />
              <Text style={styles.progressLabel}>
                {order.status === "Pending" ? "Waiting for acceptance" : order.status === "Confirmed" ? "Preparing food" : "Rider out for delivery"}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Map Mock representation */}
      <View style={styles.mapMockCard}>
        <View style={styles.mapBackground}>
          <MaterialCommunityIcons name="map" size={54} color="#ddd" />
          <Text style={styles.mapText}>Live GPS Tracking Map</Text>
          <View style={styles.mapPinsRow}>
            <View style={styles.mapPin}>
              <MaterialCommunityIcons name="store" size={24} color="#22C55E" />
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
        <View style={styles.riderCard}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" }}
            style={styles.riderAvatar}
          />
          <View style={styles.riderInfo}>
            <Text style={styles.riderName}>Ramesh Kumar</Text>
            <Text style={styles.riderDetails}>FoodExpress Delivery Executive</Text>
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={14} color="#ffb300" />
              <Text style={styles.ratingText}>4.8 Rating • Splendor (MH 12 AB 1234)</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCallRider}
          >
            <MaterialCommunityIcons name="phone" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
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
    color: "#22C55E",
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
    color: "#16A34A",
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
    color: "#16A34A",
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
});

export default OrderTrackingScreen;
