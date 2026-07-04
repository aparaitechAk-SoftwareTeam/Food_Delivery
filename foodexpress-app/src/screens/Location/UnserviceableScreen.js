import React, { useState } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from "react-native";
import { Text, Button, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import * as Location from "expo-location";
import { setActiveAddress } from "../../redux/slices/authSlice";
import { isOutsideBaramati } from "../../utils/locationHelper";
import LocationBottomSheet from "../../components/LocationBottomSheet";
import api from "../../utils/api";

const { width } = Dimensions.get("window");

const UnserviceableScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { activeAddress } = useSelector((state) => state.auth);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const detectedLocationName = activeAddress
    ? `${activeAddress.line1 || ""}, ${activeAddress.city || ""}`
    : "No Location Selected";

  // ─── Button Actions ────────────────────────────────────────────────────────

  const handleRequestArea = async () => {
    try {
      await api.post("/users/request-area", {
        address: activeAddress,
      });
      Alert.alert("Request Received", "Thank you! We've noted your interest in expanding to your area.");
    } catch (_) {
      Alert.alert("Request Received", "Thank you! We've registered your request to launch in your area.");
    }
  };

  const handleNeedHelp = () => {
    Alert.alert(
      "Need Help?",
      "Our support team is available 24/7. Contact us at support@foodexpress.com or call +91 98765 43210.",
      [
        { text: "Call Support", onPress: () => Linking.openURL("tel:+919876543210") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleRetryLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to detect your location automatically."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });

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
        };

        dispatch(setActiveAddress(gpsAddress));

        const isOutside = isOutsideBaramati(gpsAddress);
        if (!isOutside) {
          Alert.alert("Location Found", "Welcome to Baramati! Restoring access to the app.");
          navigation.replace("Main");
        } else {
          Alert.alert(
            "Service Unavailable",
            `We detected you are in "${gpsAddress.city || "this city"}" which is outside our delivery zone (Baramati).`
          );
        }
      }
    } catch (error) {
      Alert.alert("Location Error", "Could not fetch GPS location. Please try again or change location manually.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleFollowInstagram = () => {
    Linking.openURL("https://instagram.com/foodexpress_app_demo").catch(() => {
      Alert.alert("Instagram", "Follow us on Instagram: @foodexpress_app");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Unserviceable area</Text>
          <TouchableOpacity style={styles.locationSelector} onPress={() => setSheetVisible(true)}>
            <MaterialCommunityIcons name="near-me" size={13} color="#D92D20" style={{ marginRight: 2 }} />
            <Text style={styles.locationText} numberOfLines={1}>
              {detectedLocationName}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="#667085" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.avatarButton}>
          <MaterialCommunityIcons name="account-circle-outline" size={28} color="#475467" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Collage Illustration of Food Cards */}
        <View style={styles.collageContainer}>
          {/* Left card */}
          <View style={[styles.collageCard, styles.collageCardLeft]}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300" }}
              style={styles.collageImage}
              resizeMode="cover"
            />
          </View>
          {/* Right card */}
          <View style={[styles.collageCard, styles.collageCardRight]}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1603133872878-68550a5e7b64?w=300" }}
              style={styles.collageImage}
              resizeMode="cover"
            />
          </View>
          {/* Center card */}
          <View style={[styles.collageCard, styles.collageCardCenter]}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=300" }}
              style={styles.collageImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* COMING SOON text section */}
        <View style={styles.comingSoonTextCol}>
          <Text style={styles.comingSoonLabel}>COMING SOON</Text>
          <View style={styles.toYourRow}>
            <Text style={styles.comingSoonLabel}>TO YOUR</Text>
            <MaterialCommunityIcons name="moped" size={20} color="#039855" style={{ marginLeft: 6 }} />
          </View>
          <Text style={styles.doorstepText}>DOORSTEP</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            mode="contained"
            onPress={handleRequestArea}
            buttonColor="#039855" // Swish Green
            style={styles.primaryBtn}
            labelStyle={styles.primaryBtnLabel}
          >
            Request FoodExpress in your area
          </Button>

          <View style={styles.linksRow}>
            <TouchableOpacity onPress={handleNeedHelp}>
              <Text style={styles.helpLink}>Need help?</Text>
            </TouchableOpacity>
            <View style={styles.bullet} />
            <TouchableOpacity onPress={handleRetryLocation} disabled={gpsLoading}>
              <Text style={styles.helpLink}>{gpsLoading ? "Checking..." : "Retry Location"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom Live Area & Socials */}
      <View style={styles.footer}>
        <Text style={styles.liveLabel}>We're Currently Live In</Text>
        <Text style={styles.liveRegions}>Baramati City  •  MIDC  •  Vidyanagar  •  Bhigwan Road</Text>
        
        <TouchableOpacity style={styles.instagramBtn} onPress={handleFollowInstagram}>
          <Text style={styles.instagramBtnText}>Follow us on Instagram</Text>
        </TouchableOpacity>
      </View>

      {/* Manual location selector bottom sheet */}
      <LocationBottomSheet
        visible={sheetVisible}
        onClose={() => {
          setSheetVisible(false);
          const isOutside = isOutsideBaramati(activeAddress);
          if (!isOutside) {
            navigation.replace("Main");
          }
        }}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 16 : 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1F2A37",
    letterSpacing: -0.3,
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#4B5563",
    maxWidth: width * 0.6,
    marginRight: 2,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  collageContainer: {
    width: 280,
    height: 170,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  collageCard: {
    width: 110,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#FFF",
    overflow: "hidden",
    position: "absolute",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  collageCardLeft: {
    left: 10,
    transform: [{ rotate: "-12deg" }],
    zIndex: 1,
    opacity: 0.85,
  },
  collageCardRight: {
    right: 10,
    transform: [{ rotate: "12deg" }],
    zIndex: 1,
    opacity: 0.85,
  },
  collageCardCenter: {
    width: 120,
    height: 135,
    zIndex: 2,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  collageImage: {
    width: "100%",
    height: "100%",
  },
  comingSoonTextCol: {
    alignItems: "center",
    marginBottom: 24,
  },
  comingSoonLabel: {
    fontSize: 22,
    fontWeight: "900",
    color: "#9CA3AF",
    letterSpacing: 0.8,
  },
  toYourRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  doorstepText: {
    fontSize: 30,
    fontWeight: "950",
    color: "#039855",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  buttonsContainer: {
    width: "100%",
    alignItems: "center",
  },
  primaryBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 2,
  },
  primaryBtnLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  helpLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B5563",
    textDecorationLine: "underline",
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#9CA3AF",
    marginHorizontal: 12,
  },
  footer: {
    width: "100%",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    paddingTop: 12,
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  liveRegions: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#4B5563",
    marginTop: 6,
    marginBottom: 18,
    textAlign: "center",
  },
  instagramBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  instagramBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#EC4899", // Instagram Pink
  },
});

export default UnserviceableScreen;
