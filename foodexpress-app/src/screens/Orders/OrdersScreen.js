import React, { useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Card, Chip } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../redux/slices/ordersSlice";

const OrdersScreen = () => {
  const dispatch = useDispatch();
  const { currentOrders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const renderStatus = (status) => {
    const color =
      status === "Delivered"
        ? "green"
        : status === "Cancelled"
          ? "red"
          : "#ff6b00";
    return (
      <Chip
        style={{ backgroundColor: "#fff", borderColor: color, borderWidth: 1 }}
      >
        {status}
      </Chip>
    );
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Current Orders
      </Text>
      <FlatList
        data={currentOrders}
        keyExtractor={(item) => (item._id || item.id).toString()}
        refreshing={loading}
        onRefresh={() => dispatch(fetchOrders())}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title
              title={`Order #${item.orderNumber}`}
              subtitle={item.items?.[0]?.food?.name || "Order"}
            />
            <Card.Content>
              <Text>Status: {item.status}</Text>
              <Text>Total: ₹{item.totalAmount?.toFixed(2) || "0.00"}</Text>
              {renderStatus(item.status)}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No current orders</Text>}
      />
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
  empty: {
    marginTop: 32,
    textAlign: "center",
  },
});

export default OrdersScreen;
