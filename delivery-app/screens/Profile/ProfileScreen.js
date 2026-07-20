import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import { Text, Card, TextInput, Button, ActivityIndicator, Switch } from "react-native-paper";
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

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem("rider_user");
        if (stored) {
          setRider(JSON.parse(stored));
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
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
        <Text style={[styles.title, { color: theme.colors.text }]}>Rider Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
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

        {/* Vehicle particulars */}
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
    paddingBottom: 40,
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
