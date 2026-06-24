import React from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import { Text, Card, IconButton, Divider } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../../redux/slices/cartSlice";
import AppButton from "../../components/AppButton";

const CartScreen = ({ navigation }) => {
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleIncrease = (item) =>
    dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }));
  const handleDecrease = (item) =>
    dispatch(
      updateQuantity({ id: item.id, quantity: Math.max(1, item.quantity - 1) }),
    );

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Your Cart
      </Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title
              title={item.name}
              subtitle={`₹${item.price}`}
              right={() => (
                <IconButton
                  icon="delete"
                  onPress={() => dispatch(removeFromCart(item.id))}
                />
              )}
            />
            <Card.Content>
              <View style={styles.quantityRow}>
                <IconButton
                  icon="minus"
                  size={20}
                  onPress={() => handleDecrease(item)}
                />
                <Text>{item.quantity}</Text>
                <IconButton
                  icon="plus"
                  size={20}
                  onPress={() => handleIncrease(item)}
                />
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Your cart is empty</Text>
        }
      />
      <Divider style={styles.divider} />
      <View style={styles.summary}>
        <Text variant="titleMedium">Total</Text>
        <Text variant="titleMedium">₹{totalAmount.toFixed(2)}</Text>
      </View>
      <AppButton
        mode="contained"
        buttonColor="#ff6b00"
        onPress={() => {
          if (items.length === 0) {
            Alert.alert("Cart Empty", "Please add some dishes to your cart first.");
            return;
          }
          if (!token) {
            navigation.navigate("Login", { redirectTo: "Checkout" });
          } else {
            navigation.navigate("Checkout");
          }
        }}
      >
        Proceed to Checkout
      </AppButton>
      <AppButton mode="outlined" style={{ borderColor: "#ff6b00", marginTop: 8 }} textColor="#ff6b00" onPress={() => dispatch(clearCart())}>
        Clear Cart
      </AppButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    marginBottom: 16,
    fontWeight: "bold",
  },
  card: {
    marginBottom: 12,
    backgroundColor: "#fcfcfc",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  divider: {
    marginVertical: 12,
  },
  empty: {
    textAlign: "center",
    marginTop: 32,
    color: "#666",
  },
});

export default CartScreen;
