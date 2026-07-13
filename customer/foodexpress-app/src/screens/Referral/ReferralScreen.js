import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Share, FlatList, ActivityIndicator, SafeAreaView } from "react-native";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import { Text, Card, Button, List, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import api from "../../utils/api";

const ReferralScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/referrals/history");
      setHistory(data || []);
    } catch (error) {
      console.warn("Failed to load referral history:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleShare = async () => {
    if (!user || !user.referralCode) return;
    try {
      const message = `Hey! Order delicious meals from FoodExpress! Use my referral code: ${user.referralCode} during sign up, and we'll both unlock awesome rewards! Download now.`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.warn("Share failed:", error.message);
    }
  };

  const renderHistoryItem = ({ item }) => {
    return (
      <List.Item
        title={item.name}
        description={`Joined: ${new Date(item.createdAt).toLocaleDateString()}`}
        titleStyle={styles.itemTitle}
        descriptionStyle={styles.itemDesc}
        left={(props) => (
          <List.Icon {...props} icon="account-plus-outline" color="#FF6F61" />
        )}
        right={(props) => (
          <View style={styles.rightStatus}>
            <Text
              style={[
                styles.statusText,
                item.referralRewarded ? styles.statusRewarded : styles.statusPending,
              ]}
            >
              {item.referralRewarded ? "+₹100 Wallet" : "Pending Order"}
            </Text>
          </View>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View style={styles.container}>
      {/* Invite Card */}
      <Card style={styles.inviteCard}>
        <Card.Content style={styles.inviteContent}>
          <MaterialCommunityIcons name="gift-outline" size={48} color="#FF6F61" />
          <Text variant="headlineSmall" style={styles.inviteTitle}>
            Invite Friends & Earn ₹100
          </Text>
          <Text variant="bodyMedium" style={styles.inviteSubtitle}>
            Share your unique referral code with friends. When they register and complete their first delivered order, you'll earn ₹100 instantly!
          </Text>

          {/* Referral Code Box */}
          <View style={styles.codeBox}>
            <Text variant="labelLarge" style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
            <Text variant="headlineMedium" style={styles.codeText}>
              {user?.referralCode || "REFXXX"}
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleShare}
            icon="share-variant"
            style={styles.shareButton}
            labelStyle={styles.shareButtonLabel}
          >
            Invite Friends
          </Button>
        </Card.Content>
      </Card>

      {/* Referral History Header */}
      <View style={styles.historyHeader}>
        <Text variant="titleMedium" style={styles.historyTitle}>
          Referral History ({history.length})
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6F61" style={styles.loader} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id}
          renderItem={renderHistoryItem}
          ItemSeparatorComponent={() => <Divider />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>No friends referred yet. Share your code to start earning!</Text>
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
  inviteCard: {
    margin: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inviteContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  inviteTitle: {
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 12,
    marginBottom: 6,
  },
  inviteSubtitle: {
    color: "#475467",
    textAlign: "center",
    paddingHorizontal: 12,
    lineHeight: 18,
    fontSize: 12,
    marginBottom: 20,
  },
  codeBox: {
    backgroundColor: "#FFF0EE",
    borderWidth: 2,
    borderColor: "#FEE4E2",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 20,
    width: "80%",
  },
  codeLabel: {
    color: "#FF6F61",
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  codeText: {
    fontWeight: "black",
    color: "#1F2937",
    letterSpacing: 2,
  },
  shareButton: {
    backgroundColor: "#FF6F61",
    borderRadius: 20,
    width: "80%",
  },
  shareButtonLabel: {
    fontWeight: "bold",
  },
  historyHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  historyTitle: {
    fontWeight: "bold",
    color: "#1F2937",
  },
  listContent: {
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    flexGrow: 1,
  },
  itemTitle: {
    fontWeight: "bold",
    color: "#1F2937",
    fontSize: 13,
  },
  itemDesc: {
    fontSize: 11,
    color: "#6B7280",
  },
  rightStatus: {
    justifyContent: "center",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusRewarded: {
    color: "#2E7D32",
    backgroundColor: "#E8F5E9",
  },
  statusPending: {
    color: "#FF6F61",
    backgroundColor: "#FFF0EE",
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

export default ReferralScreen;
