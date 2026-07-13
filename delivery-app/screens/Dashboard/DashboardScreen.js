import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList } from "react-native";
import { Text, Switch, ActivityIndicator, Card, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import api from "../../utils/api";
import { getSocket } from "../../utils/socket";

const DashboardScreen = ({ navigation }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({ todayEarnings: 0, completedCount: 0, avgRating: 4.8 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const locationInterval = useRef(null);
  const orderPollInterval = useRef(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get("/delivery/earnings"),
        api.get("/delivery/orders")
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.log("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Load active status
    const loadStatus = async () => {
      try {
        const statsRes = await api.get("/delivery/earnings");
        // We assume profile endpoint or earnings returns stats
      } catch (e) {}
    };
    loadStatus();

    // Listen to real-time events via Socket.IO
    const socket = getSocket();
    socket.emit("join-role", "delivery");

    socket.on("order-status-updated", (updatedOrder) => {
      console.log("[Socket] Received status update in delivery dashboard:", updatedOrder);
      fetchDashboardData();
    });

    socket.on("delivery-assigned", (updatedOrder) => {
      console.log("[Socket] Received new delivery assignment:", updatedOrder);
      fetchDashboardData();
    });

    // Fallback poll active orders every 8 seconds
    orderPollInterval.current = setInterval(fetchDashboardData, 8000);

    return () => {
      clearInterval(orderPollInterval.current);
      if (locationInterval.current) clearInterval(locationInterval.current);
      socket.off("order-status-updated");
      socket.off("delivery-assigned");
    };
  }, []);

  // Online / Offline Switch Toggle
  const handleToggleOnline = async () => {
    try {
      const response = await api.put("/delivery/status");
      const onlineState = response.data.isOnline;
      setIsOnline(onlineState);

      if (onlineState) {
        startLocationTracking();
        Alert.alert("You are now Online", "Admins can now assign orders to you.");
      } else {
        stopLocationTracking();
        Alert.alert("You are Offline", "No new assignments will be dispatched.");
      }
    } catch (err) {
      Alert.alert("Failed to update status", err.message);
    }
  };

  // Start Location Tracking GPS Service
  const startLocationTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("GPS Access Denied", "Location permissions are required to go online.");
      setIsOnline(false);
      return;
    }

    // Immediately send current location
    sendLocationUpdate();

    // Setup periodic updates every 5 seconds
    locationInterval.current = setInterval(sendLocationUpdate, 5000);
  };

  const stopLocationTracking = () => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  };

  const sendLocationUpdate = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      
      // Determine if there is an active order
      const activeOrder = orders.find(o => ["Accepted", "Arrived At Restaurant", "Picked Up", "Out For Delivery"].includes(o.deliveryStatus || o.status));
      const activeOrderId = activeOrder ? activeOrder._id : null;

      await api.put("/delivery/location", {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        orderId: activeOrderId,
        heading: loc.coords.heading || 0,
        speed: loc.coords.speed || 0,
      });

      console.log("Rider GPS coordinates synced:", loc.coords.latitude, loc.coords.longitude);

      // Emit low latency real-time socket event
      if (activeOrderId) {
        const socket = getSocket();
        if (socket) {
          socket.emit("update-location", {
            orderId: activeOrderId,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading || 0,
            speed: loc.coords.speed || 0,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.log("GPS Location update failed:", err.message);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned": return "#3b82f6";
      case "Accepted": return "#8b5cf6";
      case "Arrived At Restaurant": return "#ec4899";
      case "Picked Up": return "#ff6b00";
      default: return "#ff6b00";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Panel */}
      <View style={styles.header}>
        <View style={styles.riderRow}>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")} activeOpacity={0.8}>
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={24} color="#ff6b00" />
            </View>
          </TouchableOpacity>
          <View style={styles.onlineContainer}>
            <Text style={[styles.onlineLabel, { color: isOnline ? "#10b981" : "#667085" }]}>
              {isOnline ? "Online" : "Offline"}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              color="#10b981"
            />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentScroll} keyboardShouldPersistTaps="handled">
        {/* Earnings Stats Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statsCard}>
            <Card.Content style={styles.center}>
              <MaterialCommunityIcons name="currency-inr" size={24} color="#10b981" />
              <Text style={styles.statsTitle}>Today's Earnings</Text>
              <Text style={styles.statsValue}>₹{stats.todayEarnings || 0}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content style={styles.center}>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color="#ff6b00" />
              <Text style={styles.statsTitle}>Completed</Text>
              <Text style={styles.statsValue}>{stats.completedCount || 0}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content style={styles.center}>
              <MaterialCommunityIcons name="star-outline" size={24} color="#ffb300" />
              <Text style={styles.statsTitle}>Rating</Text>
              <Text style={styles.statsValue}>{stats.avgRating || "4.8"}</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Assigned Orders List */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned Active Tasks ({orders.length})</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <MaterialCommunityIcons name="refresh" size={18} color="#ff6b00" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#ff6b00" size="small" style={{ marginTop: 24 }} />
          ) : orders.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={48} color="#334155" />
              <Text style={styles.emptyText}>No active deliveries assigned yet.</Text>
              <Text style={styles.emptySubtext}>Admins will dispatch orders here once you are Online.</Text>
            </View>
          ) : (
            orders.map((item) => (
              <Card 
                key={item._id} 
                style={styles.orderCard}
                onPress={() => navigation.navigate("OrderDetails", { orderId: item._id })}
              >
                <Card.Content>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>#{item.orderNumber || item._id.slice(-6).toUpperCase()}</Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <View style={[styles.statusBadge, { backgroundColor: item.paymentMethod === "Cash on Delivery" ? "#b91c1c" : "#047857" }]}>
                        <Text style={styles.statusBadgeText}>{item.paymentMethod === "Cash on Delivery" ? "COD" : "Paid Online"}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.deliveryStatus) }]}>
                        <Text style={styles.statusBadgeText}>{item.deliveryStatus}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.locationRow}>
                    <MaterialCommunityIcons name="store" size={16} color="#ff6b00" style={styles.iconOffset} />
                    <View style={styles.locationTextCol}>
                      <Text style={styles.locName}>{item.restaurant?.name || "Kitchen"}</Text>
                      <Text style={styles.locAddr} numberOfLines={1}>{item.restaurant?.address}</Text>
                    </View>
                  </View>

                  <View style={[styles.locationRow, { marginTop: 12 }]}>
                    <MaterialCommunityIcons name="home-map-marker" size={18} color="#10b981" style={styles.iconOffset} />
                    <View style={styles.locationTextCol}>
                      <Text style={styles.locName}>{item.user?.name || "Customer"}</Text>
                      <Text style={styles.locAddr} numberOfLines={1}>{item.address?.line1}, {item.address?.city}</Text>
                    </View>
                  </View>

                  <Button
                    mode="contained"
                    buttonColor="#1e293b"
                    textColor="#ffffff"
                    style={styles.detailBtn}
                    onPress={() => navigation.navigate("OrderDetails", { orderId: item._id })}
                  >
                    View Details & Update Workflow
                  </Button>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        {/* History Redirect Footer */}
        <Button
          mode="outlined"
          textColor="#667085"
          style={styles.historyBtn}
          onPress={() => navigation.navigate("DeliveryHistory")}
        >
          View Finished / Cancelled Deliveries
        </Button>
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
    borderBottomWidth: 1,
    borderColor: "#222a3a",
  },
  riderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#222a3a",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  onlineLabel: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contentScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#161b26",
    borderWidth: 1,
    borderColor: "#222a3a",
  },
  center: {
    alignItems: "center",
  },
  statsTitle: {
    fontSize: 9,
    color: "#667085",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 6,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },
  listSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyState: {
    backgroundColor: "#161b26",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#222a3a",
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 12,
  },
  emptySubtext: {
    color: "#475467",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 14,
  },
  orderCard: {
    backgroundColor: "#161b26",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#222a3a",
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: "#222a3a",
    marginVertical: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconOffset: {
    marginTop: 2,
  },
  locationTextCol: {
    marginLeft: 8,
    flex: 1,
  },
  locName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  locAddr: {
    fontSize: 10,
    color: "#667085",
    marginTop: 1.5,
  },
  detailBtn: {
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 2,
  },
  historyBtn: {
    borderRadius: 12,
    borderColor: "#222a3a",
    borderWidth: 1,
    marginTop: 16,
  },
});

export default DashboardScreen;
