import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from "react-native";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import { Text, Card, Button, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "../../redux/slices/authSlice";
import api from "../../utils/api";

const GoldMembershipScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purchasingPlanId, setPurchasingPlanId] = useState(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/memberships/plans");
      setPlans(data || []);
    } catch (error) {
      console.warn("Failed to load membership plans:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handlePurchase = async (plan) => {
    if (!user) {
      Alert.alert("Log In Required", "Please log in to purchase a membership.");
      return;
    }

    if ((user.walletBalance || 0) < plan.price) {
      Alert.alert(
        "Insufficient Balance",
        `Plan cost is ₹${plan.price}, but your wallet balance is ₹${(user.walletBalance || 0).toFixed(2)}. Please earn or add wallet balance first.`
      );
      return;
    }

    Alert.alert(
      "Confirm Purchase",
      `Are you sure you want to buy "${plan.name}" for ₹${plan.price}? It will be deducted from your wallet.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purchase",
          onPress: async () => {
            setPurchasingPlanId(plan._id);
            try {
              const { data } = await api.post("/memberships/purchase", { planId: plan._id });
              Alert.alert("Success", data.message || "Welcome to Gold membership!");
              dispatch(fetchUserProfile()); // Refresh profile to show gold status
            } catch (error) {
              Alert.alert("Failed", error.message || "Failed to purchase membership.");
            } finally {
              setPurchasingPlanId(null);
            }
          },
        },
      ]
    );
  };

  const isGoldActive = user?.isGoldMember && user?.goldExpiry && new Date(user.goldExpiry) > new Date();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Banner */}
      <Card style={[styles.headerCard, isGoldActive && styles.headerCardActive]}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Icon size={64} icon="crown" color="#FFF" style={styles.crownAvatar} />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {isGoldActive ? "You are a Gold Member!" : "Upgrade to Gold Membership"}
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {isGoldActive
              ? `Enjoy unlimited free deliveries until ${new Date(user.goldExpiry).toLocaleDateString()}`
              : "Unlock exclusive VIP benefits, extra discounts, and free deliveries today!"}
          </Text>
        </Card.Content>
      </Card>

      {/* Benefits Section */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Gold Benefits
      </Text>
      <View style={styles.benefitsRow}>
        <Card style={styles.benefitCard}>
          <Card.Content style={styles.benefitContent}>
            <MaterialCommunityIcons name="truck-delivery" size={32} color="#D4AF37" />
            <Text variant="titleSmall" style={styles.benefitTitle}>Free Delivery</Text>
            <Text variant="bodySmall" style={styles.benefitDesc}>Unlimited free delivery on orders from all restaurants.</Text>
          </Card.Content>
        </Card>
        <Card style={styles.benefitCard}>
          <Card.Content style={styles.benefitContent}>
            <MaterialCommunityIcons name="percent" size={32} color="#D4AF37" />
            <Text variant="titleSmall" style={styles.benefitTitle}>Flat 10% Off</Text>
            <Text variant="bodySmall" style={styles.benefitDesc}>Get an extra 10% discount on cart subtotal automatically.</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Plans Section */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Choose your plan
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#FF6F61" style={styles.loader} />
      ) : plans.length === 0 ? (
        <Text style={styles.empty}>No membership plans available currently.</Text>
      ) : (
        plans.map((plan) => (
          <Card key={plan._id} style={styles.planCard}>
            <Card.Content style={styles.planContent}>
              <View style={styles.planInfo}>
                <Text variant="titleLarge" style={styles.planName}>{plan.name}</Text>
                <Text variant="bodySmall" style={styles.planDesc}>{plan.description}</Text>
                <Text variant="bodyMedium" style={styles.planDuration}>Duration: {plan.durationDays} days</Text>
              </View>
              <View style={styles.planPurchase}>
                <Text variant="headlineSmall" style={styles.planPrice}>₹{plan.price}</Text>
                <Button
                  mode="contained"
                  onPress={() => handlePurchase(plan)}
                  loading={purchasingPlanId === plan._id}
                  disabled={purchasingPlanId !== null}
                  style={styles.buyButton}
                  labelStyle={styles.buyButtonLabel}
                >
                  Buy
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentContainer: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: "#1F2937",
    borderRadius: 24,
    marginBottom: 20,
    elevation: 4,
  },
  headerCardActive: {
    backgroundColor: "#855800",
  },
  headerContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  crownAvatar: {
    backgroundColor: "#D4AF37",
    marginBottom: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  headerSubtitle: {
    color: "#D1D5DB",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
    marginTop: 8,
  },
  benefitsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  benefitCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  benefitContent: {
    alignItems: "center",
    padding: 12,
    textAlign: "center",
  },
  benefitTitle: {
    fontWeight: "bold",
    color: "#111827",
    marginVertical: 6,
  },
  benefitDesc: {
    color: "#6B7280",
    textAlign: "center",
    fontSize: 10,
    lineHeight: 14,
  },
  loader: {
    marginVertical: 24,
  },
  empty: {
    textAlign: "center",
    color: "#6B7280",
    marginVertical: 24,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  planContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planInfo: {
    flex: 1,
    marginRight: 16,
  },
  planName: {
    fontWeight: "bold",
    color: "#111827",
  },
  planDesc: {
    color: "#6B7280",
    marginTop: 4,
    fontSize: 11,
  },
  planDuration: {
    color: "#FF6F61",
    fontWeight: "600",
    fontSize: 11,
    marginTop: 6,
  },
  planPurchase: {
    alignItems: "flex-end",
  },
  planPrice: {
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  buyButton: {
    backgroundColor: "#FF6F61",
    borderRadius: 20,
  },
  buyButtonLabel: {
    fontWeight: "bold",
    fontSize: 12,
  },
});

export default GoldMembershipScreen;
