import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { Text, Card, TextInput, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../../utils/api";

const DeliveryHistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await api.get("/delivery/history");
      setHistory(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.log("Error loading delivery history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getFilteredHistory = () => {
    return history.filter((o) => {
      const orderNum = o.orderNumber || o._id.slice(-6).toUpperCase();
      const clientName = o.user?.name || "";
      const query = searchTerm.toLowerCase();
      return orderNum.toLowerCase().includes(query) || clientName.toLowerCase().includes(query);
    });
  };

  const filtered = getFilteredHistory();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Logs</Text>
      </View>

      {/* Search toolbar */}
      <View style={styles.searchSection}>
        <TextInput
          placeholder="Search order number or client..."
          mode="outlined"
          value={searchTerm}
          onChangeText={setSearchTerm}
          textColor="#FFFFFF"
          outlineColor="#2a3347"
          activeOutlineColor="#ff6b00"
          style={styles.input}
          left={<TextInput.Icon icon="magnify" color="#667085" />}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#ff6b00" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="history" size={48} color="#222a3a" style={{ marginBottom: 12 }} />
          <Text style={styles.empty}>No past delivery logs found.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card 
              style={styles.card}
              onPress={() => navigation.navigate("OrderDetails", { orderId: item._id })}
            >
              <Card.Content>
                <View style={styles.row}>
                  <Text style={styles.orderNo}>#{item.orderNumber || item._id.slice(-6).toUpperCase()}</Text>
                  <Text style={[styles.statusText, { color: item.status === "Delivered" ? "#10b981" : "#ef4444" }]}>
                    {item.status}
                  </Text>
                </View>
                
                <View style={styles.divider} />

                <Text style={styles.clientLabel}>Customer: <Text style={styles.clientVal}>{item.user?.name || "Guest"}</Text></Text>
                <Text style={styles.clientLabel} style={{ marginTop: 2 }}>Restaurant: <Text style={styles.clientVal}>{item.restaurant?.name || "Kitchen"}</Text></Text>
                
                <View style={[styles.row, { marginTop: 12 }]}>
                  <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  <Text style={styles.priceText}>Payout: ₹{item.deliveryCharge || 40}</Text>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  header: {
    backgroundColor: "#161b26",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#222a3a",
  },
  backBtn: {
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  searchSection: {
    padding: 16,
  },
  input: {
    backgroundColor: "transparent",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    color: "#475467",
    fontSize: 13,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#161b26",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222a3a",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNo: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#222a3a",
    marginVertical: 10,
  },
  clientLabel: {
    fontSize: 11,
    color: "#667085",
    fontWeight: "600",
  },
  clientVal: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 10,
    color: "#475467",
    fontWeight: "600",
  },
  priceText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#10b981",
  },
});

export default DeliveryHistoryScreen;
