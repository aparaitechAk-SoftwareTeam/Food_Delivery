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
  const { activeAddress, token, user } = useSelector((state) => state.auth);
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery"); // Cash on Delivery, UPI, Scan QR, Card
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUPIOverlay, setShowUPIOverlay] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  
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

    console.warn("=== CHECKOUT TRANSACTION WARNING ===");
    console.warn(`API Endpoint: POST ${endpoint}`);
    console.warn("Request Payload:", JSON.stringify(payload, null, 2));
    console.warn(`HTTP Status: ${status}`);
    console.warn("Response / Backend Error:", JSON.stringify(responseData || err, null, 2));
    console.warn("==================================");

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

    // ─── 2. Pay Online (Official Razorpay Standard Checkout) ──────────────────
    handleRazorpayOnlineCheckout(paymentMethod);
  };

  const handleRazorpayOnlineCheckout = async (payMethodName) => {
    setIsProcessing(true);
    try {
      const rzpOrderData = await paymentService.createOrder(bill.grandTotal);
      
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
          amount: Math.round(bill.grandTotal * 100),
          currency: rzpOrderData.currency || "INR",
          name: "FoodExpress",
          description: "Food Delivery Payment",
          order_id: rzpOrderData.id,
          prefill: {
            name: user?.name || activeAddress?.name || "Customer",
            email: user?.email || "customer@foodexpress.com",
            contact: user?.phone || activeAddress?.phone || "9999999999",
          },
          theme: {
            color: "#D62F20",
          },
          handler: async (response) => {
            try {
              const verifiedOrder = await paymentService.verifyPayment({
                razorpayOrderId: rzpOrderData.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                amount: bill.grandTotal,
                paymentMethod: payMethodName || "Razorpay Online",
                orderData: orderPayload,
              });

              dispatch(clearCart());
              setIsProcessing(false);
              navigation.replace("OrderSuccess", {
                orderId: verifiedOrder._id || verifiedOrder.id,
                orderNumber: verifiedOrder.orderNumber,
                totalAmount: verifiedOrder.totalAmount,
                paymentMethod: verifiedOrder.paymentMethod || payMethodName,
                address: verifiedOrder.address || orderPayload.address,
              });
            } catch (vErr) {
              setIsProcessing(false);
              setFailureReason(vErr.message || "Payment verification failed.");
              setShowFailureModal(true);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setFailureReason("Payment checkout was cancelled or closed.");
              setShowFailureModal(true);
            },
          },
        };

        const rzpObj = new window.Razorpay(options);
        rzpObj.open();
      } else {
        const verifiedOrder = await paymentService.verifyPayment({
          paymentId: `pay_${Date.now()}`,
          signature: `sig_${Date.now()}`,
          razorpayOrderId: rzpOrderData.id,
          amount: bill.grandTotal,
          paymentMethod: payMethodName,
          orderData: orderPayload,
        });

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

      paymentService.createOrder(bill.grandTotal)
        .then(async (data) => {
          const orderId = data.order?.id;
          const isMock = !orderId || orderId.startsWith("mock_");

          // Formulate mock QR data locally if running in simulated mode
          const mockData = { ...data };
          if (isMock) {
            const upiUri = `upi://pay?pa=CloudKitchen@okaxis&pn=Krushna's%20Restaurant&tr=${orderId}&am=${bill.grandTotal}&cu=INR&tn=Order%20${orderId}`;
            mockData.qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;
            mockData.razorpay_order_id = orderId;
          }
          setQrCodeData(mockData);
          
          if (Platform.OS === "web") {
            const scriptLoaded = await loadRazorpayScript();
            if (!isMock && scriptLoaded && window.Razorpay) {
              const razorpayKey = data.key || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_live_SuiX1JeqCYs1KX";
              
              const options = {
                key: razorpayKey,
                amount: data.order?.amount || Math.round(bill.grandTotal * 100),
                currency: data.order?.currency || "INR",
                name: items[0]?.restaurantName || "FoodExpress Premium Kitchen",
                description: "Payment for Order",
                order_id: orderId,
                handler: function (response) {
                  setIsProcessing(true);
                  paymentService.verifyPayment({
                    razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                    razorpay_signature: response.razorpay_signature || `sig_${Date.now()}`,
                    razorpay_order_id: response.razorpay_order_id || orderId,
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
    } catch (err) {
      setIsProcessing(false);
      const msg = err.message || "Failed to initiate Razorpay online payment.";
      setFailureReason(msg);
      setShowFailureModal(true);
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
      razorpay_payment_id: `pay_upi_${Date.now()}`,
      razorpay_signature: `sig_upi_${Date.now()}`,
      razorpay_order_id: `mock_order_upi_${Date.now()}`,
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
          razorpay_payment_id: `pay_upi_${Date.now()}`,
          razorpay_signature: `sig_upi_${Date.now()}`,
          razorpay_order_id: `mock_order_upi_${Date.now()}`,
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
      razorpay_payment_id: `pay_${Date.now()}`,
      razorpay_signature: `sig_${Date.now()}`,
      razorpay_order_id: qrCodeData?.razorpay_order_id,
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
        <CustomScreenHeader title="Checkout" navigation={navigation} showBack={true} />
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
              <Text style={styles.feeLabel}>GST ({bill.gstPercentage || 5}%)</Text>
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
          {paymentMethod === "Cash on Delivery" ? "Place Order (COD)" : `Pay Online ₹${bill.grandTotal.toFixed(2)}`}
        </AppButton>
      </ScrollView>

      <Portal>
        {/* Payment Failure / Retry Dialog */}
        <Dialog visible={showFailureModal} onDismiss={() => setShowFailureModal(false)} style={styles.upiDialog}>
          <Dialog.Title style={[styles.upiTitle, { color: "#d92d20", textAlign: "center" }]}>
            Payment Unsuccessful
          </Dialog.Title>
          <Dialog.Content style={{ alignItems: "center", paddingVertical: 12 }}>
            <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#d92d20" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 13, color: "#475467", textAlign: "center", marginBottom: 8, fontWeight: "600" }}>
              {failureReason || "Your transaction was cancelled or could not be completed."}
            </Text>
            <Text style={{ fontSize: 11, color: "#667085", textAlign: "center" }}>
              No money was deducted. You can retry payment, switch to Cash on Delivery, or cancel.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ flexDirection: "column", gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
            <AppButton 
              mode="contained" 
              buttonColor="#D62F20" 
              onPress={() => {
                setShowFailureModal(false);
                handleRazorpayOnlineCheckout(paymentMethod);
              }}
              style={{ width: "100%" }}
            >
              Retry Payment
            </AppButton>
            <AppButton 
              mode="outlined" 
              onPress={() => {
                setShowFailureModal(false);
                setPaymentMethod("Cash on Delivery");
              }}
              style={{ width: "100%", borderColor: "#d0d5dd" }}
            >
              Change to Cash on Delivery
            </AppButton>
            <TouchableOpacity onPress={() => setShowFailureModal(false)} style={{ paddingTop: 6 }}>
              <Text style={{ color: "#667085", fontSize: 12, fontWeight: "600" }}>Cancel Order</Text>
            </TouchableOpacity>
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
    flex: 1,
    marginRight: 8,
  },
  paymentMethodLabel: {
    marginLeft: 12,
    fontSize: 13,
    fontWeight: "600",
    color: "#344054",
    flexShrink: 1,
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
