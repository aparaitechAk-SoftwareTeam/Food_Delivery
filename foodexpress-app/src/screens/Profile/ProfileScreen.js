import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, Button, Avatar } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slices/authSlice";

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={72} label={user?.name?.charAt(0) || "U"} />
        <View style={{ marginLeft: 16 }}>
          <Text variant="headlineSmall">{user?.name || "Guest"}</Text>
          <Text>{user?.email}</Text>
        </View>
      </View>
      <Card style={styles.card}>
        <Card.Title title="Manage Addresses" />
      </Card>
      <Card style={styles.card}>
        <Card.Title title="Notifications" />
      </Card>
      <Button
        mode="contained"
        style={styles.logoutButton}
        onPress={() => dispatch(logout())}
      >
        Logout
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  card: {
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 24,
  },
});

export default ProfileScreen;
