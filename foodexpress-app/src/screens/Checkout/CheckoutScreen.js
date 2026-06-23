import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card, RadioButton, Divider } from "react-native-paper";
import { useSelector, useDispatch } from "react-redux";
import AppButton from "../../components/AppButton";
import { placeOrder } from "../../redux/slices/ordersSlice";
import { clearCart } from "../../redux/slices/cartSlice";

const CheckoutScreen = () => {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

  const address = {
    label: "Home",
    line1: "123 Main Street",
    city: "Cityville",
    state: "State",
    postalCode: "12345",
    country: "India",
  };

  const handlePlaceOrder = () => {
    dispatch(placeOrder({ items, totalAmount, paymentMethod, address }))
      .unwrap()
      .then(() => dispatch(clearCart()));
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Checkout
      </Text>
      <Card style={styles.section}>
        <Card.Title title="Delivery Address" />
        <Card.Content>
          <Text>{address.label}</Text>
          <Text>{address.line1}</Text>
          <Text>{`${address.city}, ${address.state}`}</Text>
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
            />
            <RadioButton.Item label="Credit / Debit Card" value="Card" />
          </RadioButton.Group>
        </Card.Content>
      </Card>
      <Card style={styles.section}>
        <Card.Title title="Order Summary" />
        <Card.Content>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text>
                {item.name} x{item.quantity}
              </Text>
              <Text>₹{(item.quantity * item.price).toFixed(2)}</Text>
            </View>
          ))}
          <Divider style={styles.divider} />
          <View style={styles.itemRow}>
            <Text>Total</Text>
            <Text>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </Card.Content>
      </Card>
      <AppButton mode="contained" onPress={handlePlaceOrder}>
        Place Order
      </AppButton>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
});

export default CheckoutScreen;
