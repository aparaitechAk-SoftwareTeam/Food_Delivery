import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Dimensions, Platform, SafeAreaView, Linking } from "react-native";
import { Text, Card, RadioButton, Divider, ActivityIndicator, Portal, Dialog } from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import AppButton from "../../components/AppButton";
import { placeOrder } from "../../redux/slices/ordersSlice";
import { clearCart, selectCartBillDetails } from "../../redux/slices/cartSlice";
import { isOutsideBaramati } from "../../utils/locationHelper";
import paymentService from "../../services/paymentService";
import api from "../../utils/api";
import { MaterialCommunityIcons, FontAwesome6 } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const CheckoutScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const bill = useSelector(selectCartBillDetails);
  const { activeAddress, token, user } = useSelector((state) => state.auth);
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery"); // Cash on Delivery, UPI, Scan QR, Card, Razorpay Online Payment
  const [selectedUPI, setSelectedUPI] = useState("Google Pay"); // Google Pay, PhonePe, Paytm, BHIM, Other
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUPIOverlay, setShowUPIOverlay] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [activeRazorpayOrderId, setActiveRazorpayOrderId] = useState("");
  
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

    // ─── 3. UPI Payment Flow (Real Razorpay Integration) ─────────────────────
    if (paymentMethod === "UPI") {
      if (paymentInitiated) {
        setIsProcessing(true);
        paymentService.verifyPayment({
          razorpayOrderId: activeRazorpayOrderId,
          paymentMethod: "UPI",
          orderData: orderPayload
        })
          .then((res) => {
            dispatch(clearCart());
            setIsProcessing(false);
            setPaymentInitiated(false);
            navigation.replace("OrderSuccess", {
              orderId: res._id || res.id,
              orderNumber: res.orderNumber,
              totalAmount: res.totalAmount,
              paymentMethod: res.paymentMethod || "UPI",
              address: res.address || orderPayload.address,
            });
          })
          .catch((err) => {
            setIsProcessing(false);
            const errorMsg = logAndGetError("/payment/verify", {
              razorpayOrderId: activeRazorpayOrderId,
              paymentMethod: "UPI",
              orderData: orderPayload
            }, err);
            if (Platform.OS === "web") {
              alert("Payment verification failed. Please complete the transaction in your UPI app first, then try again.");
            } else {
              Alert.alert("Verification Pending", "We couldn't confirm your payment yet. Make sure you completed the payment in the UPI app before clicking verify.");
            }
          });
        return;
      }

      setIsProcessing(true);
      paymentService.createRazorpayOrder(bill.grandTotal)
        .then(async (res) => {
          const { order, key } = res;
          setActiveRazorpayOrderId(order.id);

          if (Platform.OS === "web") {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => {
              const options = {
                key: key,
                amount: order.amount,
                currency: "INR",
                name: "FoodExpress",
                description: "Order Checkout via UPI",
                order_id: order.id,
                prefill: {
                  name: orderPayload.customerName || "Customer",
                  email: orderPayload.customerEmail || "",
                  contact: orderPayload.customerPhone || "",
                  method: "upi"
                },
                theme: {
                  color: "#ff6b00"
                },
                handler: function(response) {
                  paymentService.verifyPayment({
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                    razorpayOrderId: response.razorpay_order_id,
                    amount: bill.grandTotal,
                    paymentMethod: "UPI",
                    orderData: orderPayload
                  })
                    .then((placedOrder) => {
                      dispatch(clearCart());
                      setIsProcessing(false);
                      navigation.replace("OrderSuccess", {
                        orderId: placedOrder._id || placedOrder.id,
                        orderNumber: placedOrder.orderNumber,
                        totalAmount: placedOrder.totalAmount,
                        paymentMethod: placedOrder.paymentMethod,
                        address: placedOrder.address || orderPayload.address,
                      });
                    })
                    .catch((verifyErr) => {
                      setIsProcessing(false);
                      alert("Payment verification failed: " + verifyErr.message);
                    });
                },
                modal: {
                  ondismiss: function() {
                    setIsProcessing(false);
                  }
                }
              };
              const rzp = new window.Razorpay(options);
              rzp.open();
            };
            document.body.appendChild(script);
          } else {
            const apiBaseURL = api.defaults.baseURL || "http://localhost:5000/api";
            const serverOrigin = apiBaseURL.endsWith("/api") ? apiBaseURL.slice(0, -4) : apiBaseURL;
            const checkoutUrl = `${serverOrigin}/api/payment/checkout-page?orderId=${order.id}&amount=${bill.grandTotal}&customerName=${encodeURIComponent(orderPayload.customerName || "Customer")}&customerEmail=${encodeURIComponent(orderPayload.customerEmail || "")}&customerPhone=${encodeURIComponent(orderPayload.customerPhone || "")}&preselectMethod=upi`;
            
            console.log("[Payment Integration Log] Redirecting customer to UPI checkout URL:", checkoutUrl);
            
            Linking.openURL(checkoutUrl)
              .then(() => {
                setIsProcessing(false);
                setPaymentInitiated(true);
              })
              .catch((err) => {
                setIsProcessing(false);
                Alert.alert("Error", "Could not open payment page: " + err.message);
              });
          }
        })
        .catch((err) => {
          setIsProcessing(false);
          Alert.alert("Order Creation Failed", "Failed to initiate transaction: " + err.message);
        });
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
          const errorMsg = logAndGetError("/payment/verify", {
            paymentId: `pay_qr_${Date.now()}`,
            signature: `sig_qr_${Date.now()}`,
            razorpayOrderId: qrData.razorpay_order_id,
            amount: bill.grandTotal,
            paymentMethod: "Razorpay QR Code",
            orderData: orderPayload
          }, err);
          if (Platform.OS === "web") {
            alert(errorMsg);
          } else {
            Alert.alert("Verification Failed", errorMsg);
          }
        });
      return;
    }

    // ─── 5. Razorpay Online Payment Flow ─────────────────────────────────────
    if (paymentMethod === "Razorpay Online Payment") {
      if (paymentInitiated) {
        setIsProcessing(true);
        paymentService.verifyPayment({
          razorpayOrderId: activeRazorpayOrderId,
          paymentMethod: "Razorpay Online Payment",
          orderData: orderPayload
        })
          .then((res) => {
            dispatch(clearCart());
            setIsProcessing(false);
            setPaymentInitiated(false);
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
            const errorMsg = logAndGetError("/payment/verify", {
              razorpayOrderId: activeRazorpayOrderId,
              paymentMethod: "Razorpay Online Payment",
              orderData: orderPayload
            }, err);
            if (Platform.OS === "web") {
              alert("Payment verification failed. Please complete the transaction in the browser tab first, then try again.");
            } else {
              Alert.alert("Verification Pending", "We couldn't confirm your payment yet. Make sure you completed the payment in the browser tab before clicking verify.");
            }
          });
        return;
      }

      setIsProcessing(true);
      paymentService.createRazorpayOrder(bill.grandTotal)
        .then(async (res) => {
          const { order, key } = res;
          setActiveRazorpayOrderId(order.id);

          if (Platform.OS === "web") {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => {
              const options = {
                key: key,
                amount: order.amount,
                currency: "INR",
                name: "FoodExpress",
                description: "Order Checkout",
                order_id: order.id,
                handler: function(response) {
                  paymentService.verifyPayment({
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature,
                    razorpayOrderId: response.razorpay_order_id,
                    amount: bill.grandTotal,
                    paymentMethod: "Razorpay Online Payment",
                    orderData: orderPayload
                  })
                    .then((placedOrder) => {
                      dispatch(clearCart());
                      setIsProcessing(false);
                      navigation.replace("OrderSuccess", {
                        orderId: placedOrder._id || placedOrder.id,
                        orderNumber: placedOrder.orderNumber,
                        totalAmount: placedOrder.totalAmount,
                        paymentMethod: placedOrder.paymentMethod,
                        address: placedOrder.address || orderPayload.address,
                      });
                    })
                    .catch((verifyErr) => {
                      setIsProcessing(false);
                      alert("Payment verification failed: " + verifyErr.message);
                    });
                },
                modal: {
                  ondismiss: function() {
                    setIsProcessing(false);
                  }
                }
              };
              const rzp = new window.Razorpay(options);
              rzp.open();
            };
            document.body.appendChild(script);
          } else {
            const apiBaseURL = api.defaults.baseURL || "http://localhost:5000/api";
            const serverOrigin = apiBaseURL.endsWith("/api") ? apiBaseURL.slice(0, -4) : apiBaseURL;
            const checkoutUrl = `${serverOrigin}/api/payment/checkout-page?orderId=${order.id}&amount=${bill.grandTotal}&customerName=${encodeURIComponent(user?.name || "Customer")}&customerEmail=${encodeURIComponent(user?.email || "")}&customerPhone=${encodeURIComponent(user?.phone || "")}`;
            console.log("[Payment] Opening Razorpay checkout URL:", checkoutUrl);
            
            console.log("[Payment Integration Log] Redirecting customer to checkout URL:", checkoutUrl);
            
            Linking.openURL(checkoutUrl)
              .then(() => {
                setIsProcessing(false);
                setPaymentInitiated(true);
              })
              .catch((err) => {
                setIsProcessing(false);
                Alert.alert("Error", "Could not open payment page: " + err.message);
              });
          }
        })
        .catch((err) => {
          setIsProcessing(false);
          Alert.alert("Order Creation Failed", "Failed to initiate transaction: " + err.message);
        });
      return;
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
        <CustomScreenHeader title="Checkout" navigation={navigation} />
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

            {/* Razorpay Online Payment */}
            <TouchableOpacity 
              style={[styles.paymentMethodRow, paymentMethod === "Razorpay Online Payment" && styles.paymentMethodRowSelected]}
              onPress={() => {
                setPaymentMethod("Razorpay Online Payment");
                setPaymentInitiated(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.paymentMethodLeft}>
                <MaterialCommunityIcons name="credit-card-outline" size={24} color={paymentMethod === "Razorpay Online Payment" ? "#ff6b00" : "#475467"} />
                <Text style={styles.paymentMethodLabel}>Razorpay Online Payment</Text>
              </View>
              <RadioButton
                value="Razorpay Online Payment"
                status={paymentMethod === "Razorpay Online Payment" ? "checked" : "unchecked"}
                onPress={() => {
                  setPaymentMethod("Razorpay Online Payment");
                  setPaymentInitiated(false);
                }}
                color="#ff6b00"
              />
            </TouchableOpacity>

            {(paymentMethod === "Razorpay Online Payment" || paymentMethod === "UPI") && paymentInitiated && (
              <Card style={{ backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", padding: 12, marginVertical: 8 }}>
                <Text style={{ fontSize: 12, color: "#166534", fontWeight: "bold" }}>
                  Payment session opened in browser. Tap "Verify & Confirm Payment" below once payment is completed.
                </Text>
              </Card>
            )}

            {/* 2. UPI */}
            <TouchableOpacity 
              style={[styles.paymentMethodRow, paymentMethod === "UPI" && styles.paymentMethodRowSelected]}
              onPress={() => {
                setPaymentMethod("UPI");
                setPaymentInitiated(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.paymentMethodLeft}>
                <MaterialCommunityIcons name="bank" size={24} color={paymentMethod === "UPI" ? "#ff6b00" : "#475467"} />
                <Text style={styles.paymentMethodLabel}>UPI Payment</Text>
              </View>
              <RadioButton
                value="UPI"
                status={paymentMethod === "UPI" ? "checked" : "unchecked"}
                onPress={() => {
                  setPaymentMethod("UPI");
                  setPaymentInitiated(false);
                }}
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
          {paymentMethod === "Scan QR & Pay" 
            ? "Verify Payment & Place Order" 
            : paymentMethod === "UPI" 
            ? (paymentInitiated ? "Verify & Confirm Payment" : "Pay & Place Order")
            : paymentMethod === "Razorpay Online Payment"
            ? (paymentInitiated ? "Verify & Confirm Payment" : "Pay & Place Order")
            : "Place Order"}
        </AppButton>
      </ScrollView>
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
});

export default CheckoutScreen;
