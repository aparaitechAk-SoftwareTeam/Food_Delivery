import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import {
  Text,
  Button,
  Avatar,
  Card,
  IconButton,
  Divider,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUserProfile, selectDefaultAddress } from "../../redux/slices/authSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { userProfile, addresses } = useSelector((state) => state.auth);
  const { items: wishlistFoods } = useSelector((state) => state.wishlist);

  // Edit Profile States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleOpenEdit = () => {
    setName(userProfile?.name || "");
    setEmail(userProfile?.email || "");
    setPhone(userProfile?.phone || "");
    setEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    if (!name || !email) {
      Alert.alert("Error", "Name and Email are required.");
      return;
    }
    dispatch(updateUserProfile({ name, email, phone }));
    setEditModalVisible(false);
  };

  const handleSetDefaultAddress = (addressId) => {
    dispatch(selectDefaultAddress(addressId));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* User Header Profile */}
      <View style={styles.profileHeader}>
        <Avatar.Image
          size={74}
          source={{
            uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          }}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userProfile?.name || "Foodie Guest"}</Text>
          <Text style={styles.profileEmail}>{userProfile?.email || "guest@foodexpress.com"}</Text>
          <Text style={styles.profilePhone}>
            {userProfile?.phone ? `+91 ${userProfile.phone}` : "Add Mobile Number"}
          </Text>
        </View>
        <IconButton
          icon="pencil-outline"
          iconColor="#ff6b00"
          size={20}
          onPress={handleOpenEdit}
          style={styles.editIconBtn}
        />
      </View>

      {/* Navigation Shortcut Menu Links */}
      <Card style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Orders")}
        >
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons name="receipt" size={22} color="#ff6b00" />
            <Text style={styles.menuItemText}>My Orders</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#bbb" />
        </TouchableOpacity>

        <Divider style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("Wishlist")}
        >
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons name="heart-outline" size={22} color="#ff6b00" />
            <Text style={styles.menuItemText}>Saved Dishes ({wishlistFoods?.length || 0})</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#bbb" />
        </TouchableOpacity>
      </Card>

      {/* Saved Addresses Section */}
      <Text style={styles.sectionTitle}>Saved Addresses</Text>
      <Card style={styles.sectionCard}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved addresses yet. Open Home to add one.</Text>
          </View>
        ) : (
          addresses.map((item, index) => (
            <View key={item._id || item.id}>
              {index > 0 && <Divider />}
              <TouchableOpacity
                style={[styles.addressItem, item.isDefault && styles.defaultAddressItem]}
                onPress={() => handleSetDefaultAddress(item._id || item.id)}
              >
                <MaterialCommunityIcons
                  name={item.label === "Home" ? "home" : item.label === "Work" ? "briefcase" : "map-marker"}
                  color={item.isDefault ? "#ff6b00" : "#666"}
                  size={22}
                  style={styles.addressIcon}
                />
                <View style={styles.addressInfoCol}>
                  <Text style={[styles.addressLabel, item.isDefault && styles.defaultAddressLabel]}>
                    {item.label} {item.isDefault && "(Default)"}
                  </Text>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {item.line1}, {item.line2 ? `${item.line2}, ` : ""}{item.city}, {item.state} - {item.postalCode}
                  </Text>
                </View>
                {item.isDefault && (
                  <MaterialCommunityIcons name="check-circle" size={18} color="#ff6b00" />
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </Card>

      {/* Payments Section */}
      <Text style={styles.sectionTitle}>Payment Methods</Text>
      <Card style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert("Saved Cards", "Mock payment methods - no real card saved.")}
        >
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons name="credit-card-outline" size={22} color="#4caf50" />
            <Text style={styles.menuItemText}>Saved Cards</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#bbb" />
        </TouchableOpacity>

        <Divider style={styles.menuDivider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Alert.alert("Google Pay", "Google Pay is linked (mock).")}
        >
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons name="google" size={20} color="#4285f4" style={{ marginRight: 2 }} />
            <Text style={styles.menuItemText}>Google Pay / UPI</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#bbb" />
        </TouchableOpacity>
      </Card>

      {/* Logout Action Button */}
      <Button
        mode="outlined"
        onPress={() => dispatch(logout())}
        textColor="#d32f2f"
        style={styles.logoutButton}
        icon="logout"
      >
        Logout Account
      </Button>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile Info</Text>
            <Divider style={styles.modalDivider} />

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number (10 digits)"
              keyboardType="numeric"
              maxLength={10}
            />

            <View style={styles.modalButtons}>
              <Button
                mode="text"
                onPress={() => setEditModalVisible(false)}
                textColor="#666"
                style={styles.modalCancel}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveProfile}
                buttonColor="#ff6b00"
                style={styles.modalSave}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    backgroundColor: "#eee",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  profileEmail: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  profilePhone: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  editIconBtn: {
    margin: 0,
  },
  menuCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    marginBottom: 20,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  menuDivider: {
    backgroundColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginLeft: 4,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    marginBottom: 20,
    overflow: "hidden",
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  defaultAddressItem: {
    backgroundColor: "#fffdfa",
  },
  addressIcon: {
    marginRight: 12,
  },
  addressInfoCol: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  defaultAddressLabel: {
    color: "#ff6b00",
  },
  addressText: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
  logoutButton: {
    borderColor: "#d32f2f",
    borderRadius: 10,
    marginTop: 12,
    paddingVertical: 4,
    borderWidth: 1.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },
  modalDivider: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  modalCancel: {
    marginRight: 8,
  },
  modalSave: {
    borderRadius: 8,
    paddingHorizontal: 12,
  },
});

export default ProfileScreen;
