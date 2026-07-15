import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Linking, SafeAreaView } from "react-native";
import { Text, ActivityIndicator, Card, Button, TextInput } from "react-native-paper";
import orderService from "../../services/orderService";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getSocket } from "../../utils/socket";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import { Platform } from "react-native";
import Constants from "expo-constants";

let MapView, Marker, Polyline;
if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch (e) {
    console.log("react-native-maps loading failed:", e);
  }
}

// React Error Boundary to capture any native MapView crashes
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Google Maps render failed on Android (e.g., API key, system, or library mismatch). Recovering via fallback visualizer. Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const fetchDetails = async () => {
    try {
      const data = await orderService.getOrderTracking(orderId);
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

    const socket = getSocket();
    socket.emit("join-order", orderId);

    socket.on("order-status-updated", (updatedData) => {
      console.log("[Socket] Order status updated:", updatedData.status);
      setOrder(updatedData);
    });

    socket.on("delivery-location", (locData) => {
      console.log("[Socket] Live location received:", locData);
      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentLocation: locData,
          mapCoordinates: {
            ...prev.mapCoordinates,
            deliveryBoy: locData,
          },
        };
      });
    });

    // Fallback poll every 6 seconds
    const interval = setInterval(fetchDetails, 6000);

    return () => {
      clearInterval(interval);
      socket.off("order-status-updated");
      socket.off("delivery-location");
    };
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

  const renderMap = () => {
    const sanitize = (coords, def) => {
      if (!coords) return def;
      const lat = Number(coords.latitude);
      const lng = Number(coords.longitude);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        return def;
      }
      return { latitude: lat, longitude: lng };
    };

    const restCoords = sanitize(order.mapCoordinates?.restaurant, { latitude: 18.1560, longitude: 74.5775 });
    const custCoords = sanitize(order.mapCoordinates?.customer, { latitude: 18.1510, longitude: 74.5780 });
    const riderCoords = sanitize(order.currentLocation || order.mapCoordinates?.deliveryBoy, null);

    const hasRider = !!riderCoords;

    const renderWebFallbackMap = () => (
      <View style={styles.webMapCard}>
        <Text style={styles.mapTitle}>Live Delivery Route GPS Tracker</Text>
        <View style={styles.webMapBackground}>
          <View style={styles.svgContainer}>
            {/* Restaurant */}
            <View style={[styles.mapWebMarker, { left: "15%", top: "30%" }]}>
              <MaterialCommunityIcons name="store" size={28} color="#ff6b00" />
              <Text style={styles.webMarkerLabel}>Store</Text>
            </View>

            {/* Rider */}
            {hasRider && (
              <View style={[styles.mapWebMarker, { left: "45%", top: "50%" }]}>
                <MaterialCommunityIcons name="moped" size={28} color="#0288d1" />
                <Text style={[styles.webMarkerLabel, { color: "#0288d1", fontWeight: "bold" }]}>
                  Rider ({order.status === "Out For Delivery" ? "On The Way" : order.status})
                </Text>
              </View>
            )}

            {/* Home */}
            <View style={[styles.mapWebMarker, { left: "80%", top: "70%" }]}>
              <MaterialCommunityIcons name="home-map-marker" size={28} color="#2e7d32" />
              <Text style={[styles.webMarkerLabel, { color: "#2e7d32" }]}>Home</Text>
            </View>
          </View>
        </View>
        <View style={styles.mapDetailsRow}>
          <Text style={styles.mapDetailsText}>Distance: {order.eta?.distance || "~1.8 km"}</Text>
          <Text style={styles.mapDetailsText}>Estimated Time: {order.eta?.duration || "~12 mins"}</Text>
        </View>
      </View>
    );

    const hasGoogleMapsKey = !!Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
    const isExpoGo = Constants.appOwnership === "expo" || Constants.executionEnvironment === "store-client";
    const canUseNativeMap = isExpoGo || hasGoogleMapsKey;

    if (Platform.OS === "web" || !MapView || !canUseNativeMap) {
      return renderWebFallbackMap();
    }

    const initialRegion = {
      latitude: (Number(restCoords.latitude) + Number(custCoords.latitude)) / 2,
      longitude: (Number(restCoords.longitude) + Number(custCoords.longitude)) / 2,
      latitudeDelta: Math.max(Math.abs(Number(restCoords.latitude) - Number(custCoords.latitude)) * 2, 0.01) || 0.02,
      longitudeDelta: Math.max(Math.abs(Number(restCoords.longitude) - Number(custCoords.longitude)) * 2, 0.01) || 0.02,
    };

    return (
      <MapErrorBoundary fallback={renderWebFallbackMap()}>
        <View style={styles.webMapCard}>
          <MapView style={styles.nativeMap} initialRegion={initialRegion}>
            {/* Restaurant Marker */}
            <Marker
              coordinate={{ latitude: Number(restCoords.latitude), longitude: Number(restCoords.longitude) }}
              title={order.restaurant?.name || "Restaurant"}
              description="Pick up point"
            >
              <View style={styles.nativeMarkerContainer}>
                <MaterialCommunityIcons name="store" size={26} color="#ff6b00" />
              </View>
            </Marker>

            {/* Customer Marker */}
            <Marker
              coordinate={{ latitude: Number(custCoords.latitude), longitude: Number(custCoords.longitude) }}
              title="Your Address"
              description="Drop off point"
            >
              <View style={styles.nativeMarkerContainer}>
                <MaterialCommunityIcons name="home-map-marker" size={26} color="#2e7d32" />
              </View>
            </Marker>

            {/* Rider Marker */}
            {hasRider && (
              <Marker
                coordinate={{ latitude: Number(riderCoords.latitude), longitude: Number(riderCoords.longitude) }}
                title={typeof order.deliveryBoy === "object" ? order.deliveryBoy.name : "Rider"}
                description="Delivery executive"
              >
                <View style={[styles.nativeMarkerContainer, { backgroundColor: "#e0f2fe" }]}>
                  <MaterialCommunityIcons name="moped" size={26} color="#0288d1" />
                </View>
              </Marker>
            )}

            {/* Polyline Route */}
            <Polyline
              coordinates={
                hasRider
                  ? [
                      { latitude: Number(restCoords.latitude), longitude: Number(restCoords.longitude) },
                      { latitude: Number(riderCoords.latitude), longitude: Number(riderCoords.longitude) },
                      { latitude: Number(custCoords.latitude), longitude: Number(custCoords.longitude) },
                    ]
                  : [
                      { latitude: Number(restCoords.latitude), longitude: Number(restCoords.longitude) },
                      { latitude: Number(custCoords.latitude), longitude: Number(custCoords.longitude) },
                    ]
              }
              strokeColor="#ff6b00"
              strokeWidth={4}
            />
          </MapView>
        </View>
      </MapErrorBoundary>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <CustomScreenHeader title="Track Order" navigation={navigation} />
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

      {/* Cancel Order Card/Button */}
      {((order.status === "Pending" || order.status === "Confirmed" || order.status === "Placed") && 
        (!order.deliveryBoy || order.deliveryStatus === "None" || order.deliveryStatus === "Assigned")) && (
        <View style={{ marginBottom: 16 }}>
          {showCancelInput ? (
            <Card style={{ backgroundColor: "#fef2f2", borderStyle: "dashed", borderWidth: 1, borderColor: "#ef4444", padding: 12, borderRadius: 12 }}>
              <Text style={{ fontWeight: "bold", color: "#ef4444", marginBottom: 6, fontSize: 13 }}>
                Reason for Cancellation:
              </Text>
              <TextInput
                mode="outlined"
                placeholder="e.g. Changed my mind / ordered wrong items"
                value={cancelReason}
                onChangeText={setCancelReason}
                style={{ height: 40, backgroundColor: "#fff", marginBottom: 12 }}
              />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  mode="contained"
                  buttonColor="#ef4444"
                  textColor="#fff"
                  style={{ flex: 1 }}
                  labelStyle={{ fontSize: 12 }}
                  onPress={async () => {
                    if (!cancelReason.trim()) {
                      Alert.alert("Reason Required", "Please enter a reason for cancellation.");
                      return;
                    }
                    try {
                      setLoading(true);
                      const updatedOrder = await orderService.cancelOrder(orderId, cancelReason);
                      setOrder(prev => ({ ...prev, ...updatedOrder, status: "Cancelled" }));
                      setShowCancelInput(false);
                      Alert.alert("Order Cancelled", "Your order has been successfully cancelled.");
                    } catch (err) {
                      Alert.alert("Failed to Cancel", err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Confirm Cancel
                </Button>
                <Button
                  mode="outlined"
                  textColor="#666"
                  style={{ borderColor: "#ccc" }}
                  labelStyle={{ fontSize: 12 }}
                  onPress={() => setShowCancelInput(false)}
                >
                  Keep Order
                </Button>
              </View>
            </Card>
          ) : (
            <Button
              mode="contained"
              buttonColor="#ef4444"
              textColor="#fff"
              style={{ borderRadius: 12 }}
              onPress={() => {
                setCancelReason("");
                setShowCancelInput(true);
              }}
            >
              Cancel Order
            </Button>
          )}
        </View>
      )}

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

      {renderMap()}

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

      {/* Verification OTP display */}
      {order.status !== "Cancelled" && order.status !== "Delivered" && order.status !== "Completed" && (order.orderDetails?.otp || order.otp) && (
        <View style={styles.otpCard}>
          <MaterialCommunityIcons name="shield-lock-outline" size={24} color="#ff6b00" />
          <View style={styles.otpInfo}>
            <Text style={styles.otpTitle}>Delivery OTP Code</Text>
            <Text style={styles.otpSubtitle}>Share this OTP with the rider when they arrive to confirm delivery.</Text>
          </View>
          <View style={styles.otpCodeContainer}>
            <Text style={styles.otpCodeText}>{order.orderDetails?.otp || order.otp}</Text>
          </View>
        </View>
      )}

      {/* Status Timeline */}
      <Text style={styles.sectionTitle}>Delivery Status</Text>
      <View style={styles.timelineCard}>
        {stepsData.map((step, index) => renderTimelineStep(step.title, step.subtitle, index, step.icon))}
      </View>
    </ScrollView>
    </SafeAreaView>
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
  otpCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  otpInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  otpTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
  },
  otpSubtitle: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
    lineHeight: 14,
  },
  otpCodeContainer: {
    backgroundColor: "#fff3e0",
    borderWidth: 1,
    borderColor: "#ffe0b2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  otpCodeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b00",
    letterSpacing: 1,
  },
  webMapCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  mapTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#667085",
    marginBottom: 12,
  },
  webMapBackground: {
    height: 180,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dcfce7",
    position: "relative",
    overflow: "hidden",
  },
  svgContainer: {
    flex: 1,
    position: "relative",
  },
  mapWebMarker: {
    position: "absolute",
    alignItems: "center",
  },
  webMarkerLabel: {
    fontSize: 10,
    color: "#ff6b00",
    fontWeight: "600",
    marginTop: 2,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mapDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  mapDetailsText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  nativeMap: {
    height: 200,
    borderRadius: 12,
  },
  nativeMarkerContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    borderWidth: 1.5,
    borderColor: "#eee",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
});

export default OrderTrackingScreen;
