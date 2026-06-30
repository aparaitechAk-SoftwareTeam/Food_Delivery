import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, Card, RadioButton, Divider } from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import AppButton from "../../components/AppButton";
import { placeOrder } from "../../redux/slices/ordersSlice";
import { clearCart } from "../../redux/slices/cartSlice";

const CheckoutScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { activeAddress, user } = useSelector((state) => state.auth);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

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
    if (items.length === 0) {
      Alert.alert("Error", "Your cart is empty.");
      return;
    }

    // Extract restaurant details
    const firstItem = items[0];
    const restaurantId = firstItem.restaurantId || firstItem.restaurant?._id || firstItem.restaurant?.id || "r-1";

    const backendItems = items.map((item) => ({
      food: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const deliveryCharge = 40;
    const tax = Math.round(totalAmount * 0.05);
    const grandTotal = totalAmount + deliveryCharge + tax;

    dispatch(
      placeOrder({
        restaurant: restaurantId,
        items: backendItems,
        address: activeAddr,
        paymentMethod,
        discount: 0,
        deliveryCharge,
        tax,
        totalAmount: grandTotal,
      })
    )
      .unwrap()
      .then((res) => {
        dispatch(clearCart());
        Alert.alert(
          "Success",
          "Your order has been placed successfully!",
          [
            {
              text: "Track Order",
              onPress: () => navigation.replace("OrderTracking", { orderId: res.id || res._id }),
            },
            {
              text: "Go to Home",
              onPress: () => navigation.replace("Main"),
            },
          ]
        );
      })
      .catch((err) => {
        const errorMsg = typeof err === "string" ? err : (err?.message || "Failed to place order.");
        Alert.alert("Error", errorMsg);
      });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text variant="headlineMedium" style={styles.title}>
        Checkout
      </Text>
      
      <Card style={styles.section}>
        <Card.Title title="Delivery Address" />
        <Card.Content>
          <Text style={styles.addressLabel}>{activeAddr.label}</Text>
          <Text style={styles.addressText}>{activeAddr.line1}</Text>
          {activeAddr.line2 ? <Text style={styles.addressText}>{activeAddr.line2}</Text> : null}
          <Text style={styles.addressText}>{`${activeAddr.city}, ${activeAddr.state} - ${activeAddr.postalCode}`}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Payment Method" />
        <Card.Content>
          <RadioButton.Group
            onValueChange={(value) => setPaymentMethod(value)}
            value={paymentMethod}
          >
            <RadioButton.Item
              label="Cash on Delivery"
              value="Cash on Delivery"
              color="#22C55E"
            />
            <RadioButton.Item 
              label="Credit / Debit Card" 
              value="Card" 
              color="#22C55E"
            />
          </RadioButton.Group>
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Title title="Order Summary" />
        <Card.Content>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.name} x{item.quantity}
              </Text>
              <Text style={styles.itemPrice}>₹{(item.quantity * item.price).toFixed(2)}</Text>
            </View>
          ))}
          <Divider style={styles.divider} />
          
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Subtotal</Text>
            <Text style={styles.feeValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Delivery Charge</Text>
            <Text style={styles.feeValue}>₹40.00</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Tax (5%)</Text>
            <Text style={styles.feeValue}>₹{(totalAmount * 0.05).toFixed(2)}</Text>
          </View>

          <Divider style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalPriceText}>
              ₹{(totalAmount + 40 + totalAmount * 0.05).toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <AppButton
        mode="contained"
        buttonColor="#22C55E"
        onPress={handlePlaceOrder}
        style={styles.placeOrderBtn}
      >
        Place Order
      </AppButton>
    </ScrollView>
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
    fontWeight: "bold",
    color: "#222",
  },
  section: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
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
    color: "#16A34A",
  },
  divider: {
    marginVertical: 12,
  },
  placeOrderBtn: {
    marginTop: 8,
    borderRadius: 10,
  },
});

export default CheckoutScreen;
