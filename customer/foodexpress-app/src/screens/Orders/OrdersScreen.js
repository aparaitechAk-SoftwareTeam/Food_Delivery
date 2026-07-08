import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { Text, Snackbar } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../redux/slices/ordersSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";

const OrdersScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { currentOrders, history, loading } = useSelector((state) => state.orders);
  
  const [activeTab, setActiveTab] = useState("active"); // 'active' or 'past'
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleOrderAgain = (order) => {
    if (!order.items || order.items.length === 0) return;
    
    order.items.forEach((item) => {
      dispatch(
        addToCart({
          id: item.food?._id || item.food?.id || item.food,
          name: item.food?.name || "Dish",
          price: item.price,
          quantity: item.quantity,
          restaurant: order.restaurant?.name || order.restaurant || "Restaurant",
          restaurantId: order.restaurant?._id || order.restaurant?.id || order.restaurant,
        })
      );
    });
    
    setSnackbarMsg("Items added to cart! Proceeding to cart...");
    setSnackbarVisible(true);
    setTimeout(() => {
      navigation.navigate("Cart");
    }, 1200);
  };

  const renderStatus = (status) => {
    let color = "#ff6b00";
    let icon = "clock-outline";
    if (status === "Delivered") {
      color = "#2e7d32";
      icon = "check-circle-outline";
    } else if (status === "Cancelled") {
      color = "#c62828";
      icon = "cancel";
    } else if (status === "Out For Delivery") {
      color = "#00838f";
      icon = "moped";
    } else if (status === "Preparing") {
      color = "#ef6c00";
      icon = "fire";
    }
    
    return (
      <View style={[styles.statusBadge, { borderColor: color }]}>
        <MaterialCommunityIcons name={icon} size={14} color={color} style={styles.statusIcon} />
        <Text style={[styles.statusText, { color }]}>{status}</Text>
      </View>
    );
  };

  const renderOrderCard = ({ item }) => {
    const totalQty = item.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
    const formattedDate = dayjs(item.createdAt).format("DD MMM YYYY, h:mm A");
    const restImage = item.restaurant?.image || "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=120&q=80";

    return (
      <CardPressable
        onPress={() => navigation.navigate("OrderDetails", { orderId: item.id || item._id })}
      >
        <View style={styles.cardHeader}>
          <Image source={{ uri: restImage }} style={styles.restaurantThumb} />
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {item.restaurant?.name || item.restaurant || "Restaurant"}
            </Text>
            <Text style={styles.orderDate}>{formattedDate}</Text>
          </View>
          {renderStatus(item.status)}
        </View>

        <DividerLine />

        <View style={styles.cardContent}>
          <Text style={styles.itemsSummary} numberOfLines={2}>
            {item.items?.map((i) => `${i.food?.name || "Dish"} (x${i.quantity})`).join(", ")}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalPrice}>₹{item.totalAmount?.toFixed(2)}</Text>
          </View>
        </View>

        <DividerLine />

        <View style={styles.cardFooter}>
          <Text style={styles.orderNumberText}>ID: #{item.orderNumber}</Text>
          
          <View style={styles.actionButtons}>
            {(item.status !== "Delivered" && item.status !== "Cancelled") ? (
              <TouchableOpacity
                style={[styles.btn, styles.primaryBtn]}
                onPress={() => navigation.navigate("OrderTracking", { orderId: item.id || item._id })}
              >
                <MaterialCommunityIcons name="map-marker-distance" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Track</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.btn, styles.secondaryBtn]}
                onPress={() => handleOrderAgain(item)}
              >
                <MaterialCommunityIcons name="sync" size={14} color="#ff6b00" />
                <Text style={styles.secondaryBtnText}>Order Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CardPressable>
    );
  };

  const dataList = activeTab === "active" ? currentOrders : history;

  return (
    <View style={styles.container}>
      {/* Tabs Header */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.activeTab]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.activeTabText]}>
            Active Orders ({currentOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.activeTab]}
          onPress={() => setActiveTab("past")}
        >
          <Text style={[styles.tabText, activeTab === "past" && styles.activeTabText]}>
            Past Orders ({history.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={dataList}
        keyExtractor={(item) => (item.id || item._id).toString()}
        refreshing={loading}
        onRefresh={() => dispatch(fetchOrders())}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="shopping-outline" size={48} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === "active" ? "No Active Orders" : "No Past Orders"}
            </Text>
            <Text style={styles.emptySubtitle}>
              Looks like you haven't placed any orders. Discover the best food near you!
            </Text>
            <TouchableOpacity
              style={styles.orderNowBtn}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.orderNowBtnText}>Order Now</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2500}
      >
        {snackbarMsg}
      </Snackbar>
    </View>
  );
};

// Internal components to keep layout clean and modular
const CardPressable = ({ children, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    {children}
  </TouchableOpacity>
);

const DividerLine = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  activeTab: {
    borderColor: "#ff6b00",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#ff6b00",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  restaurantThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  orderDate: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#f5f5f5",
  },
  cardContent: {
    padding: 14,
  },
  itemsSummary: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    color: "#777",
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
  },
  orderNumberText: {
    fontSize: 11,
    color: "#999",
    fontFamily: "monospace",
  },
  actionButtons: {
    flexDirection: "row",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  primaryBtn: {
    backgroundColor: "#ff6b00",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 4,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#ff6b00",
    backgroundColor: "#fff",
  },
  secondaryBtnText: {
    color: "#ff6b00",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    paddingHorizontal: 36,
    lineHeight: 20,
    marginBottom: 24,
  },
  orderNowBtn: {
    backgroundColor: "#ff6b00",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  orderNowBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default OrdersScreen;
