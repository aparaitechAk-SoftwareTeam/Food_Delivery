import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Dimensions, Platform, SafeAreaView } from "react-native";
import { Text, Card, RadioButton, Divider, ActivityIndicator, Portal, Dialog } from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import AppButton from "../../components/AppButton";
import { placeOrder } from "../../redux/slices/ordersSlice";
import { clearCart, selectCartBillDetails, applyCoupon, removeCoupon } from "../../redux/slices/cartSlice";
import { isOutsideBaramati } from "../../utils/locationHelper";
import paymentService from "../../services/paymentService";
import api from "../../utils/api";
import { MaterialCommunityIcons, FontAwesome6 } from "@expo/vector-icons";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (Platform.OS !== "web") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  
  // Coupons States
  const [activeCoupons, setActiveCoupons] = useState([]);

  const fetchActiveCoupons = async () => {
    try {
      const { data } = await api.get("/coupons/my");
      setActiveCoupons(data.active || []);
    } catch (err) {
      console.log("Error loading active coupons:", err.message);
    }
  };

  useEffect(() => {
    fetchActiveCoupons();
  }, []);

  const handleApplyCouponPress = async (code) => {
    try {
      const { data } = await api.post("/coupons/validate", {
        code,
        orderAmount: bill.subtotal,
      });
      if (data.valid) {
        dispatch(applyCoupon(data.coupon));
        if (Platform.OS === "web") {
          alert(`Coupon ${code} applied successfully!`);
        } else {
          Alert.alert("Coupon Applied", `Coupon ${code} applied successfully!`);
        }
      }
    } catch (err) {
      const errMsg = err.message || "Failed to apply coupon";
      if (Platform.OS === "web") {
        alert(errMsg);
      } else {
        Alert.alert("Failed to Apply", errMsg);
      }
    }
  };

  const handleRemoveCouponPress = () => {
    dispatch(removeCoupon());
  };
  
  const logAndGetError = (endpoint, payload, err) => {
    const errorMsg = typeof err === "string" ? err : (err?.message || "Failed to place order");
    const responseData = err?.response?.data || null;
    const status = err?.response?.status || "Unknown Status";

    console.error("=== CHECKOUT TRANSACTION ERROR ===");
    console.error(`API Endpoint: POST ${endpoint}`);
    console.error("Request Payload:", JSON.stringify(payload, null, 2));
    console.error(`HTTP Status: ${status}`);
    console.error("Response / Backend Error:", JSON.stringify(responseData || err, null, 2));
    console.error("==================================");

    if (errorMsg.includes("Token is not valid") || errorMsg.includes("Not authorized") || status === 401) {
      setTimeout(() => {
        navigation.navigate("Login");
      }, 1000);
    }

    return errorMsg;
  };


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
      couponCode: bill.appliedCoupon?.code || undefined,
    };

    // ─── 1. Cash on Delivery (Existing Flow) ──────────────────────────────────
    if (paymentMethod === "Cash on Delivery") {
      setIsProcessing(true);
      console.log("[DEBUG] Dispatching placeOrder. Payload:", JSON.stringify({ ...orderPayload, paymentMethod: "Cash on Delivery" }, null, 2));
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
          const errorMsg = logAndGetError("/orders", { ...orderPayload, paymentMethod: "Cash on Delivery" }, err);
          if (Platform.OS === "web") {
            alert(errorMsg);
          } else {
            Alert.alert("Error", errorMsg);
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
          const errorMsg = logAndGetError("/payment/verify", {
            paymentId: `pay_card_${Date.now()}`,
            signature: `sig_card_${Date.now()}`,
            razorpayOrderId: `rzp_order_card_${Date.now()}`,
            amount: bill.grandTotal,
            paymentMethod: "Razorpay Card",
            orderData: orderPayload
          }, err);
          if (Platform.OS === "web") {
            alert(errorMsg);
          } else {
            Alert.alert("Payment Failed", errorMsg);
          }
        });
      return;
    }

    // ─── 3. UPI Intent Flow (Simulation Overlay) ──────────────────────────────
    if (paymentMethod === "UPI") {
      setShowUPIOverlay(true);
      return;
    }

    // ─── 4. Razorpay Online Payment Flow ──────────────────────────────────────
    if (paymentMethod === "Razorpay") {
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
        couponCode: bill.appliedCoupon?.code || undefined,
      };

      paymentService.generateQR(bill.grandTotal)
        .then(async (data) => {
          setQrCodeData(data);
          
          if (Platform.OS === "web") {
            const isMock = !data.razorpay_order_id || data.razorpay_order_id.startsWith("mock_");
            const scriptLoaded = await loadRazorpayScript();
            if (!isMock && scriptLoaded && window.Razorpay) {
              const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_live_SuiX1JeqCYs1KX";
              
              const options = {
                key: razorpayKey,
                amount: Math.round(bill.grandTotal * 100),
                currency: "INR",
                name: items[0]?.restaurantName || "FoodExpress Premium Kitchen",
                description: "Payment for Order",
                order_id: data.razorpay_order_id,
                handler: function (response) {
                  setIsProcessing(true);
                  paymentService.verifyPayment({
                    paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                    signature: response.razorpay_signature || `sig_${Date.now()}`,
                    razorpayOrderId: response.razorpay_order_id || data.razorpay_order_id,
                    amount: bill.grandTotal,
                    paymentMethod: "Razorpay Online Payment",
                    orderData: orderPayload
                  })
                    .then((res) => {
                      dispatch(clearCart());
                      setIsProcessing(false);
                      navigation.replace("OrderSuccess", {
                        orderId: res._id || res.id,
                        orderNumber: res.orderNumber,
                        totalAmount: res.totalAmount,
                        paymentMethod: res.paymentMethod || "Razorpay Online Payment",
                        address: res.address || orderPayload.address,
                      });
                    })
                    .catch((err) => {
                      setIsProcessing(false);
                      const errorMsg = err.response?.data?.message || err.message || "Payment verification failed.";
                      alert(errorMsg);
                    });
                },
                prefill: {
                  name: "",
                  email: "",
                  contact: "",
                },
                theme: {
                  color: "#ff6b00",
                },
                modal: {
                  ondismiss: () => {
                    setIsProcessing(false);
                  }
                }
              };
              
              const rzp = new window.Razorpay(options);
              rzp.on("payment.failed", function (response) {
                setIsProcessing(false);
                alert(response.error?.description || "Payment failed. Please try again.");
              });
              rzp.open();
              return;
            }
          }
          
          // Fallback to QR modal on Mobile
          setShowQRModal(true);
          setIsProcessing(false);
        })
        .catch((err) => {
          setIsProcessing(false);
          if (Platform.OS === "web") {
            alert(err.message || "Failed to load Razorpay Payment Gateway");
          } else {
            Alert.alert("Error", err.message || "Failed to load Razorpay Payment Gateway");
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
      couponCode: bill.appliedCoupon?.code || undefined,
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
        const errorMsg = logAndGetError("/payment/verify", {
          paymentId: `pay_upi_${Date.now()}`,
          signature: `sig_upi_${Date.now()}`,
          razorpayOrderId: `rzp_order_upi_${Date.now()}`,
          amount: bill.grandTotal,
          paymentMethod: `UPI - ${selectedUPI}`,
          orderData: orderPayload
        }, err);
        if (Platform.OS === "web") {
          alert(errorMsg);
        } else {
          Alert.alert("Payment Failed", errorMsg);
        }
      });
  };

  const handleVerifyQR = () => {
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
      couponCode: bill.appliedCoupon?.code || undefined,
    };

    paymentService.verifyPayment({
      paymentId: `pay_${Date.now()}`,
      signature: `sig_${Date.now()}`,
      razorpayOrderId: qrCodeData?.razorpay_order_id,
      amount: bill.grandTotal,
      paymentMethod: "Razorpay Online Payment",
      orderData: orderPayload
    })
      .then((res) => {
        setShowQRModal(false);
        dispatch(clearCart());
        setIsProcessing(false);
        navigation.replace("OrderSuccess", {
          orderId: res._id || res.id,
          orderNumber: res.orderNumber,
          totalAmount: res.totalAmount,
          paymentMethod: res.paymentMethod || "Razorpay Online Payment",
          address: res.address || orderPayload.address,
        });
      })
      .catch((err) => {
        setIsProcessing(false);
        const errorMsg = err.response?.data?.message || err.message || "Payment verification failed. Please ensure the payment is completed.";
        if (Platform.OS === "web") {
          alert(errorMsg);
        } else {
          Alert.alert("Verification Failed", errorMsg);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <CustomScreenHeader title="Checkout" navigation={navigation} showBack={false} />
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        
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

        {/* Applied Coupon / Promos Section */}
        <Card style={styles.section}>
          <Card.Title title="Apply Coupon / Promo Wallet" titleStyle={styles.sectionTitle} />
          <Card.Content>
            {bill.appliedCoupon ? (
              <View style={styles.appliedCouponContainer}>
                <View style={styles.appliedCouponLeft}>
                  <MaterialCommunityIcons name="ticket-percent" size={24} color="#039855" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.appliedCouponCode}>{bill.appliedCoupon.code}</Text>
                    <Text style={styles.appliedCouponValue}>₹{bill.discount} discount applied</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleRemoveCouponPress} style={styles.removeCouponBtn}>
                  <Text style={styles.removeCouponBtnText}>REMOVE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {activeCoupons.length === 0 ? (
                  <Text style={{ fontSize: 12, color: "#667085", fontStyle: "italic" }}>
                    No active coupons available in your wallet.
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.couponsScroll}>
                    {activeCoupons.map((coupon) => (
                      <TouchableOpacity 
                        key={coupon._id || coupon.code} 
                        style={styles.checkoutCouponCard}
                        onPress={() => handleApplyCouponPress(coupon.code)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="gift-outline" size={18} color="#FF6F61" />
                        <View style={{ marginLeft: 8, marginRight: 12 }}>
                          <Text style={styles.checkoutCouponCode}>{coupon.code}</Text>
                          <Text style={styles.checkoutCouponVal}>₹{coupon.value} OFF</Text>
                        </View>
                        <Text style={styles.applyLabel}>APPLY</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
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

            {/* 2. Razorpay Online Payment */}
            <TouchableOpacity 
              style={[styles.paymentMethodRow, paymentMethod === "Razorpay" && styles.paymentMethodRowSelected]}
              onPress={() => setPaymentMethod("Razorpay")}
              activeOpacity={0.7}
            >
              <View style={styles.paymentMethodLeft}>
                <MaterialCommunityIcons name="credit-card-outline" size={24} color={paymentMethod === "Razorpay" ? "#ff6b00" : "#475467"} />
                <Text style={styles.paymentMethodLabel}>Razorpay Online Payment</Text>
              </View>
              <RadioButton
                value="Razorpay"
                status={paymentMethod === "Razorpay" ? "checked" : "unchecked"}
                onPress={() => setPaymentMethod("Razorpay")}
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
          {paymentMethod === "UPI" ? `Pay via ${selectedUPI}` : "Place Order"}
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
            <Text style={styles.upiMerchant}>Pay to: {items[0]?.restaurantName || "FoodExpress Kitchen"}</Text>
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

      {/* Razorpay UPI QR Dialog */}
      <Portal>
        <Dialog visible={showQRModal} onDismiss={() => setShowQRModal(false)} style={styles.upiDialog}>
          <Dialog.Title style={styles.upiDialogTitle}>
            <MaterialCommunityIcons name="qrcode" size={24} color="#ff6b00" style={{ marginRight: 8 }} />
            Scan Razorpay UPI QR
          </Dialog.Title>
          <Dialog.Content style={{ alignItems: "center" }}>
            <Text style={[styles.upiMerchant, { textAlign: "center", marginBottom: 12 }]}>
              Pay to: {items[0]?.restaurantName || "FoodExpress Premium Kitchen"}
            </Text>
            
            {qrCodeData?.qr_code_url ? (
              <Image 
                source={{ uri: qrCodeData.qr_code_url }} 
                style={{ width: 220, height: 220, marginBottom: 14, alignSelf: "center", borderRadius: 12 }} 
                resizeMode="contain"
              />
            ) : (
              <ActivityIndicator color="#ff6b00" style={{ marginVertical: 20 }} />
            )}

            <View style={[styles.upiCardDetails, { width: "100%", paddingHorizontal: 16 }]}>
              <Text style={styles.upiAmountLabel}>Amount to Pay</Text>
              <Text style={styles.upiAmountVal}>₹{bill.grandTotal.toFixed(2)}</Text>
            </View>
            <Text style={[styles.upiSub, { textAlign: "center", marginTop: 8 }]}>
              Scan the QR using GPay, PhonePe, Paytm, or BHIM to pay.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.upiActions}>
            <AppButton mode="outlined" onPress={() => setShowQRModal(false)} style={styles.upiBtnCancel}>
              Cancel
            </AppButton>
            <AppButton 
              mode="contained" 
              buttonColor="#ff6b00" 
              loading={isProcessing}
              disabled={isProcessing}
              onPress={handleVerifyQR} 
              style={styles.upiBtnApprove}
            >
              Verify Payment
            </AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      </SafeAreaView>
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
  appliedCouponContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F2F9F5",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1FADF",
  },
  appliedCouponLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  appliedCouponCode: {
    fontSize: 14,
    fontWeight: "800",
    color: "#039855",
  },
  appliedCouponValue: {
    fontSize: 11,
    color: "#039855",
  },
  removeCouponBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removeCouponBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D92D20",
  },
  couponsScroll: {
    paddingVertical: 4,
  },
  checkoutCouponCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAECF0",
    marginRight: 10,
  },
  checkoutCouponCode: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D2939",
  },
  checkoutCouponVal: {
    fontSize: 10,
    color: "#667085",
  },
  applyLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF6F61",
  },
});

export default CheckoutScreen;
