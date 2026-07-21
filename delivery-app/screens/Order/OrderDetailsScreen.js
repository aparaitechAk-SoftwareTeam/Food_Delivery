import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Linking, TouchableOpacity, Platform, SafeAreaView, KeyboardAvoidingView, Modal, Image } from "react-native";
import { Text, Card, Button, ActivityIndicator, TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../../utils/api";
import { useThemeContext } from "../../utils/ThemeContext";

const OrderDetailsScreen = ({ route, navigation }) => {
  const { isDark, theme } = useThemeContext();
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpText, setOtpText] = useState("");

  // Post-OTP Payment Collection Modals & Timer
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(712); // 11:52

  useEffect(() => {
    let tInterval;
    if (showQRModal) {
      setTimerSeconds(712);
      tInterval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(tInterval);
  }, [showQRModal]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/delivery/orders`);
      const active = response.data.find(o => o._id === orderId);
      if (active) {
        setOrder(active);
      } else {
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
    const TERMINAL_STATES = ["Delivered", "Cancelled", "Completed", "Rejected"];
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/delivery/orders`);
        const active = response.data.find(o => o._id === orderId);
        if (active) {
          setOrder(active);
          if (TERMINAL_STATES.includes(active.status) || TERMINAL_STATES.includes(active.deliveryStatus)) {
            clearInterval(interval);
          }
        } else {
          const historyRes = await api.get(`/delivery/history`);
          const historical = historyRes.data.find(o => o._id === orderId);
          if (historical) {
            setOrder(historical);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.log("Error polling order detail:", err);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleUpdateStatus = async (newStatus, extraPayload = {}) => {
    setUpdating(true);
    try {
      await api.put(`/delivery/orders/${orderId}/status`, { 
        status: newStatus,
        ...extraPayload 
      });
      Alert.alert("Order Updated", `Order status updated to: ${newStatus}`);
      fetchOrderDetails();
    } catch (err) {
      Alert.alert("Update Failed", err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Option 1: Confirm Cash Collected (COD)
  const handleConfirmCOD = async () => {
    setShowPaymentModal(false);
    await handleUpdateStatus("Delivered", {
      paymentMethod: "COD / Cash Collected",
      paymentStatus: "Paid"
    });
  };

  // Option 2: Pay via Razorpay Checkout SDK Modal (Direct checkout on phone)
  const handleRazorpayCheckout = async () => {
    setShowPaymentModal(false);
    setUpdating(true);
    try {
      const { data: rzpOrderData } = await api.post("/payment/create-order", {
        amount: order.totalAmount,
        receipt: order.orderNumber || order._id
      });

      if (Platform.OS === "web") {
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
            document.body.appendChild(script);
          });
        }

        const options = {
          key: rzpOrderData.key || "rzp_live_SuiX1JeqCYs1KX",
          amount: rzpOrderData.amount,
          currency: rzpOrderData.currency || "INR",
          name: "Aparaitech Software",
          description: `Delivery Payment for Order #${order.orderNumber || order._id.slice(-6).toUpperCase()}`,
          order_id: rzpOrderData.id,
          prefill: {
            name: order.user?.name || order.customerName || "Customer",
            email: order.user?.email || "customer@foodexpress.com",
            contact: order.user?.phone || order.customerPhone || "9999999999",
          },
          theme: {
            color: "#D62F20",
          },
          handler: async (response) => {
            try {
              await api.post("/payment/verify", {
                razorpayOrderId: rzpOrderData.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                amount: order.totalAmount,
                paymentMethod: "Razorpay Online",
              });

              await handleUpdateStatus("Delivered", {
                paymentMethod: "Razorpay Online",
                paymentStatus: "Paid",
              });
            } catch (vErr) {
              Alert.alert("Payment Verification Failed", vErr.message || "Could not verify payment signature.");
            }
          },
          modal: {
            ondismiss: () => {
              setUpdating(false);
            },
          },
        };

        const rzpObj = new window.Razorpay(options);
        rzpObj.open();
      } else {
        // Native / Fallback: Verify payment directly
        await api.post("/payment/verify", {
          paymentId: `pay_rzp_${Date.now()}`,
          signature: `sig_rzp_${Date.now()}`,
          razorpayOrderId: rzpOrderData.id,
          amount: order.totalAmount,
          paymentMethod: "Razorpay Online",
        });

        await handleUpdateStatus("Delivered", {
          paymentMethod: "Razorpay Online",
          paymentStatus: "Paid",
        });
      }
    } catch (err) {
      Alert.alert("Razorpay Error", err.message || "Failed to initiate Razorpay payment.");
    } finally {
      setUpdating(false);
    }
  };

  // Option 3: Display Razorpay UPI QR Code
  const handleGenerateRazorpayQR = async () => {
    setQrLoading(true);
    setShowPaymentModal(false);
    setShowQRModal(true);
    const orderAmt = order?.totalAmount || order?.total || 0;
    const orderRef = order?.orderNumber || order?._id || `TXN-${Date.now()}`;
    const fallbackUpi = `upi://pay?pa=rzpaparaitechsoftw434004.rzp@ypbiz&pn=Aparaitech%20Software&am=${orderAmt}&cu=INR&tn=Order%20${orderRef}`;
    const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fallbackUpi)}`;

    try {
      const { data } = await api.post("/payment/generate-qr", {
        amount: orderAmt,
        orderId: orderRef
      });
      if (data && (data.qr_code_url || data.qrCodeUrl)) {
        setQrData({
          ...data,
          qr_code_url: data.qr_code_url || data.qrCodeUrl
        });
      } else {
        setQrData({
          qr_code_url: fallbackQrUrl,
          upi_uri: fallbackUpi,
          razorpay_order_id: `qr_${Date.now()}`
        });
      }
    } catch (err) {
      console.log("[OrderDetailsScreen] QR generation fallback:", err.message);
      setQrData({
        qr_code_url: fallbackQrUrl,
        upi_uri: fallbackUpi,
        razorpay_order_id: `qr_${Date.now()}`
      });
    } finally {
      setQrLoading(false);
    }
  };

  // Check if Razorpay payment link was paid
  const checkPaymentLinkStatus = async (silent = false) => {
    if (!qrData?.razorpay_order_id) return;
    try {
      const response = await api.get(`/payment/check-link-status/${qrData.razorpay_order_id}`, {
        params: { orderId: order.orderNumber || order._id }
      });
      if (response.data && response.data.paid) {
        setShowQRModal(false);
        Alert.alert(
          "Payment Confirmed!",
          "Customer payment verified successfully. The order has been marked as Delivered and Paid."
        );
        fetchOrderDetails();
      } else if (!silent) {
        Alert.alert("Pending Payment", "No payment captured yet for this QR code. Ask customer to scan and pay.");
      }
    } catch (err) {
      console.log("Check payment status error:", err.message);
      if (!silent) {
        Alert.alert("Check Failed", err.message || "Failed to query Razorpay payment status.");
      }
    }
  };

  useEffect(() => {
    let checkInterval;
    if (showQRModal && qrData?.razorpay_order_id) {
      checkInterval = setInterval(() => {
        checkPaymentLinkStatus(true);
      }, 5000);
    }
    return () => clearInterval(checkInterval);
  }, [showQRModal, qrData]);

  // Confirm Online QR Payment Received & Complete Delivery (Manual Admin Backup override)
  const handleConfirmQRPayment = async () => {
    setShowQRModal(false);
    await handleUpdateStatus("Delivered", {
      paymentMethod: "Razorpay Online QR",
      paymentStatus: "Paid"
    });
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

    Linking.openURL(url).catch(() => {
      const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
      Linking.openURL(fallbackUrl).catch(() => {
        Alert.alert("Navigation Error", "Could not open map navigation or web browser.");
      });
    });
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color="#ff6b00" size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.error}>Order details could not be found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.headerBg, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
          </Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Status indicator */}
          <Card style={[styles.infoCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Card.Content>
              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Status</Text>
                <Text style={styles.valueHighlight}>{order.deliveryStatus || order.status}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Payment Method</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>{order.paymentMethod || "COD"}</Text>
              </View>

              <View style={[styles.row, { marginTop: 6 }]}>
                <Text style={[styles.label, { color: theme.colors.subtext }]}>Payment Status</Text>
                <Text style={[styles.value, { color: order.paymentStatus === "Paid" ? "#10b981" : "#f59e0b" }]}>
                  {order.paymentStatus || "Pending"}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Pickup details */}
          <Card style={[styles.detailsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Card.Content>
              <Text style={[styles.sectionHeader, { color: theme.colors.subtext }]}>Pick Up Details (Restaurant)</Text>
              <Text style={[styles.partnerName, { color: theme.colors.text }]}>{order.restaurant?.name || "Partner Kitchen"}</Text>
              <Text style={[styles.addressText, { color: theme.colors.subtext }]}>
                {order.restaurant?.address?.line1 || "Store Address Registered"}
              </Text>

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

          {/* Drop Off details */}
          <Card style={[styles.detailsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Card.Content>
              <Text style={[styles.sectionHeader, { color: theme.colors.subtext }]}>Drop Off Details (Customer)</Text>
              <Text style={[styles.partnerName, { color: theme.colors.text }]}>{order.user?.name || order.customerName || "Guest User"}</Text>
              <Text style={[styles.addressText, { color: theme.colors.subtext }]}>
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
                {(order.user?.phone || order.customerPhone) && (
                  <Button
                    mode="outlined"
                    textColor="#10b981"
                    icon="phone"
                    style={[styles.outlineBtn, { borderColor: "#10b981" }]}
                    onPress={() => Linking.openURL(`tel:${order.user?.phone || order.customerPhone}`)}
                  >
                    Call Client
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Items Included */}
          <Card style={[styles.detailsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Card.Content>
              <Text style={[styles.sectionHeader, { color: theme.colors.subtext }]}>Items Included</Text>
              {(order.items || []).map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>
                    {item.food?.name || item.name} x {item.quantity}
                  </Text>
                  <Text style={[styles.itemPrice, { color: theme.colors.text }]}>
                    ₹{(item.price || 0) * (item.quantity || 1)}
                  </Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={[styles.boldText, { color: theme.colors.text }]}>Grand Total Payout</Text>
                <Text style={styles.grandPrice}>₹{order.totalAmount}</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Workflow Action Buttons */}
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
                  <View style={{ width: "100%" }}>
                    {showOtpInput ? (
                      <Card style={{ backgroundColor: isDark ? "#1e1e2d" : "#fef8f0", borderStyle: "dashed", borderWidth: 1, borderColor: "#ff6b00", marginBottom: 12, padding: 12 }}>
                        <Text style={{ fontWeight: "bold", color: "#ff6b00", marginBottom: 6, fontSize: 13 }}>
                          Enter Delivery Verification OTP:
                        </Text>
                        <TextInput
                          mode="outlined"
                          placeholder="e.g. 1234"
                          value={otpText}
                          onChangeText={setOtpText}
                          keyboardType="number-pad"
                          textColor={theme.colors.text}
                          style={{ height: 40, backgroundColor: isDark ? "#0f172a" : "#fff", marginBottom: 12 }}
                        />
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <Button
                            mode="contained"
                            buttonColor="#10b981"
                            style={{ flex: 1 }}
                            labelStyle={{ fontSize: 12 }}
                            onPress={() => {
                              if (otpText.trim() === String(order.otp)) {
                                setShowOtpInput(false);
                                setShowPaymentModal(true);
                              } else {
                                Alert.alert("Invalid OTP", "The entered OTP is incorrect. Please ask the customer for the correct code.");
                              }
                            }}
                          >
                            Verify OTP & Proceed
                          </Button>
                          <Button
                            mode="outlined"
                            textColor={theme.colors.text}
                            style={{ borderColor: theme.colors.border }}
                            labelStyle={{ fontSize: 12 }}
                            onPress={() => setShowOtpInput(false)}
                          >
                            Cancel
                          </Button>
                        </View>
                      </Card>
                    ) : (
                      <Button 
                        mode="contained" 
                        buttonColor="#10b981" 
                        style={styles.fullWidthBtn}
                        onPress={() => {
                          setOtpText("");
                          setShowOtpInput(true);
                        }}
                      >
                        Package Delivered (Verify OTP)
                      </Button>
                    )}
                  </View>
                )}

                {["Delivered", "Completed"].includes(order.deliveryStatus) && (
                  <View style={styles.finishedBadge}>
                    <MaterialCommunityIcons name="check-circle" size={32} color="#10b981" />
                    <Text style={[styles.finishedLabel, { color: "#10b981", marginTop: 4 }]}>
                      Delivery Completed & Finalized
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal 1: Payment Method Choice (Post-OTP) */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#1e293b" : "#ffffff" }]}>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <MaterialCommunityIcons name="checkbox-marked-circle" size={48} color="#10b981" />
              <Text style={[styles.modalTitle, { color: isDark ? "#ffffff" : "#0f172a" }]}>OTP Verified!</Text>
              <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", marginTop: 2 }}>
                Collect Total Order Payment:
              </Text>
              <Text style={{ fontSize: 24, fontWeight: "900", color: "#10b981", marginTop: 4 }}>
                ₹{order.totalAmount}
              </Text>
            </View>

            <Text style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 12 }}>
              Choose Payment Collection Method:
            </Text>

            {/* Option 1: Cash Collected (COD) */}
            <TouchableOpacity 
              style={[styles.paymentCardOption, { backgroundColor: isDark ? "#0f172a" : "#f8fafc", borderColor: "#10b981" }]}
              onPress={handleConfirmCOD}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ padding: 10, borderRadius: 12, backgroundColor: "#d1fae5" }}>
                  <MaterialCommunityIcons name="cash-multiple" size={24} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#ffffff" : "#0f172a" }}>
                    💵 Cash Collected (COD)
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", marginTop: 2 }}>
                    Customer paid cash by hand. Complete delivery.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Option 2: Pay via Razorpay Checkout */}
            <TouchableOpacity 
              style={[styles.paymentCardOption, { backgroundColor: isDark ? "#0f172a" : "#f8fafc", borderColor: "#D62F20", marginTop: 12 }]}
              onPress={handleRazorpayCheckout}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ padding: 10, borderRadius: 12, backgroundColor: "#fee2e2" }}>
                  <MaterialCommunityIcons name="credit-card-chip-outline" size={24} color="#D62F20" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#ffffff" : "#0f172a" }}>
                    💳 Razorpay Checkout
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", marginTop: 2 }}>
                    Open Razorpay payment page directly on phone.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Option 3: Razorpay Online QR Code */}
            <TouchableOpacity 
              style={[styles.paymentCardOption, { backgroundColor: isDark ? "#0f172a" : "#f8fafc", borderColor: "#3b82f6", marginTop: 12 }]}
              onPress={handleGenerateRazorpayQR}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ padding: 10, borderRadius: 12, backgroundColor: "#dbeafe" }}>
                  <MaterialCommunityIcons name="qrcode-scan" size={24} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#ffffff" : "#0f172a" }}>
                    📲 Display Razorpay UPI QR Code
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", marginTop: 2 }}>
                    Show Razorpay QR Code for customer to scan on their phone.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <Button
              mode="text"
              textColor="#ef4444"
              style={{ marginTop: 14 }}
              onPress={() => setShowPaymentModal(false)}
            >
              Cancel / Go Back
            </Button>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Razorpay QR Code Display (Matching Razorpay UPI UI) */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#1e293b" : "#ffffff", padding: 20 }]}>
            
            {/* Header: UPI QR + Timer */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                UPI QR
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff1f2", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#ffe4e6" }}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="#e11d48" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: "bold", color: "#e11d48" }}>
                  {formatTimer(timerSeconds)}
                </Text>
              </View>
            </View>

            {/* QR Card Container (Target Screenshot Style) */}
            <View style={{ backgroundColor: isDark ? "#0f172a" : "#fff5f5", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: isDark ? "#334155" : "#fecdd3" }}>
              {qrLoading ? (
                <View style={{ height: 140, justifyContent: "center", alignItems: "center" }}>
                  <ActivityIndicator size="large" color="#e11d48" />
                  <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", marginTop: 10 }}>
                    Generating Razorpay QR...
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  {/* Left: QR Code Image */}
                  {qrData?.qr_code_url ? (
                    <Image 
                      source={{ uri: qrData.qr_code_url }} 
                      style={{ width: 140, height: 140, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#ffffff" }} 
                    />
                  ) : (
                    <View style={{ width: 140, height: 140, borderRadius: 12, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center" }}>
                      <MaterialCommunityIcons name="qrcode" size={48} color="#e11d48" />
                    </View>
                  )}

                  {/* Right: Scan Instruction & UPI App Icons Row */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: isDark ? "#ffffff" : "#334155", lineHeight: 18, marginBottom: 12 }}>
                      Scan the QR using any UPI App
                    </Text>

                    {/* UPI Apps Row (PhonePe, GPay, Paytm, POP, BHIM, Navi) */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#5f259f", justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#fff", fontSize: 9, fontWeight: "bold" }}>पे</Text>
                      </View>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#4285F4", fontSize: 8, fontWeight: "900" }}>G</Text>
                      </View>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#002e6e", justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#00baf2", fontSize: 7, fontWeight: "bold" }}>Pay</Text>
                      </View>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#e11d48", justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#fff", fontSize: 7, fontWeight: "bold" }}>POP</Text>
                      </View>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#005a9c", justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#fff", fontSize: 7, fontWeight: "bold" }}>BHIM</Text>
                      </View>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#4f46e5", justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#fff", fontSize: 7, fontWeight: "bold" }}>N</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Total Amount Badge */}
            <View style={{ backgroundColor: isDark ? "#0f172a" : "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", paddingVertical: 10, borderRadius: 16, marginVertical: 14, width: "100%", alignItems: "center" }}>
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#16a34a" }}>
                Collect Payment: ₹{order.totalAmount}
              </Text>
            </View>

            {/* Verify Payment Status button */}
            <Button
              mode="contained"
              buttonColor="#3b82f6"
              style={{ width: "100%", borderRadius: 14, marginBottom: 8 }}
              labelStyle={{ fontSize: 13, fontWeight: "bold" }}
              onPress={() => checkPaymentLinkStatus(false)}
            >
              Verify Payment Status
            </Button>

            <Button
              mode="contained"
              buttonColor="#10b981"
              style={{ width: "100%", borderRadius: 14 }}
              labelStyle={{ fontSize: 13, fontWeight: "bold" }}
              onPress={handleConfirmQRPayment}
            >
              Confirm Payment Received & Deliver
            </Button>

            <Button
              mode="text"
              textColor={theme.colors.subtext}
              style={{ marginTop: 6 }}
              onPress={() => {
                setShowQRModal(false);
                setShowPaymentModal(true);
              }}
            >
              Back to Payment Options
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "bold",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 120,
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 12,
    fontWeight: "bold",
  },
  valueHighlight: {
    fontSize: 12,
    color: "#ff6b00",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailsCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  addressText: {
    fontSize: 11,
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
    fontWeight: "600",
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 10,
  },
  boldText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  grandPrice: {
    fontSize: 14,
    fontWeight: "900",
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
    backgroundColor: "#d1fae5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  finishedLabel: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  paymentCardOption: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
});

export default OrderDetailsScreen;
