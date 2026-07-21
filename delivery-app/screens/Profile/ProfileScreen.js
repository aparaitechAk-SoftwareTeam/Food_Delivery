import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, FlatList } from "react-native";
import { Text, Card, TextInput, Button, ActivityIndicator, Switch, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../utils/api";
import { AuthContext } from "../../App";
import { useThemeContext } from "../../utils/ThemeContext";

const ProfileScreen = ({ navigation }) => {
  const { signOut } = useContext(AuthContext);
  const { isDark, theme, toggleTheme } = useThemeContext();
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);

  // Delivery History State
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historySummary, setHistorySummary] = useState({
    completedCount: 0,
    totalEarnings: 0,
    cashCollected: 0,
  });
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Password change state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const stored = await AsyncStorage.getItem("rider_user");
        if (stored) {
          setRider(JSON.parse(stored));
        }

        // Fetch Delivery History for Profile Screen
        const res = await api.get("/delivery/history");
        const ordersList = Array.isArray(res.data) ? res.data : (res.data?.orders || []);
        setHistoryOrders(ordersList);

        let completed = 0;
        let earnings = 0;
        let cash = 0;

        ordersList.forEach((o) => {
          if (["Delivered", "Completed"].includes(o.status)) {
            completed += 1;
            earnings += o.deliveryCharge || 40;
            const isCOD = !o.paymentMethod || o.paymentMethod.toLowerCase().includes("cash") || o.paymentMethod.toUpperCase() === "COD";
            if (isCOD) cash += o.totalAmount || 0;
          }
        });

        setHistorySummary({
          completedCount: completed,
          totalEarnings: earnings,
          cashCollected: cash,
        });
      } catch (e) {
        console.log("Error loading profile or history:", e);
      } finally {
        setLoading(false);
        setLoadingHistory(false);
      }
    };
    loadProfileData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of your rider account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("rider_token");
              await AsyncStorage.removeItem("rider_user");
              signOut();
            } catch (err) {
              console.log(err);
            }
          }
        }
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all password fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.post("/auth/reset-password", {
        email: rider.email,
        password: password.trim()
      });
      Alert.alert("Success", "Password updated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      Alert.alert("Failed to update password", err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!rider) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBg, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Rider Profile & History</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <Card style={[styles.profileCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Card.Content style={styles.avatarCol}>
            <Image 
              source={{ uri: rider.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" }} 
              style={[styles.avatar, { borderColor: theme.colors.primary }]} 
            />
            <Text style={[styles.name, { color: theme.colors.text }]}>{rider.name}</Text>
            <Text style={[styles.roleLabel, { color: theme.colors.subtext }]}>FoodExpress Delivery Executive</Text>
          </Card.Content>
        </Card>

        {/* Delivery Performance KPI Summary */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>Delivery Performance</Text>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiBox, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
                <MaterialCommunityIcons name="check-decagram" size={22} color="#10b981" />
                <Text style={[styles.kpiValue, { color: theme.colors.text }]}>{historySummary.completedCount}</Text>
                <Text style={[styles.kpiLabel, { color: theme.colors.subtext }]}>Deliveries</Text>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
                <MaterialCommunityIcons name="cash-multiple" size={22} color="#ff6b00" />
                <Text style={[styles.kpiValue, { color: theme.colors.text }]}>₹{historySummary.totalEarnings}</Text>
                <Text style={[styles.kpiLabel, { color: theme.colors.subtext }]}>Earnings</Text>
              </View>

              <View style={[styles.kpiBox, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
                <MaterialCommunityIcons name="wallet-outline" size={22} color="#3b82f6" />
                <Text style={[styles.kpiValue, { color: theme.colors.text }]}>₹{historySummary.cashCollected}</Text>
                <Text style={[styles.kpiLabel, { color: theme.colors.subtext }]}>COD Cash</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Delivery History Section inside Profile */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Card.Content>
            <View style={styles.historyHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.subtext, marginBottom: 0 }]}>Delivery History</Text>
              <TouchableOpacity 
                style={styles.viewAllBtn}
                onPress={() => navigation.navigate("DeliveryHistory")}
              >
                <Text style={{ fontSize: 12, fontWeight: "bold", color: theme.colors.primary }}>View All</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {loadingHistory ? (
              <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 16 }} />
            ) : historyOrders.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <MaterialCommunityIcons name="history" size={36} color={theme.colors.subtext} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: theme.colors.subtext, marginTop: 6 }}>
                  No delivery history records found.
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                {historyOrders.slice(0, 5).map((order) => {
                  const isCOD = !order.paymentMethod || order.paymentMethod.toLowerCase().includes("cash") || order.paymentMethod.toUpperCase() === "COD";
                  return (
                    <TouchableOpacity
                      key={order._id}
                      style={[styles.historyItemCard, { backgroundColor: isDark ? "#0f172a" : "#f8fafc", borderColor: theme.colors.border }]}
                      onPress={() => navigation.navigate("OrderDetails", { orderId: order._id })}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 13, fontWeight: "bold", color: theme.colors.text }}>
                          #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                        </Text>
                        <Chip 
                          compact 
                          textStyle={{ fontSize: 10, fontWeight: "bold" }}
                          style={{ backgroundColor: order.status === "Delivered" || order.status === "Completed" ? "#d1fae5" : "#fee2e2" }}
                        >
                          {order.status}
                        </Chip>
                      </View>

                      <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: theme.colors.text }}>
                          Customer: {order.user?.name || order.customerName || "Customer"}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.colors.subtext, marginTop: 2 }} numberOfLines={1}>
                          📍 {order.address?.line1 || "Customer Address"}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? "#1e293b" : "#e2e8f0" }}>
                        <Text style={{ fontSize: 12, fontWeight: "extrabold", color: theme.colors.primary }}>
                          ₹{order.totalAmount || 0} ({isCOD ? "COD" : "Online"})
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.colors.subtext }}>
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Vehicle & License particulars */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>Vehicle & License Details</Text>
            
            <View style={styles.row}>
              <View style={styles.metaCol}>
                <Text style={[styles.metaLabel, { color: theme.colors.subtext }]}>Vehicle Type</Text>
                <Text style={[styles.metaVal, { color: theme.colors.text }]}>{rider.vehicleType || "Bike"}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={[styles.metaLabel, { color: theme.colors.subtext }]}>License Number</Text>
                <Text style={[styles.metaVal, { color: theme.colors.text }]}>{rider.licenseNumber || "N/A"}</Text>
              </View>
            </View>

            <View style={[styles.row, { marginTop: 14 }]}>
              <View style={styles.metaCol}>
                <Text style={[styles.metaLabel, { color: theme.colors.subtext }]}>License Plate Code</Text>
                <Text style={[styles.metaVal, { color: theme.colors.text }]}>{rider.vehicleNumber || "N/A"}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={[styles.metaLabel, { color: theme.colors.subtext }]}>Contact Phone</Text>
                <Text style={[styles.metaVal, { color: theme.colors.text }]}>{rider.phone || "N/A"}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* App Preferences / Dark Mode */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>App Preferences</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons name="weather-night" size={22} color={theme.colors.primary} style={{ marginRight: 10 }} />
                <Text style={{ fontSize: 14, fontWeight: "bold", color: theme.colors.text }}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                color={theme.colors.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Change password */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>Change Password</Text>
            
            <TextInput
              label="New Password"
              mode="outlined"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textColor={theme.colors.text}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
              style={[styles.input, { backgroundColor: isDark ? theme.colors.inputBg : "#ffffff" }]}
              disabled={updatingPassword}
            />

            <TextInput
              label="Confirm Password"
              mode="outlined"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textColor={theme.colors.text}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.primary}
              style={[styles.input, { backgroundColor: isDark ? theme.colors.inputBg : "#ffffff" }]}
              disabled={updatingPassword}
            />

            <Button
              mode="contained"
              buttonColor={theme.colors.primary}
              textColor="#ffffff"
              style={styles.saveBtn}
              onPress={handleChangePassword}
              loading={updatingPassword}
              disabled={updatingPassword}
            >
              Update Password
            </Button>
          </Card.Content>
        </Card>

        {/* Logout */}
        <Button
          mode="contained"
          buttonColor="#ef4444"
          textColor="#ffffff"
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          Sign Out of Rider Account
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    flexGrow: 1,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 24,
    marginBottom: 16,
  },
  avatarCol: {
    alignItems: "center",
    paddingVertical: 10,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  kpiBox: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: "extrabold",
    marginTop: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  historyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyItemCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  metaVal: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  input: {
    marginBottom: 12,
  },
  saveBtn: {
    borderRadius: 12,
    marginTop: 8,
  },
  logoutBtn: {
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 4,
  },
});

export default ProfileScreen;
