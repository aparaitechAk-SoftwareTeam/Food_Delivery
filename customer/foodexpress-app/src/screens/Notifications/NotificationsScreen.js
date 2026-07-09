import React, { useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Card, Text, Chip } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotifications } from "../../redux/slices/notificationsSlice";

const NotificationsScreen = () => {
  const dispatch = useDispatch();
  const { notifications, loading } = useSelector(
    (state) => state.notifications,
  );

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const renderTag = (type) => {
    const color = type === "Offer" ? "orange" : "blue";
    return <Chip style={[styles.chip, { borderColor: color }]}>{type}</Chip>;
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Notifications
      </Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={() => dispatch(fetchNotifications())}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.topRow}>
                <Text variant="titleMedium">{item.title}</Text>
                {renderTag(item.type)}
              </View>
              <Text style={styles.description}>{item.description}</Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
      />
    </View>
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
