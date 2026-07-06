import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { geocodeAsync, reverseGeocodeAsync } from "../../utils/locationHelper";

const { width } = Dimensions.get("window");

const POPULAR_SUGGESTIONS = [
  {
    id: "baramati-city",
    name: "Baramati City Center",
    description: "Main City Area, Baramati",
    latitude: 18.1529,
    longitude: 74.5818,
    city: "Baramati",
    line1: "City Center",
    line2: "Baramati",
  },
  {
    id: "baramati-midc",
    name: "MIDC Baramati",
    description: "Industrial Area, Baramati",
    latitude: 18.1750,
    longitude: 74.6100,
    city: "Baramati",
    line1: "MIDC",
    line2: "Baramati",
  },
  {
    id: "bhigwan-rd",
    name: "Bhigwan Road",
    description: "Bhigwan Road, Baramati",
    latitude: 18.1480,
    longitude: 74.5920,
    city: "Baramati",
    line1: "Bhigwan Road",
    line2: "Baramati",
  },
  {
    id: "malegaon",
    name: "Malegaon",
    description: "Malegaon, Baramati",
    latitude: 18.1200,
    longitude: 74.5300,
    city: "Baramati",
    line1: "Malegaon",
    line2: "Baramati",
  },
  {
    id: "tandulwadi",
    name: "Tandulwadi",
    description: "Tandulwadi, Baramati",
    latitude: 18.1600,
    longitude: 74.5600,
    city: "Baramati",
    line1: "Tandulwadi",
    line2: "Baramati",
  },
  {
    id: "railway-station",
    name: "Railway Station",
    description: "Baramati Railway Station",
    latitude: 18.1550,
    longitude: 74.5850,
    city: "Baramati",
    line1: "Railway Station",
    line2: "Baramati",
  },
  {
    id: "college-rd",
    name: "College Road",
    description: "College Road, Baramati",
    latitude: 18.1620,
    longitude: 74.5780,
    city: "Baramati",
    line1: "College Road",
    line2: "Baramati",
  },
];

const ChooseLocationScreen = ({ onSelectLocation, onUseCurrentLocation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Filter matching local suggestions or generate a dynamic search suggestion
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return POPULAR_SUGGESTIONS;
    }

    const filtered = POPULAR_SUGGESTIONS.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Always add a dynamic "Search in Map" option at the top if the user typed something
    return [
      {
        id: "dynamic-search",
        name: `Search for "${searchQuery}"`,
        description: "Find this address via Map Geocoder",
        isDynamic: true,
      },
      ...filtered,
    ];
  }, [searchQuery]);

  const handleSelectItem = async (item) => {
    if (item.isDynamic) {
      setLoading(true);
      try {
        // Geocode the search string to get real coordinates
        const geocoded = await geocodeAsync(searchQuery);
        if (geocoded && geocoded.length > 0) {
          const { latitude, longitude } = geocoded[0];
          
          // Reverse geocode to get city name
          const reverse = await reverseGeocodeAsync(latitude, longitude);
          const place = reverse?.[0] || {};

          const customAddress = {
            label: "Searched Location",
            line1: place.name || searchQuery,
            line2: place.district || place.subregion || "",
            city: place.city || place.subregion || "",
            state: place.region || "",
            postalCode: place.postalCode || "",
            country: place.country || "India",
            latitude,
            longitude,
          };

          onSelectLocation(customAddress);
        } else {
          alert("Location not found. Please try searching for a different area.");
        }
      } catch (err) {
        alert("Failed to find location. Please check your internet connection.");
      } finally {
        setLoading(false);
      }
    } else {
      // Selected a predefined location with coordinates
      const selectedAddress = {
        label: "Selected Location",
        line1: item.line1,
        line2: item.line2,
        city: item.city,
        state: "Maharashtra",
        postalCode: "",
        country: "India",
        latitude: item.latitude,
        longitude: item.longitude,
      };
      onSelectLocation(selectedAddress);
    }
  };

  const handleGPSPress = async () => {
    setGpsLoading(true);
    try {
      await onUseCurrentLocation();
    } finally {
      setGpsLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectItem(item)}
      disabled={loading || gpsLoading}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={item.isDynamic ? "magnify" : "map-marker-outline"}
          size={22}
          color={item.isDynamic ? "#FF6F61" : "#475467"}
        />
      </View>
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.suggestionName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.suggestionDescription} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#D0D5DD" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose your delivery location</Text>
        <Text style={styles.subtitle}>
          Select your delivery location to see restaurants available in your area.
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBarWrapper}>
          <MaterialCommunityIcons
            name="magnify"
            size={22}
            color="#98A2B3"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for area, street or landmark"
            placeholderTextColor="#98A2B3"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Use Current Location Button */}
      <TouchableOpacity
        style={styles.gpsButton}
        onPress={handleGPSPress}
        disabled={loading || gpsLoading}
      >
        {gpsLoading ? (
          <ActivityIndicator size="small" color="#FF6F61" style={styles.gpsIcon} />
        ) : (
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={20}
            color="#FF6F61"
            style={styles.gpsIcon}
          />
        )}
        <View style={styles.gpsTextContainer}>
          <Text style={styles.gpsTitle}>Use Current Location</Text>
          <Text style={styles.gpsSubtitle}>Enable GPS location access</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#D0D5DD" />
      </TouchableOpacity>

      {/* Loader */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>Locating address...</Text>
        </View>
      )}

      {/* List Header */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>
          {searchQuery.trim() ? "Search Results" : "Popular Locations"}
        </Text>
      </View>

      {/* Autocomplete suggestions */}
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 24 : 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1D2939",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: "#667085",
    lineHeight: 18,
    marginTop: 6,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderColor: "#EAECF0",
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14.5,
    fontWeight: "600",
    color: "#1D2939",
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F2F4F7",
  },
  gpsIcon: {
    marginRight: 14,
  },
  gpsTextContainer: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#FF6F61",
  },
  gpsSubtitle: {
    fontSize: 11.5,
    color: "#98A2B3",
    marginTop: 2,
  },
  listHeaderRow: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#F2F4F7",
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#667085",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  listContent: {
    paddingBottom: 24,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#344054",
  },
  suggestionDescription: {
    fontSize: 12,
    color: "#667085",
    marginTop: 2,
  },
  loadingOverlay: {
    position: "absolute",
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#667085",
    marginTop: 10,
  },
});

export default ChooseLocationScreen;
