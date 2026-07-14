import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar
} from "react-native";
import { Text, Card, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import api from "../../utils/api";

const CouponsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("active"); // active, used, expired
  const [loading, setLoading] = useState(true);
  const [couponsData, setCouponsData] = useState({ active: [], used: [], expired: [] });
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/coupons/my");
      setCouponsData({
        active: data.active || [],
        used: data.used || [],
        expired: data.expired || []
      });
    } catch (err) {
      console.warn("Error fetching coupons:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopy = (code) => {
    Clipboard.setString(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getCouponsList = () => {
    if (activeTab === "active") return couponsData.active;
    if (activeTab === "used") return couponsData.used;
    return couponsData.expired;
  };

  const renderCouponCard = ({ item }) => {
    const isExpired = activeTab === "expired";
    const isUsed = activeTab === "used";

    return (
      <Card style={[styles.couponCard, (isExpired || isUsed) && styles.disabledCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.giftIconBg, (isExpired || isUsed) && styles.disabledIconBg]}>
              <MaterialCommunityIcons 
                name={isUsed ? "check-circle" : isExpired ? "clock-alert-outline" : "gift-outline"} 
                size={22} 
                color={isUsed ? "#039855" : isExpired ? "#667085" : "#FF6F61"} 
              />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.discountText}>
                ₹{item.value} Off
              </Text>
              <Text style={styles.minOrderText}>
                Min. Order: ₹{item.minOrderAmount || 0}
              </Text>
            </View>
          </View>
          
          {!isUsed && !isExpired && (
            <TouchableOpacity 
              style={[styles.copyBtn, copiedCode === item.code && styles.copyBtnSuccess]} 
              onPress={() => handleCopy(item.code)}
            >
              <Text style={styles.copyBtnText}>
                {copiedCode === item.code ? "Copied!" : "Copy"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dashedDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>CODE:</Text>
            <Text style={[styles.codeVal, (isExpired || isUsed) && styles.disabledCodeVal]}>
              {item.code}
            </Text>
          </View>

          <Text style={styles.expiryText}>
            {isUsed 
              ? `Used on ${new Date(item.usedAt || item.createdAt).toLocaleDateString()}` 
              : isExpired 
                ? "Expired" 
                : `Expires: ${new Date(item.expiresAt).toLocaleDateString()}`
            }
          </Text>
        </View>
      </Card>
    );
  };

  const coupons = getCouponsList();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <CustomScreenHeader title="My Coupon Wallet" navigation={navigation} showBack={true} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {["active", "used", "expired"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()} ({couponsData[tab]?.length || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F61" />
        </View>
      ) : coupons.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
        >
          <MaterialCommunityIcons 
            name={activeTab === "used" ? "ticket-percent-outline" : "ticket-confirmation-outline"} 
            size={70} 
            color="#D0D5DD" 
          />
          <Text style={styles.emptyTitle}>No Coupons Found</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === "active" 
              ? "Complete cashback reward campaigns to unlock coupons!" 
              : `You don't have any ${activeTab} coupons.`}
          </Text>
          <Button 
            mode="contained" 
            onPress={fetchCoupons} 
            style={styles.refreshBtn}
            buttonColor="#FF6F61"
          >
            Refresh Wallet
          </Button>
        </ScrollView>
      ) : (
        <FlatList
          data={coupons}
          renderItem={renderCouponCard}
          keyExtractor={(item) => item._id || item.code}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchCoupons}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: "#FF6F61",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#667085",
  },
  activeTabText: {
    color: "#FF6F61",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
  },
  couponCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAECF0",
    elevation: 1,
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  disabledCard: {
    backgroundColor: "#F9FAFB",
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  giftIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF0ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  disabledIconBg: {
    backgroundColor: "#F2F4F7",
  },
  headerTextCol: {
    justifyContent: "center",
  },
  discountText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1D2939",
  },
  minOrderText: {
    fontSize: 11,
    color: "#667085",
    marginTop: 2,
  },
  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFF0ED",
    borderWidth: 1,
    borderColor: "#FFB0A9",
  },
  copyBtnSuccess: {
    backgroundColor: "#D1FADF",
    borderColor: "#6CFFB4",
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF6F61",
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderStyle: "dashed",
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  codeRowLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#98A2B3",
    marginRight: 4,
  },
  codeVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FF6F61",
    letterSpacing: 0.5,
  },
  disabledCodeVal: {
    color: "#667085",
  },
  expiryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#667085",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#344054",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#667085",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 18,
  },
  refreshBtn: {
    borderRadius: 8,
  },
});

export default CouponsScreen;
