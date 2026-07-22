import React, { useEffect } from "react";
import { View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from "react-native";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import { Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications } from "../../redux/slices/notificationsSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { notifications, loading } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleString('default', { month: 'short' });
      return `${day} ${month}`;
    } catch (e) {
      return "";
    }
  };

  const getNotificationConfig = (type) => {
    const displayType = type || "System Notice";
    const lowerType = displayType.toLowerCase();

    if (lowerType.includes("offer") || lowerType.includes("promo") || lowerType.includes("discount")) {
      return {
        icon: "gift-outline",
        bgColor: "#fee2e2",
        iconColor: "#ef4444",
        badgeBg: "#fecdd3",
        badgeText: "#991b1b",
        label: "Offer"
      };
    } else if (lowerType.includes("order") || lowerType.includes("delivery") || lowerType.includes("track")) {
      return {
        icon: "package-variant-closed",
        bgColor: "#d1fae5",
        iconColor: "#10b981",
        badgeBg: "#a7f3d0",
        badgeText: "#065f46",
        label: "Order Update"
      };
    } else {
      return {
        icon: "bell-outline",
        bgColor: "#dbeafe",
        iconColor: "#3b82f6",
        badgeBg: "#bfdbfe",
        badgeText: "#1e3a8a",
        label: "System Notice"
      };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <CustomScreenHeader title="Notifications" navigation={navigation} />
      <View style={styles.container}>
        <FlatList
          data={notifications || []}
          keyExtractor={(item, index) => (item?._id || item?.id || index || Math.random().toString()).toString()}
          refreshing={loading}
          onRefresh={() => dispatch(fetchNotifications())}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (!item) return null;
            const config = getNotificationConfig(item.type || item.title);

            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  {/* Left: Icon Wrapper */}
                  <View style={[styles.iconWrapper, { backgroundColor: config.bgColor }]}>
                    <MaterialCommunityIcons name={config.icon} size={22} color={config.iconColor} />
                  </View>

                  {/* Middle: Content */}
                  <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title || "Notice"}
                      </Text>
                      {/* Badge / Chip */}
                      <View style={[styles.badge, { backgroundColor: config.badgeBg }]}>
                        <Text style={[styles.badgeText, { color: config.badgeText }]}>
                          {config.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardDescription}>
                      {item.description || ""}
                    </Text>

                    {item.createdAt && (
                      <View style={styles.timeRow}>
                        <MaterialCommunityIcons name="clock-outline" size={11} color="#94a3b8" />
                        <Text style={styles.timeText}>
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="bell-off-outline" size={40} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No new notifications found in your inbox.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  timeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
});

export default NotificationsScreen;
