import React, { useEffect } from "react";
import { View, StyleSheet, FlatList, SafeAreaView } from "react-native";
import CustomScreenHeader from "../../components/CustomScreenHeader";
import { Card, Text, Chip } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications } from "../../redux/slices/notificationsSlice";

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { notifications, loading } = useSelector(
    (state) => state.notifications,
  );

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const renderTag = (type) => {
    const displayType = type || "System Notice";
    const color = displayType === "Offer" ? "orange" : "blue";
    return <Chip style={[styles.chip, { borderColor: color }]} textStyle={{ fontSize: 10 }}>{displayType}</Chip>;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <CustomScreenHeader title="Notifications" navigation={navigation} />
      <View style={styles.container}>
        <FlatList
          data={notifications || []}
          keyExtractor={(item, index) => (item?._id || item?.id || index || Math.random().toString()).toString()}
          refreshing={loading}
          onRefresh={() => dispatch(fetchNotifications())}
          renderItem={({ item }) => {
            if (!item) return null;
            return (
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.topRow}>
                    <Text variant="titleMedium" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
                      {item.title || "Notice"}
                    </Text>
                    {renderTag(item.type)}
                  </View>
                  <Text style={styles.description}>{item.description || ""}</Text>
                </Card.Content>
              </Card>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
        />
      </View>
    </SafeAreaView>
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  description: {
    marginTop: 8,
    color: "#666",
  },
  chip: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  empty: {
    marginTop: 32,
    textAlign: "center",
  },
});

export default NotificationsScreen;
