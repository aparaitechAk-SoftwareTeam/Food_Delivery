import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList, Linking } from "react-native";
import { Text, Card, TextInput, ActivityIndicator, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../../utils/api";
import { useThemeContext } from "../../utils/ThemeContext";

const DeliveryHistoryScreen = ({ navigation }) => {
  const { isDark, theme } = useThemeContext();
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    cashCollected: 0,
    onlineEarnings: 0,
    completedCount: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL, COD, ONLINE, COMPLETED
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await api.get("/delivery/history");
      if (Array.isArray(response.data)) {
        setHistory(response.data);
        // Calculate local summary fallback
        let total = 0;
        let cash = 0;
        let online = 0;
        let count = 0;
        response.data.forEach((o) => {
          if (["Delivered", "Completed"].includes(o.status)) {
            count += 1;
            total += o.deliveryCharge || 40;
            const isCOD = !o.paymentMethod || o.paymentMethod.toLowerCase().includes("cash") || o.paymentMethod.toUpperCase() === "COD";
            if (isCOD) cash += o.totalAmount || 0;
            else online += o.totalAmount || 0;
          }
        });
        setSummary({
          totalEarnings: total,
          cashCollected: cash,
          onlineEarnings: online,
          completedCount: count,
          totalOrders: response.data.length,
        });
      } else if (response.data && response.data.orders) {
        setHistory(response.data.orders);
        if (response.data.summary) {
          setSummary(response.data.summary);
        }
      }
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
      const orderNum = o.orderNumber || o._id?.slice(-6).toUpperCase() || "";
      const clientName = o.user?.name || o.customerName || "";
      const query = searchTerm.toLowerCase();
      const matchesSearch = orderNum.toLowerCase().includes(query) || clientName.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      const isCOD = !o.paymentMethod || o.paymentMethod.toLowerCase().includes("cash") || o.paymentMethod.toUpperCase() === "COD";
      if (activeFilter === "COD") return isCOD;
      if (activeFilter === "ONLINE") return !isCOD;
      if (activeFilter === "COMPLETED") return ["Delivered", "Completed"].includes(o.status);

      return true;
    });
  };

  const filtered = getFilteredHistory();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBg, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Delivery & Earnings Record</Text>
      </View>

      {/* Summary Cards Grid */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: "#10b981" }]}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color="#10b981" />
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{summary.totalEarnings || 0}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.subtext }]}>Total Earnings</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="wallet-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{summary.cashCollected || 0}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.subtext }]}>COD Cash to Deposit</Text>
          </View>
        </View>

        <View style={[styles.summaryRow, { marginTop: 10 }]}>
          <View style={[styles.summaryMiniCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.miniVal, { color: theme.colors.text }]}>{summary.completedCount || 0}</Text>
            <Text style={[styles.miniLabel, { color: theme.colors.subtext }]}>Deliveries Done</Text>
          </View>
          <View style={[styles.summaryMiniCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.miniVal, { color: theme.colors.text }]}>₹{summary.onlineEarnings || 0}</Text>
            <Text style={[styles.miniLabel, { color: theme.colors.subtext }]}>Online Paid</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs & Search */}
      <View style={styles.filterSection}>
        <TextInput
          placeholder="Search order number or client..."
          placeholderTextColor={theme.colors.placeholder}
          mode="outlined"
          value={searchTerm}
          onChangeText={setSearchTerm}
          textColor={theme.colors.text}
          outlineColor={theme.colors.border}
          activeOutlineColor={theme.colors.primary}
          style={[styles.input, { backgroundColor: isDark ? theme.colors.inputBg : "#ffffff" }]}
          left={<TextInput.Icon icon="magnify" color={theme.colors.placeholder} />}
        />

        <View style={styles.chipRow}>
          <Chip
            selected={activeFilter === "ALL"}
            onPress={() => setActiveFilter("ALL")}
            style={[styles.chip, activeFilter === "ALL" && styles.activeChip]}
            textStyle={{ color: activeFilter === "ALL" ? "#FFFFFF" : "#98a2b3", fontSize: 11, fontWeight: "bold" }}
          >
            All Logs
          </Chip>
          <Chip
            selected={activeFilter === "COD"}
            onPress={() => setActiveFilter("COD")}
            style={[styles.chip, activeFilter === "COD" && styles.activeChip]}
            textStyle={{ color: activeFilter === "COD" ? "#FFFFFF" : "#98a2b3", fontSize: 11, fontWeight: "bold" }}
          >
            💵 COD Cash
          </Chip>
          <Chip
            selected={activeFilter === "ONLINE"}
            onPress={() => setActiveFilter("ONLINE")}
            style={[styles.chip, activeFilter === "ONLINE" && styles.activeChip]}
            textStyle={{ color: activeFilter === "ONLINE" ? "#FFFFFF" : "#98a2b3", fontSize: 11, fontWeight: "bold" }}
          >
            💳 Online
          </Chip>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#ff6b00" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="history" size={48} color="#222a3a" style={{ marginBottom: 12 }} />
          <Text style={styles.empty}>No delivery records found matching criteria.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isCOD = !item.paymentMethod || item.paymentMethod.toLowerCase().includes("cash") || item.paymentMethod.toUpperCase() === "COD";
            const customerPhone = item.user?.phone || item.customerPhone;
            return (
              <Card
                style={styles.card}
                onPress={() => navigation.navigate("OrderDetails", { orderId: item._id })}
              >
                <Card.Content>
                  <View style={styles.row}>
                    <Text style={styles.orderNo}>#{item.orderNumber || item._id.slice(-6).toUpperCase()}</Text>
                    <Text style={[styles.statusText, { color: item.status === "Delivered" || item.status === "Completed" ? "#10b981" : "#ef4444" }]}>
                      {item.status}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientLabel}>Customer: <Text style={styles.clientVal}>{item.user?.name || item.customerName || "Guest User"}</Text></Text>
                      <Text style={[styles.clientLabel, { marginTop: 2 }]}>Restaurant: <Text style={styles.clientVal}>{item.restaurant?.name || "Partner Kitchen"}</Text></Text>
                    </View>
                    {customerPhone && (
                      <TouchableOpacity
                        style={styles.phoneBtn}
                        onPress={() => Linking.openURL(`tel:${customerPhone}`)}
                      >
                        <MaterialCommunityIcons name="phone" size={16} color="#ff6b00" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Payment & Money Breakdown */}
                  <View style={styles.moneyBadgeRow}>
                    <View style={[styles.paymentBadge, isCOD ? styles.codBadge : styles.onlineBadge]}>
                      <MaterialCommunityIcons name={isCOD ? "cash" : "credit-card-outline"} size={14} color={isCOD ? "#ff9f0a" : "#38bdf8"} />
                      <Text style={[styles.paymentBadgeText, { color: isCOD ? "#ff9f0a" : "#38bdf8" }]}>
                        {isCOD ? `COD (Collect ₹${item.totalAmount})` : `Online Paid (₹${item.totalAmount})`}
                      </Text>
                    </View>
                    <View style={styles.earningBadge}>
                      <Text style={styles.earningLabel}>Fee Payout:</Text>
                      <Text style={styles.earningVal}>₹{item.deliveryCharge || 40}</Text>
                    </View>
                  </View>

                  <View style={[styles.row, { marginTop: 10 }]}>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
                    <Text style={styles.detailsBtnText}>View Details ›</Text>
                  </View>
                </Card.Content>
              </Card>
            );
          }}
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
  summaryContainer: {
    padding: 16,
    backgroundColor: "#111622",
    borderBottomWidth: 1,
    borderColor: "#1e2638",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#161b26",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#98a2b3",
    fontWeight: "600",
    marginTop: 2,
  },
  summaryMiniCard: {
    flex: 1,
    backgroundColor: "#161b26",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222a3a",
  },
  miniVal: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  miniLabel: {
    fontSize: 10,
    color: "#667085",
    fontWeight: "600",
  },
  filterSection: {
    padding: 16,
    paddingBottom: 8,
  },
  input: {
    backgroundColor: "transparent",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    backgroundColor: "#161b26",
    borderColor: "#222a3a",
    borderWidth: 1,
  },
  activeChip: {
    backgroundColor: "#ff6b00",
    borderColor: "#ff6b00",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 120,
    flexGrow: 1,
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  phoneBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,107,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  moneyBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#1e2638",
  },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  codBadge: {
    backgroundColor: "rgba(255,159,10,0.1)",
    borderColor: "rgba(255,159,10,0.3)",
  },
  onlineBadge: {
    backgroundColor: "rgba(56,189,248,0.1)",
    borderColor: "rgba(56,189,248,0.3)",
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  earningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  earningLabel: {
    fontSize: 10,
    color: "#98a2b3",
    fontWeight: "600",
  },
  earningVal: {
    fontSize: 13,
    fontWeight: "900",
    color: "#10b981",
  },
  dateText: {
    fontSize: 10,
    color: "#475467",
    fontWeight: "600",
  },
  detailsBtnText: {
    fontSize: 11,
    color: "#ff6b00",
    fontWeight: "bold",
  },
});

export default DeliveryHistoryScreen;
