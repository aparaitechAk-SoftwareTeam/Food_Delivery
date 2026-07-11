import React, { useState, useEffect } from "react";
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
  Switch,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import {
  logout,
  fetchUserProfile,
  updateUserProfile,
  selectDefaultAddress,
  saveAddress,
  updateAddress,
  deleteAddress,
} from "../../redux/slices/authSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { openWhatsAppSupport } from "../../utils/whatsappHelper";

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { userProfile, addresses } = useSelector((state) => state.auth);
  const { items: wishlistFoods } = useSelector((state) => state.wishlist);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      dispatch(fetchUserProfile());
    });
    return unsubscribe;
  }, [navigation, dispatch]);

  // Edit Profile States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Address CRUD States
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); // null means adding new
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPostalCode, setAddrPostalCode] = useState("");
  const [addrCountry, setAddrCountry] = useState("India");
  const [addrIsDefault, setAddrIsDefault] = useState(false);

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

  const handleOpenAddressModal = (addressItem = null) => {
    if (addressItem) {
      // Editing
      setEditingAddressId(addressItem._id || addressItem.id);
      setAddrLabel(addressItem.label || "Home");
      setAddrLine1(addressItem.line1 || "");
      setAddrLine2(addressItem.line2 || "");
      setAddrCity(addressItem.city || "");
      setAddrState(addressItem.state || "");
      setAddrPostalCode(addressItem.postalCode || "");
      setAddrCountry(addressItem.country || "India");
      setAddrIsDefault(!!addressItem.isDefault);
    } else {
      // Adding new
      setEditingAddressId(null);
      setAddrLabel("Home");
      setAddrLine1("");
      setAddrLine2("");
      setAddrCity("Baramati");
      setAddrState("Maharashtra");
      setAddrPostalCode("413102");
      setAddrCountry("India");
      setAddrIsDefault(addresses.length === 0); // Default if first
    }
    setAddressModalVisible(true);
  };

  const handleSaveAddress = () => {
    if (!addrLine1 || !addrCity || !addrPostalCode) {
      Alert.alert("Error", "Line 1, City, and Postal Code are required.");
      return;
    }

    const payload = {
      label: addrLabel,
      line1: addrLine1,
      line2: addrLine2,
      city: addrCity,
      state: addrState,
      postalCode: addrPostalCode,
      country: addrCountry,
      isDefault: addrIsDefault,
    };

    if (editingAddressId) {
      // Edit
      dispatch(updateAddress({ addressId: editingAddressId, address: payload }));
    } else {
      // Add
      dispatch(saveAddress(payload));
    }
    setAddressModalVisible(false);
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to remove this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            dispatch(deleteAddress(addressId));
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    dispatch(logout()).then(() => {
      Alert.alert("Success", "Logged out successfully!");
      navigation.navigate("Home");
    });
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
      <View style={styles.addressHeaderRow}>
        <Text style={styles.sectionTitle}>Saved Addresses</Text>
        <TouchableOpacity
          style={styles.addAddressLink}
          onPress={() => handleOpenAddressModal(null)}
        >
          <MaterialCommunityIcons name="plus" size={16} color="#ff6b00" />
          <Text style={styles.addAddressLinkText}>ADD NEW</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.sectionCard}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved addresses yet. Add one to checkout.</Text>
          </View>
        ) : (
          addresses.map((item, index) => (
            <View key={item._id || item.id}>
              {index > 0 && <Divider />}
              <View style={[styles.addressItemRow, item.isDefault && styles.defaultAddressItem]}>
                <TouchableOpacity
                  style={styles.addressItemLeft}
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
                </TouchableOpacity>

                <View style={styles.addressActions}>
                  <IconButton
                    icon="pencil-outline"
                    size={18}
                    iconColor="#ff6b00"
                    onPress={() => handleOpenAddressModal(item)}
                    style={styles.actionBtn}
                  />
                  <IconButton
                    icon="trash-can-outline"
                    size={18}
                    iconColor="#d32f2f"
                    onPress={() => handleDeleteAddress(item._id || item.id)}
                    style={styles.actionBtn}
                  />
                </View>
              </View>
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

      {/* Help & Support Section */}
      <Card style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => openWhatsAppSupport(userProfile)}
        >
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons name="headset" size={22} color="#ff6b00" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.menuItemTitleText}>Help & Support</Text>
              <Text style={styles.menuItemSubtitle}>Chat with our support team on WhatsApp</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#bbb" />
        </TouchableOpacity>
      </Card>

      {/* Logout Action Button */}
      <Button
        mode="outlined"
        onPress={handleLogout}
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

      {/* Add / Edit Address Modal */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingAddressId ? "Edit Address" : "Add New Address"}
            </Text>
            <Divider style={styles.modalDivider} />

            <Text style={styles.inputLabel}>Address Label</Text>
            <View style={styles.labelSelection}>
              {["Home", "Work", "Other"].map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, addrLabel === l && styles.activeLabelChip]}
                  onPress={() => setAddrLabel(l)}
                >
                  <Text style={[styles.labelChipText, addrLabel === l && styles.activeLabelChipText]}>
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Flat / Building / Area (Line 1)</Text>
            <TextInput
              style={styles.modalInput}
              value={addrLine1}
              onChangeText={setAddrLine1}
              placeholder="Flat No, Building Name, Street"
            />

            <Text style={styles.inputLabel}>Landmark / Locality (Line 2)</Text>
            <TextInput
              style={styles.modalInput}
              value={addrLine2}
              onChangeText={setAddrLine2}
              placeholder="Near Market Yard, City Center (Optional)"
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInputCol}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addrCity}
                  onChangeText={setAddrCity}
                  placeholder="City"
                />
              </View>
              <View style={styles.halfInputCol}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addrState}
                  onChangeText={setAddrState}
                  placeholder="State"
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={styles.halfInputCol}>
                <Text style={styles.inputLabel}>Postal Code</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addrPostalCode}
                  onChangeText={setAddrPostalCode}
                  placeholder="6-Digit PIN"
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
              <View style={styles.halfInputCol}>
                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addrCountry}
                  onChangeText={setAddrCountry}
                  placeholder="Country"
                />
              </View>
            </View>

            <View style={styles.defaultToggleRow}>
              <Text style={styles.defaultToggleLabel}>Set as Default Address</Text>
              <Switch
                value={addrIsDefault}
                onValueChange={setAddrIsDefault}
                color="#ff6b00"
              />
            </View>

            <View style={styles.modalButtons}>
              <Button
                mode="text"
                onPress={() => setAddressModalVisible(false)}
                textColor="#666"
                style={styles.modalCancel}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveAddress}
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
  addressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addAddressLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  addAddressLinkText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ff6b00",
    marginLeft: 4,
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
  addressItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  defaultAddressItem: {
    backgroundColor: "#fffdfa",
  },
  addressItemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
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
  addressActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  actionBtn: {
    margin: 0,
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
    width: "88%",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    maxHeight: "90%",
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
    height: 42,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    backgroundColor: "#f9f9f9",
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  modalCancel: {
    marginRight: 8,
  },
  modalSave: {
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  labelSelection: {
    flexDirection: "row",
    marginBottom: 14,
  },
  labelChip: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 10,
    backgroundColor: "#f9f9f9",
  },
  activeLabelChip: {
    borderColor: "#ff6b00",
    backgroundColor: "#fff5ee",
  },
  labelChipText: {
    fontSize: 12,
    color: "#666",
  },
  activeLabelChipText: {
    color: "#ff6b00",
    fontWeight: "bold",
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInputCol: {
    width: "48%",
  },
  defaultToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 12,
  },
  defaultToggleLabel: {
    fontSize: 13,
    color: "#444",
    fontWeight: "600",
  },
  menuItemTitleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
});

export default ProfileScreen;
