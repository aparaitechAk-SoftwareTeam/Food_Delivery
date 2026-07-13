import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from "react-native";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import { Text, Card, Chip, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../../utils/api";

const CashbackDealsScreen = ({ navigation }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/campaigns/active");
      setCampaigns(data || []);
    } catch (error) {
      console.warn("Failed to load active cashback campaigns:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const renderCampaignCard = ({ item }) => {
    const isExpired = new Date(item.expiryDate) < new Date();

    return (
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.leftInfo}>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>{item.cashbackPercentage}%</Text>
              <Text style={styles.cashbackLabel}>CASHBACK</Text>
            </View>
          </View>
          <View style={styles.rightInfo}>
            <View style={styles.titleRow}>
              <Text variant="titleMedium" style={styles.campaignTitle}>{item.title}</Text>
              <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>
                {item.category}
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles.capText}>
              Max cashback per order: <Text style={styles.boldText}>₹{item.cashbackCap}</Text>
            </Text>
            <View style={styles.expiryRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
              <Text style={styles.expiryText}>
                {isExpired ? "Expired" : `Valid till: ${new Date(item.expiryDate).toLocaleDateString()}`}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View style={styles.container}>
      {/* Banner */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <MaterialCommunityIcons name="cash-multiple" size={40} color="#FFFFFF" />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Cashback Deals & Offers
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Order items from qualifying categories to receive instant cashback credited directly to your wallet on delivery!
          </Text>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Active Campaigns
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6F61" style={styles.loader} />
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item._id}
          renderItem={renderCampaignCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>No active cashback campaigns available today. Check back later!</Text>
          }
        />
      )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerCard: {
    margin: 16,
    borderRadius: 20,
    backgroundColor: "#1E3A8A", // dark blue
    elevation: 3,
  },
  headerContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  headerSubtitle: {
    color: "#BFDBFE",
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#1F2937",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  leftInfo: {
    marginRight: 16,
    alignItems: "center",
  },
  percentageBadge: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1.5,
    borderColor: "#A5D6A7",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  percentageText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2E7D32",
  },
  cashbackLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  rightInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  campaignTitle: {
    fontWeight: "bold",
    color: "#111827",
    fontSize: 14,
    flex: 1,
  },
  categoryChip: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    height: 24,
  },
  categoryChipText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#1E40AF",
  },
  capText: {
    color: "#4B5563",
    fontSize: 11,
    marginTop: 2,
  },
  boldText: {
    fontWeight: "bold",
    color: "#111827",
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  expiryText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  loader: {
    marginVertical: 24,
  },
  empty: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 12,
    marginVertical: 40,
    paddingHorizontal: 24,
    lineHeight: 18,
  },
});

export default CashbackDealsScreen;
