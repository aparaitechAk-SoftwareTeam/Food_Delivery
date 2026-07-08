import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Text, Button, IconButton, Divider, ActivityIndicator } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import * as Location from "expo-location";
import {
  fetchAddresses,
  saveAddress,
  setActiveAddress,
  selectDefaultAddress,
} from "../redux/slices/authSlice";
import { reverseGeocodeAsync } from "../utils/locationHelper";

const LocationBottomSheet = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const { addresses, activeAddress, token } = useSelector((state) => state.auth);
  
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // New address form state
  const [label, setLabel] = useState("Home");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  
  useEffect(() => {
    if (token) {
      dispatch(fetchAddresses());
    }
  }, [dispatch, token]);

  // GPS Current Location Fetching
  const handleUseGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to detect your location automatically."
        );
        setGpsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      
      // Reverse geocoding to address
      const geocoded = await reverseGeocodeAsync(latitude, longitude);

      if (geocoded && geocoded.length > 0) {
        const place = geocoded[0];
        const gpsAddress = {
          label: "Current Location",
          line1: place.name || `${place.streetNumber || ""} ${place.street || ""}`,
          line2: place.district || place.subregion || "",
          city: place.city || place.subregion || "",
          state: place.region || "",
          postalCode: place.postalCode || "",
          country: place.country || "India",
          latitude,
          longitude,
        };
        
        // Update active address
        dispatch(setActiveAddress(gpsAddress));
        onClose();
      } else {
        throw new Error("Could not resolve address coordinates.");
      }
    } catch (error) {
      // Fallback geocoding mock address
      const dummyGpsAddress = {
        label: "GPS Location",
        line1: "Mahila Society",
        line2: "Baramati",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "413102",
        country: "India",
      };
      dispatch(setActiveAddress(dummyGpsAddress));
      onClose();
    } finally {
      setGpsLoading(false);
    }
  };

  // Manual search mock results
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    
    // Simple mock search results based on query
    const isQueryBaramati = searchQuery.toLowerCase().includes("baramati");
    const results = [
      {
        id: "s1",
        label: "Search Result",
        line1: isQueryBaramati ? "MIDC Road" : searchQuery,
        line2: isQueryBaramati ? "MIDC Baramati" : "Baramati Road",
        city: isQueryBaramati ? "Baramati" : "Pune",
        state: "Maharashtra",
        postalCode: isQueryBaramati ? "413133" : "411001",
        country: "India",
        latitude: isQueryBaramati ? 18.1750 : 18.5204,
        longitude: isQueryBaramati ? 74.6100 : 73.8567,
      },
      {
        id: "s2",
        label: "Search Result 2",
        line1: isQueryBaramati ? "College Road" : `${searchQuery} Plaza`,
        line2: isQueryBaramati ? "Vidyanagar" : "Senapati Bapat Rd",
        city: isQueryBaramati ? "Baramati" : "Pune",
        state: "Maharashtra",
        postalCode: isQueryBaramati ? "413102" : "411016",
        country: "India",
        latitude: isQueryBaramati ? 18.1620 : 18.5204,
        longitude: isQueryBaramati ? 74.5780 : 73.8567,
      }
    ];
    setSearchResults(results);
  }, [searchQuery]);

  const handleSelectAddress = (addr) => {
    dispatch(setActiveAddress(addr));
    onClose();
  };

  const handleSaveAddress = () => {
    if (!line1 || !city || !postalCode) {
      Alert.alert("Missing Fields", "Please fill in Address Line 1, City, and Postal Code.");
      return;
    }
    
    const newAddr = {
      label,
      line1,
      line2,
      city,
      state: stateName,
      postalCode,
      country: "India",
      isDefault: addresses.length === 0, // make default if it is first address
    };
    
    dispatch(saveAddress(newAddr));
    setIsAddingNew(false);
    
    // clear form
    setLine1("");
    setLine2("");
    setCity("");
    setStateName("");
    setPostalCode("");
  };

  const renderAddressItem = ({ item }) => {
    const isSelected = activeAddress && 
      (activeAddress._id === item._id || activeAddress.line1 === item.line1);
      
    return (
      <TouchableOpacity
        style={[styles.addressItem, isSelected && styles.selectedAddressItem]}
        onPress={() => handleSelectAddress(item)}
      >
        <IconButton
          icon={item.label === "Home" ? "home" : item.label === "Work" ? "briefcase" : "map-marker"}
          iconColor={isSelected ? "#22C55E" : "#666"}
          size={24}
        />
        <View style={styles.addressInfo}>
          <Text style={[styles.addressLabel, isSelected && styles.selectedText]}>
            {item.label} {item.isDefault && "(Default)"}
          </Text>
          <Text style={styles.addressSubtext} numberOfLines={2}>
            {item.line1}, {item.line2 ? `${item.line2}, ` : ""}{item.city}, {item.state} - {item.postalCode}
          </Text>
        </View>
        {isSelected && (
          <IconButton icon="check-circle" iconColor="#22C55E" size={20} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={styles.sheetContainer}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Select Delivery Location</Text>
            <IconButton icon="close" onPress={onClose} size={24} />
          </View>
          
          <Divider style={styles.divider} />
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {!isAddingNew ? (
              <>
                <Button
                  mode="contained"
                  icon="crosshairs-gps"
                  onPress={handleUseGPS}
                  loading={gpsLoading}
                  buttonColor="#22C55E"
                  style={styles.gpsButton}
                >
                  Use Current Location (GPS)
                </Button>
                
                <View style={styles.searchSection}>
                  <Text style={styles.subHeader}>Search Manually</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter street, building, or city..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectAddress(item)}
                    >
                      <IconButton icon="map-marker-outline" size={20} />
                      <Text style={styles.resultText}>
                        {item.line1}, {item.line2}, {item.city}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.savedSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.subHeader}>Saved Addresses</Text>
                    <Button
                      mode="text"
                      compact
                      onPress={() => setIsAddingNew(true)}
                      textColor="#22C55E"
                    >
                      + Add New
                    </Button>
                  </View>
                  
                  {addresses.length === 0 ? (
                    <Text style={styles.emptyText}>No saved addresses yet.</Text>
                  ) : (
                    <FlatList
                      data={addresses}
                      keyExtractor={(item) => (item._id || item.id || Math.random().toString()).toString()}
                      renderItem={renderAddressItem}
                      scrollEnabled={false}
                    />
                  )}
                </View>
              </>
            ) : (
              <View style={styles.formContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.subHeader}>Add New Address</Text>
                  <Button
                    mode="text"
                    compact
                    onPress={() => setIsAddingNew(false)}
                    textColor="#666"
                  >
                    Cancel
                  </Button>
                </View>
                
                <Text style={styles.labelTitle}>Address Tag</Text>
                <View style={styles.tagContainer}>
                  {["Home", "Work", "Other"].map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagButton,
                        label === tag && styles.tagButtonActive,
                      ]}
                      onPress={() => setLabel(tag)}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          label === tag && styles.tagTextActive,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TextInput
                  style={styles.formInput}
                  placeholder="Flat/House No., Building Name *"
                  value={line1}
                  onChangeText={setLine1}
                />
                <TextInput
                  style={styles.formInput}
                  placeholder="Street name, Area, Locality"
                  value={line2}
                  onChangeText={setLine2}
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.formInput, styles.halfInput]}
                    placeholder="City *"
                    value={city}
                    onChangeText={setCity}
                  />
                  <TextInput
                    style={[styles.formInput, styles.halfInput]}
                    placeholder="State"
                    value={stateName}
                    onChangeText={setStateName}
                  />
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder="Postal Code (Pincode) *"
                  value={postalCode}
                  keyboardType="numeric"
                  onChangeText={postalCode => setPostalCode(postalCode)}
                />
                
                <Button
                  mode="contained"
                  onPress={handleSaveAddress}
                  buttonColor="#22C55E"
                  style={styles.saveButton}
                >
                  Save Address
                </Button>
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  divider: {
    backgroundColor: "#eee",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  gpsButton: {
    borderRadius: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  searchSection: {
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fafafa",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultText: {
    fontSize: 14,
    color: "#555",
    flex: 1,
  },
  savedSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    paddingVertical: 16,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "#fcfcfc",
  },
  selectedAddressItem: {
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  },
  addressInfo: {
    flex: 1,
    marginLeft: 4,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  selectedText: {
    color: "#16A34A",
  },
  addressSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  formContainer: {
    marginBottom: 20,
  },
  labelTitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f3f3",
    marginRight: 10,
  },
  tagButtonActive: {
    backgroundColor: "#22C55E",
  },
  tagText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },
  tagTextActive: {
    color: "#fff",
  },
  formInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  saveButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 6,
  },
});

export default LocationBottomSheet;
