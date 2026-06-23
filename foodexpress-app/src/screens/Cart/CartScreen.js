import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Card, IconButton, Divider } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import {
  removeFromCart,
  updateQuantity,
  clearCart,
} from "../../redux/slices/cartSlice";
import AppButton from "../../components/AppButton";

const CartScreen = () => {
  const { items, totalAmount } = useSelector((state) => state.cart);
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
      <AppButton mode="contained" onPress={() => {}}>
        Proceed to Checkout
      </AppButton>
      <AppButton mode="outlined" onPress={() => dispatch(clearCart())}>
        Clear Cart
      </AppButton>
    </View>
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
  card: {
    marginBottom: 12,
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
  },
});

export default CartScreen;
