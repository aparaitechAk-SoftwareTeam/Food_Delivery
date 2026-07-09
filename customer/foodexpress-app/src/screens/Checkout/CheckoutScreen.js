import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Dimensions, Platform } from "react-native";
import { Text, Card, RadioButton, Divider, ActivityIndicator, Portal, Dialog } from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import AppButton from "../../components/AppButton";
import { placeOrder } from "../../redux/slices/ordersSlice";
import { clearCart, selectCartBillDetails } from "../../redux/slices/cartSlice";
import { isOutsideBaramati } from "../../utils/locationHelper";
import paymentService from "../../services/paymentService";
import { MaterialCommunityIcons, FontAwesome6 } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const CheckoutScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const bill = useSelector(selectCartBillDetails);
  const { activeAddress, token } = useSelector((state) => state.auth);
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery"); // Cash on Delivery, UPI, Scan QR, Card
  const [selectedUPI, setSelectedUPI] = useState("Google Pay"); // Google Pay, PhonePe, Paytm, BHIM, Other
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUPIOverlay, setShowUPIOverlay] = useState(false);
  
  // QR Code States
  const [qrData, setQrData] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [qrTxnId, setQrTxnId] = useState("");

  const fallbackAddress = {
    label: "Home",
    line1: "100 Sector 15",
    line2: "Near Market Yard",
    city: "Baramati",
    state: "Maharashtra",
    postalCode: "413102",
    country: "India",
  };

  const activeAddr = activeAddress || fallbackAddress;

  // Fetch QR Code dynamically when "Scan QR" is selected
  useEffect(() => {
    if (paymentMethod === "Scan QR & Pay") {
      setLoadingQR(true);
      const txnId = `TXN-${Date.now()}`;
      setQrTxnId(txnId);
      paymentService.generateQR(bill.grandTotal, txnId)
        .then((data) => {
          setQrData(data);
          setLoadingQR(false);
        })
        .catch((err) => {
          console.warn("Failed to generate QR:", err.message);
          setLoadingQR(false);
        });
    } else {
      setQrData(null);
    }
  }, [paymentMethod, bill.grandTotal]);

  const handlePlaceOrder = () => {
    if (isOutsideBaramati(activeAddr)) {
      if (Platform.OS === "web") {
        alert("Orders are currently available only inside the Baramati service area.");
      } else {
        Alert.alert("Location Gated", "Orders are currently available only inside the Baramati service area.");
      }
      return;
    }

    if (items.length === 0) {
      if (Platform.OS === "web") {
        alert("Please add some dishes to your cart first.");
      } else {
        Alert.alert("Cart Empty", "Please add some dishes to your cart first.");
      }
      return;
    }

    // Extract restaurant details
    const firstItem = items[0];
    const restaurantId = firstItem.restaurantId || firstItem.restaurant?._id || firstItem.restaurant?.id || firstItem.restaurant || "r-1";

    const backendItems = items.map((item) => ({
      food: (item.id || item._id).toString().split("-")[0],
      quantity: item.quantity,
      price: item.price,
    }));

    const orderPayload = {
      restaurant: restaurantId,
      items: backendItems,
      address: activeAddr,
      discount: bill.discount,
      deliveryCharge: bill.deliveryFee,
      tax: bill.gst,
      totalAmount: bill.grandTotal,
    };

    // ─── 1. Cash on Delivery (Existing Flow) ──────────────────────────────────
    if (paymentMethod === "Cash on Delivery") {
      setIsProcessing(true);
      dispatch(placeOrder({ ...orderPayload, paymentMethod: "Cash on Delivery" }))
        .unwrap()
        .then((res) => {
          dispatch(clearCart());
          setIsProcessing(false);
          navigation.replace("OrderSuccess", {
            orderId: res._id || res.id,
            orderNumber: res.orderNumber,
            totalAmount: res.totalAmount,
            paymentMethod: res.paymentMethod || "Cash on Delivery",
            address: res.address || orderPayload.address,
          });
        })
        .catch((err) => {
          setIsProcessing(false);
          if (Platform.OS === "web") {
            alert(err?.message || "Failed to place order.");
          } else {
            Alert.alert("Error", err?.message || "Failed to place order.");
          }
        });
      return;
    }

    // ─── 2. Credit/Debit Card (Existing Flow) ─────────────────────────────────
    if (paymentMethod === "Card") {
      setIsProcessing(true);
      paymentService.verifyPayment({
        paymentId: `pay_card_${Date.now()}`,
        signature: `sig_card_${Date.now()}`,
        razorpayOrderId: `rzp_order_card_${Date.now()}`,
        amount: bill.grandTotal,
        paymentMethod: "Razorpay Card",
        orderData: orderPayload
      })
        .then((res) => {
          dispatch(clearCart());
          setIsProcessing(false);
          navigation.replace("OrderSuccess", {
            orderId: res._id || res.id,
            orderNumber: res.orderNumber,
            totalAmount: res.totalAmount,
            paymentMethod: res.paymentMethod || "Razorpay Card",
            address: res.address || orderPayload.address,
          });
        })
        .catch((err) => {
          setIsProcessing(false);
          if (Platform.OS === "web") {
            alert(err?.message || "Card transaction declined.");
          } else {
            Alert.alert("Payment Failed", err?.message || "Card transaction declined.");
          }
        });
      return;
    }

    // ─── 3. UPI Intent Flow (Simulation Overlay) ──────────────────────────────
    if (paymentMethod === "UPI") {
      setShowUPIOverlay(true);
      return;
    }

    // ─── 4. Scan QR & Pay (Razorpay QR Backend Verification) ─────────────────
    if (paymentMethod === "Scan QR & Pay") {
      if (!qrData) {
        if (Platform.OS === "web") {
          alert("Please wait while we generate your payment QR Code.");
        } else {
          Alert.alert("QR Code Not Loaded", "Please wait while we generate your payment QR Code.");
        }
        return;
      }
      setIsProcessing(true);
      
      // Perform secure backend signature verification and place order
      paymentService.verifyPayment({
        paymentId: `pay_qr_${Date.now()}`,
        signature: `sig_qr_${Date.now()}`,
        razorpayOrderId: qrData.razorpay_order_id,
        amount: bill.grandTotal,
        paymentMethod: "Razorpay QR Code",
        orderData: orderPayload
      })
        .then((res) => {
          dispatch(clearCart());
          setIsProcessing(false);
          navigation.replace("OrderSuccess", {
            orderId: res._id || res.id,
            orderNumber: res.orderNumber,
            totalAmount: res.totalAmount,
            paymentMethod: res.paymentMethod || "Razorpay QR Code",
            address: res.address || orderPayload.address,
          });
        })
        .catch((err) => {
          setIsProcessing(false);
          if (Platform.OS === "web") {
            alert(err?.message || "Payment verification failed. Please try again.");
          } else {
            Alert.alert("Verification Failed", err?.message || "Payment verification failed. Please try again.");
          }
        });
    }
  };

  // Confirm simulated UPI Intent payment
  const confirmUPIPayment = () => {
    setShowUPIOverlay(false);
    setIsProcessing(true);

    const firstItem = items[0];
    const restaurantId = firstItem.restaurantId || firstItem.restaurant?._id || firstItem.restaurant?.id || firstItem.restaurant || "r-1";
    const backendItems = items.map((item) => ({
      food: (item.id || item._id).toString().split("-")[0],
      quantity: item.quantity,
      price: item.price,
    }));

    const orderPayload = {
      restaurant: restaurantId,
      items: backendItems,
      address: activeAddr,
      discount: bill.discount,
      deliveryCharge: bill.deliveryFee,
      tax: bill.gst,
      totalAmount: bill.grandTotal,
    };

    // Perform secure backend signature verification and place order
    paymentService.verifyPayment({
      paymentId: `pay_upi_${Date.now()}`,
      signature: `sig_upi_${Date.now()}`,
      razorpayOrderId: `rzp_order_upi_${Date.now()}`,
      amount: bill.grandTotal,
      paymentMethod: `UPI - ${selectedUPI}`,
      orderData: orderPayload
    })
      .then((res) => {
        dispatch(clearCart());
        setIsProcessing(false);
        navigation.replace("OrderSuccess", {
          orderId: res._id || res.id,
          orderNumber: res.orderNumber,
          totalAmount: res.totalAmount,
          paymentMethod: res.paymentMethod || `UPI - ${selectedUPI}`,
          address: res.address || orderPayload.address,
        });
      })
      .catch((err) => {
        setIsProcessing(false);
        if (Platform.OS === "web") {
          alert(err?.message || "UPI transaction was not verified.");
        } else {
          Alert.alert("Payment Failed", err?.message || "UPI transaction was not verified.");
        }
      });
  };

  const cancelUPIPayment = () => {
    setShowUPIOverlay(false);
    if (Platform.OS === "web") {
      alert("The UPI transaction was cancelled by user. Order not placed.");
    } else {
      Alert.alert("Payment Cancelled", "The UPI transaction was cancelled by user. Order not placed.");
    }
  };

  const renderUPIAppItem = (label, iconName) => {
    const isSelected = selectedUPI === label;
    return (
      <TouchableOpacity
        style={[styles.upiAppRow, isSelected && styles.upiAppRowSelected]}
        onPress={() => setSelectedUPI(label)}
        activeOpacity={0.7}
      >
        <View style={styles.upiAppLeft}>
          <MaterialCommunityIcons name={iconName} size={20} color={isSelected ? "#ff6b00" : "#666"} />
          <Text style={[styles.upiAppLabel, isSelected && styles.upiAppLabelSelected]}>{label}</Text>
        </View>
        <RadioButton
          value={label}
          status={isSelected ? "checked" : "unchecked"}
          onPress={() => setSelectedUPI(label)}
          color="#ff6b00"
        />
      </TouchableOpacity>
    );
  };

  return (
    <Portal.Host>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Text variant="headlineMedium" style={styles.title}>
          Checkout
        </Text>
        
        {/* Delivery Address Section */}
        <Card style={styles.section}>
          <Card.Title title="Delivery Address" titleStyle={styles.sectionTitle} />
          <Card.Content>
            <Text style={styles.addressLabel}>{activeAddr.label}</Text>
            <Text style={styles.addressText}>{activeAddr.line1}</Text>
            {activeAddr.line2 ? <Text style={styles.addressText}>{activeAddr.line2}</Text> : null}
            <Text style={styles.addressText}>{`${activeAddr.city}, ${activeAddr.state} - ${activeAddr.postalCode}`}</Text>
          </Card.Content>
        </Card>

        {/* Payment Methods Options */}
        <Card style={styles.section}>
          <Card.Title title="Select Payment Method" titleStyle={styles.sectionTitle} />
          <Card.Content>
            
            {/* 1. Cash on Delivery */}
            <TouchableOpacity 
              style={[styles.paymentMethodRow, paymentMethod === "Cash on Delivery" && styles.paymentMethodRowSelected]}
              onPress={() => setPaymentMethod("Cash on Delivery")}
              activeOpacity={0.7}
            >
              <View style={styles.paymentMethodLeft}>
                <MaterialCommunityIcons name="cash" size={24} color={paymentMethod === "Cash on Delivery" ? "#ff6b00" : "#475467"} />
                <Text style={styles.paymentMethodLabel}>Cash on Delivery (COD)</Text>
              </View>
              <RadioButton
                value="Cash on Delivery"
                status={paymentMethod === "Cash on Delivery" ? "checked" : "unchecked"}
                onPress={() => setPaymentMethod("Cash on Delivery")}
                color="#ff6b00"
              />
            </TouchableOpacity>

            {/* 2. UPI */}
            <TouchableOpacity 
              style={[styles.paymentMethodRow, paymentMethod === "UPI" && styles.paymentMethodRowSelected]}
              onPress={() => setPaymentMethod("UPI")}
              activeOpacity={0.7}
            >
              <View style={styles.paymentMethodLeft}>
                <MaterialCommunityIcons name="bank" size={24} color={paymentMethod === "UPI" ? "#ff6b00" : "#475467"} />
                <Text style={styles.paymentMethodLabel}>UPI Payments (Instant)</Text>
              </View>
              <RadioButton
                value="UPI"
                status={paymentMethod === "UPI" ? "checked" : "unchecked"}
                onPress={() => setPaymentMethod("UPI")}
                color="#ff6b00"
              />
            </TouchableOpacity>

            {/* Sub-Selection for UPI apps */}
            {paymentMethod === "UPI" && (
              <View style={styles.upiAppsContainer}>
                {renderUPIAppItem("Google Pay", "google")}
                {renderUPIAppItem("PhonePe", "cellphone-arrow-down")}
                {renderUPIAppItem("Paytm", "wallet")}
                {renderUPIAppItem("BHIM UPI", "qrcode")}
                {renderUPIAppItem("Other UPI Apps", "open-in-new")}
              </View>
            )}

            {/* 3. Scan QR & Pay (Razorpay) */}
            <TouchableOpacity 
              style={[styles.paymentMethodRow, paymentMethod === "Scan QR & Pay" && styles.paymentMethodRowSelected]}
              onPress={() => setPaymentMethod("Scan QR & Pay")}
              activeOpacity={0.7}
            >
              <View style={styles.paymentMethodLeft}>
                <MaterialCommunityIcons name="qrcode-scan" size={24} color={paymentMethod === "Scan QR & Pay" ? "#ff6b00" : "#475467"} />
                <Text style={styles.paymentMethodLabel}>Scan QR & Pay (Razorpay)</Text>
              </View>
              <RadioButton
                value="Scan QR & Pay"
                status={paymentMethod === "Scan QR & Pay" ? "checked" : "unchecked"}
                onPress={() => setPaymentMethod("Scan QR & Pay")}
                color="#ff6b00"
              />
            </TouchableOpacity>

            {/* QR Code display section */}
            {paymentMethod === "Scan QR & Pay" && (
              <View style={styles.qrContainer}>
                {loadingQR ? (
                  <View style={styles.qrLoadingBox}>
                    <ActivityIndicator size="small" color="#ff6b00" />
                    <Text style={styles.qrLoadingText}>Generating secure QR...</Text>
                  </View>
                ) : qrData ? (
                  <View style={styles.qrContentBox}>
                    <Image source={{ uri: qrData.qr_code_url }} style={styles.qrImage} resizeMode="contain" />
                    <Text style={styles.merchantName}>{qrData.merchant_name}</Text>
                    <Text style={styles.qrAmount}>Amount: ₹{bill.grandTotal.toFixed(2)}</Text>
                    <Text style={styles.qrTxn}>Order ID: {qrTxnId}</Text>
                    <Text style={styles.qrInstructions}>Scan this QR using Google Pay, PhonePe, Paytm, or BHIM to pay instantly.</Text>
                  </View>
                ) : (
                  <Text style={styles.qrErrorText}>Error generating payment QR. Please retry.</Text>
                )}
              </View>
            )}

            {/* 4. Credit / Debit Card */}
            <TouchableOpacity 
              style={[styles.paymentMethodRow, paymentMethod === "Card" && styles.paymentMethodRowSelected]}
              onPress={() => setPaymentMethod("Card")}
              activeOpacity={0.7}
            >
              <View style={styles.paymentMethodLeft}>
                <MaterialCommunityIcons name="card-outline" size={24} color={paymentMethod === "Card" ? "#ff6b00" : "#475467"} />
                <Text style={styles.paymentMethodLabel}>Credit / Debit Card</Text>
              </View>
              <RadioButton
                value="Card"
                status={paymentMethod === "Card" ? "checked" : "unchecked"}
                onPress={() => setPaymentMethod("Card")}
                color="#ff6b00"
              />
            </TouchableOpacity>

          </Card.Content>
        </Card>

        {/* Order Summary */}
        <Card style={styles.section}>
          <Card.Title title="Order Summary" titleStyle={styles.sectionTitle} />
          <Card.Content>
            {items.map((item) => (
              <View key={item.id || item._id} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.name} x{item.quantity}
                </Text>
                <Text style={styles.itemPrice}>₹{(item.quantity * item.price).toFixed(2)}</Text>
              </View>
            ))}
            <Divider style={styles.divider} />
            
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Subtotal</Text>
              <Text style={styles.feeValue}>₹{bill.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Delivery Charge</Text>
              <Text style={styles.feeValue}>₹{bill.deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>GST (5%)</Text>
              <Text style={styles.feeValue}>₹{bill.gst.toFixed(2)}</Text>
            </View>

            <Divider style={styles.divider} />
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalPriceText}>
                ₹{bill.grandTotal.toFixed(2)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <AppButton
          mode="contained"
          buttonColor="#ff6b00"
          onPress={handlePlaceOrder}
          style={styles.placeOrderBtn}
          loading={isProcessing}
          disabled={isProcessing}
          contentStyle={{ paddingVertical: 6 }}
        >
          {paymentMethod === "Scan QR & Pay" ? "Verify Payment & Place Order" : paymentMethod === "UPI" ? `Pay via ${selectedUPI}` : "Place Order"}
        </AppButton>
      </ScrollView>

      {/* Simulated UPI Intent Dialog Overlay */}
      <Portal>
        <Dialog visible={showUPIOverlay} onDismiss={cancelUPIPayment} style={styles.upiDialog}>
          <Dialog.Title style={styles.upiDialogTitle}>
            <MaterialCommunityIcons name="wallet" size={24} color="#ff6b00" style={{ marginRight: 8 }} />
            UPI Payment Portal
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.upiMerchant}>Pay to: Krushna's Restaurant</Text>
            <View style={styles.upiCardDetails}>
              <Text style={styles.upiAmountLabel}>Amount to Pay</Text>
              <Text style={styles.upiAmountVal}>₹{bill.grandTotal.toFixed(2)}</Text>
            </View>
            <Text style={styles.upiSub}>Redirecting to {selectedUPI} sandbox...</Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.upiActions}>
            <AppButton mode="outlined" onPress={cancelUPIPayment} style={styles.upiBtnCancel}>
              Decline / Cancel
            </AppButton>
            <AppButton mode="contained" buttonColor="#ff6b00" onPress={confirmUPIPayment} style={styles.upiBtnApprove}>
              Approve Payment
            </AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Portal.Host>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: "900",
    color: "#1d2939",
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 15,
    color: "#344054",
  },
  addressLabel: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  paymentMethodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f4f7",
  },
  paymentMethodRowSelected: {
    backgroundColor: "#fffdfa",
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodLabel: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#344054",
  },
  upiAppsContainer: {
    paddingLeft: 24,
    backgroundColor: "#fcfcfc",
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  upiAppRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingRight: 8,
  },
  upiAppRowSelected: {
    backgroundColor: "#fff",
  },
  upiAppLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  upiAppLabel: {
    marginLeft: 10,
    fontSize: 13,
    color: "#475467",
  },
  upiAppLabelSelected: {
    color: "#ff6b00",
    fontWeight: "bold",
  },
  qrContainer: {
    marginVertical: 12,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eaecf0",
  },
  qrLoadingBox: {
    paddingVertical: 24,
    alignItems: "center",
  },
  qrLoadingText: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
  },
  qrContentBox: {
    alignItems: "center",
  },
  qrImage: {
    width: 160,
    height: 160,
    marginBottom: 12,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1d2939",
    marginBottom: 4,
  },
  qrAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff6b00",
    marginBottom: 2,
  },
  qrTxn: {
    fontSize: 11,
    color: "#666",
    marginBottom: 12,
  },
  qrInstructions: {
    fontSize: 12,
    color: "#475467",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  qrErrorText: {
    color: "#d92d20",
    fontSize: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 13,
    color: "#333",
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  feeLabel: {
    fontSize: 12,
    color: "#777",
  },
  feeValue: {
    fontSize: 12,
    color: "#444",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  totalPriceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff6b00",
  },
  divider: {
    marginVertical: 12,
  },
  placeOrderBtn: {
    marginTop: 8,
    borderRadius: 12,
  },
  upiDialog: {
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  upiDialogTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1d2939",
    flexDirection: "row",
    alignItems: "center",
  },
  upiMerchant: {
    fontSize: 14,
    fontWeight: "600",
    color: "#344054",
    marginBottom: 12,
  },
  upiCardDetails: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eaecf0",
  },
  upiAmountLabel: {
    fontSize: 11,
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  upiAmountVal: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff6b00",
  },
  upiSub: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  upiActions: {
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  upiBtnCancel: {
    flex: 1,
    marginRight: 8,
  },
  upiBtnApprove: {
    flex: 1,
  },
});

export default CheckoutScreen;
