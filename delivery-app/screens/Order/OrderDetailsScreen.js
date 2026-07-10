import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity, Platform } from "react-native";
import { Text, Card, Button, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../../utils/api";

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/delivery/orders`);
      const active = response.data.find(o => o._id === orderId);
      if (active) {
        setOrder(active);
      } else {
        // If not found in active, try fetching history or general details
        const historyRes = await api.get(`/delivery/history`);
        const historical = historyRes.data.find(o => o._id === orderId);
        if (historical) setOrder(historical);
      }
    } catch (err) {
      console.log("Error loading order detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [orderId]);

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await api.put(`/delivery/orders/${orderId}/status`, { status: newStatus });
      Alert.alert("Success", `Status updated to: ${newStatus}`);
      fetchOrderDetails();
    } catch (err) {
      Alert.alert("Update Failed", err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenNavigation = (type) => {
    let lat, lng, name;
    if (type === "restaurant") {
      lat = order.restaurant?.coordinates?.latitude;
      lng = order.restaurant?.coordinates?.longitude;
      name = order.restaurant?.name || "Restaurant";
    } else {
      lat = order.address?.latitude || order.address?.coordinates?.latitude;
      lng = order.address?.longitude || order.address?.coordinates?.longitude;
      name = order.user?.name || "Customer";
    }

    const hasValidCoords = lat !== undefined && lng !== undefined && 
                           !isNaN(Number(lat)) && !isNaN(Number(lng)) && 
                           Number(lat) !== 0 && Number(lng) !== 0;

    if (!hasValidCoords) {
      Alert.alert(
        "Location Coordinates Missing",
        "The exact geographic coordinates (latitude and longitude) for this destination are not registered on the system."
      );
      return;
    }

    const latLng = `${lat},${lng}`;
    const label = encodeURIComponent(name);
    
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${label})`,
      web: `https://www.google.com/maps/search/?api=1&query=${latLng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${latLng}`
    });

    Linking.openURL(url).catch((err) => {
      console.warn("Failed to open main maps URL, attempting fallback:", err);
      const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
      Linking.openURL(fallbackUrl).catch((fallbackErr) => {
        Alert.alert("Navigation Error", "Could not open map navigation or web browser.");
      });
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ff6b00" size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Order details could not be found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Status indicator */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.label}>Delivery Workflow State:</Text>
              <Text style={styles.valueHighlight}>{order.deliveryStatus || "Assigned"}</Text>
            </View>
            <View style={[styles.row, { marginTop: 8 }]}>
              <Text style={styles.label}>Payment Option:</Text>
              <Text style={styles.value}>{order.paymentMethod} ({order.paymentStatus})</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Restaurant details */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text style={styles.sectionHeader}>Pick Up Details (Restaurant)</Text>
            <Text style={styles.partnerName}>{order.restaurant?.name || "Kitchen"}</Text>
            <Text style={styles.addressText}>{order.restaurant?.address}</Text>
            
            <View style={styles.actionRow}>
              <Button
                mode="contained"
                buttonColor="#ff6b00"
                textColor="#ffffff"
                icon="navigation"
                style={styles.actionBtn}
                onPress={() => handleOpenNavigation("restaurant")}
              >
                Navigate
              </Button>
              {order.restaurant?.phone && (
                <Button
                  mode="outlined"
                  textColor="#ff6b00"
                  icon="phone"
                  style={styles.outlineBtn}
                  onPress={() => Linking.openURL(`tel:${order.restaurant.phone}`)}
                >
                  Call Store
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Customer details */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text style={styles.sectionHeader}>Drop Off Details (Customer)</Text>
            <Text style={styles.partnerName}>{order.user?.name || "Guest User"}</Text>
            <Text style={styles.addressText}>
              {order.address?.line1}, {order.address?.line2 ? `${order.address.line2}, ` : ""}{order.address?.city}
            </Text>

            <View style={styles.actionRow}>
              <Button
                mode="contained"
                buttonColor="#10b981"
                textColor="#ffffff"
                icon="navigation"
                style={styles.actionBtn}
                onPress={() => handleOpenNavigation("customer")}
              >
                Navigate
              </Button>
              {order.user?.phone && (
                <Button
                  mode="outlined"
                  textColor="#10b981"
                  icon="phone"
                  style={[styles.outlineBtn, { borderColor: "#10b981" }]}
                  onPress={() => Linking.openURL(`tel:${order.user.phone}`)}
                >
                  Call Client
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Ordered items details */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text style={styles.sectionHeader}>Items Included</Text>
            {(order.items || []).map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.food?.name} x {item.quantity}</Text>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.boldText}>Grand Total Payout</Text>
              <Text style={styles.grandPrice}>₹{order.totalAmount}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Workflow actions triggers */}
        <View style={styles.workflowSection}>
          {updating ? (
            <ActivityIndicator color="#ff6b00" size="small" />
          ) : (
            <>
              {order.deliveryStatus === "Assigned" && (
                <View style={styles.rowBtn}>
                  <Button 
                    mode="contained" 
                    buttonColor="#10b981" 
                    style={styles.flexBtn}
                    onPress={() => handleUpdateStatus("Accepted")}
                  >
                    Accept Assignment
                  </Button>
                  <Button 
                    mode="contained" 
                    buttonColor="#ef4444" 
                    style={styles.flexBtn}
                    onPress={() => handleUpdateStatus("Rejected")}
                  >
                    Reject Task
                  </Button>
                </View>
              )}

              {order.deliveryStatus === "Accepted" && (
                <Button 
                  mode="contained" 
                  buttonColor="#8b5cf6" 
                  style={styles.fullWidthBtn}
                  onPress={() => handleUpdateStatus("Arrived At Restaurant")}
                >
                  Arrived At Store
                </Button>
              )}

              {order.deliveryStatus === "Arrived At Restaurant" && (
                <Button 
                  mode="contained" 
                  buttonColor="#f59e0b" 
                  style={styles.fullWidthBtn}
                  onPress={() => handleUpdateStatus("Picked Up")}
                >
                  Confirm Package Picked Up
                </Button>
              )}

              {order.deliveryStatus === "Picked Up" && (
                <Button 
                  mode="contained" 
                  buttonColor="#10b981" 
                  style={styles.fullWidthBtn}
                  onPress={() => handleUpdateStatus("Delivered")}
                >
                  Package Delivered Successfully
                </Button>
              )}

              {order.deliveryStatus === "Delivered" && order.status !== "Completed" && (
                <View style={{ width: "100%" }}>
                  {order.paymentStatus !== "Paid" && (
                    <Button 
                      mode="contained" 
                      buttonColor="#f59e0b" 
                      style={[styles.fullWidthBtn, { marginBottom: 12 }]}
                      onPress={() => handleUpdateStatus("Cash Collected")}
                    >
                      Payment Received / Cash Collected
                    </Button>
                  )}
                  {order.paymentStatus !== "Paid" && (
                    <Text style={{ color: "#88a", fontSize: 11, textAlign: "center", marginBottom: 12 }}>
                      * Collect payment to enable order completion.
                    </Text>
                  )}
                  <Button 
                    mode="contained" 
                    buttonColor="#10b981" 
                    style={styles.fullWidthBtn}
                    disabled={order.paymentStatus !== "Paid"}
                    onPress={() => handleUpdateStatus("Completed")}
                  >
                    Complete Order
                  </Button>
                </View>
              )}

              {(order.status === "Completed" || order.deliveryStatus === "Completed" || ["Cancelled", "Rejected"].includes(order.status)) && (
                <View style={styles.finishedBadge}>
                  <Text style={styles.finishedLabel}>Delivery Task Resolved ({order.status})</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  header: {
    backgroundColor: "#161b26",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#222a3a",
  },
  backBtn: {
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0f19",
  },
  error: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: "#161b26",
    borderWidth: 1,
    borderColor: "#222a3a",
    borderRadius: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    color: "#667085",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  valueHighlight: {
    fontSize: 12,
    color: "#ff6b00",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailsCard: {
    backgroundColor: "#161b26",
    borderWidth: 1,
    borderColor: "#222a3a",
    borderRadius: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  addressText: {
    fontSize: 11,
    color: "#475467",
    marginTop: 4,
    lineHeight: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
  },
  outlineBtn: {
    flex: 1,
    borderRadius: 12,
    borderColor: "#ff6b00",
    borderWidth: 1.5,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  itemName: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "semibold",
  },
  itemPrice: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#222a3a",
    marginVertical: 10,
  },
  boldText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  grandPrice: {
    fontSize: 14,
    fontWeight: "950",
    color: "#10b981",
  },
  workflowSection: {
    marginTop: 8,
  },
  rowBtn: {
    flexDirection: "row",
    gap: 12,
  },
  flexBtn: {
    flex: 1,
    borderRadius: 12,
  },
  fullWidthBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 4,
  },
  finishedBadge: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  finishedLabel: {
    color: "#475467",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default OrderDetailsScreen;
