import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import { Text, Card, TextInput, Button, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../utils/api";
import { AuthContext } from "../../App";

const ProfileScreen = ({ navigation }) => {
  const { signOut } = useContext(AuthContext);
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
      // Endpoint is handled inside standard auth change password
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
      <View style={styles.center}>
        <ActivityIndicator color="#ff6b00" size="large" />
      </View>
    );
  }

  if (!rider) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Rider Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.avatarCol}>
            <Image 
              source={{ uri: rider.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" }} 
              style={styles.avatar} 
            />
            <Text style={styles.name}>{rider.name}</Text>
            <Text style={styles.roleLabel}>FoodExpress Delivery Executive</Text>
          </Card.Content>
        </Card>

        {/* Vehicle particulars */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Vehicle & License Details</Text>
            
            <View style={styles.row}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Vehicle Type</Text>
                <Text style={styles.metaVal}>{rider.vehicleType || "Bike"}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>License Number</Text>
                <Text style={styles.metaVal}>{rider.licenseNumber || "N/A"}</Text>
              </View>
            </View>

            <View style={[styles.row, { marginTop: 14 }]}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>License Plate Code</Text>
                <Text style={styles.metaVal}>{rider.vehicleNumber || "N/A"}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Contact Phone</Text>
                <Text style={styles.metaVal}>{rider.phone || "N/A"}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Change password */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Change Password</Text>
            
            <TextInput
              label="New Password"
              mode="outlined"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textColor="#FFFFFF"
              outlineColor="#2a3347"
              activeOutlineColor="#ff6b00"
              style={styles.input}
              disabled={updatingPassword}
            />

            <TextInput
              label="Confirm Password"
              mode="outlined"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textColor="#FFFFFF"
              outlineColor="#2a3347"
              activeOutlineColor="#ff6b00"
              style={styles.input}
              disabled={updatingPassword}
            />

            <Button
              mode="contained"
              buttonColor="#ff6b00"
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
    backgroundColor: "#0b0f19",
  },
  header: {
    backgroundColor: "#161b26",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#222a3a",
  },
  backBtn: {
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0f19",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#161b26",
    borderWidth: 1,
    borderColor: "#222a3a",
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
    borderColor: "#ff6b00",
    backgroundColor: "#222a3a",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
  },
  roleLabel: {
    fontSize: 10,
    color: "#667085",
    fontWeight: "600",
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: "#161b26",
    borderWidth: 1,
    borderColor: "#222a3a",
    borderRadius: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#667085",
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
    color: "#475467",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  metaVal: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginTop: 2,
  },
  input: {
    backgroundColor: "transparent",
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
