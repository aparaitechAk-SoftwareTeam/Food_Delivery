import React, { useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../constants/ThemeContext";

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  onVoicePress,
  onScanPress,
  onSubmit,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { isDark, theme } = useThemeContext();

  const recentSearches = ["Pizza", "Chicken Biryani", "Burger", "Misal Pav"];
  const trendingSearches = [
    { name: "Healthy Salad", icon: "🥗" },
    { name: "Mocktails", icon: "🍹" },
    { name: "Desserts", icon: "🍰" },
    { name: "South Indian Special", icon: "🥞" }
  ];

  const handleVoicePress = () => {
    if (onVoicePress) {
      onVoicePress();
    } else {
      Alert.alert("Voice Search", "Listening for your food cravings... (Voice Recognition Simulation Active)");
    }
  };

  const handleScanPress = () => {
    if (onScanPress) {
      onScanPress();
    } else {
      Alert.alert("QR Scanner", "Scanning QR code coupon... (QR Reader Simulation Active)");
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={[
        styles.container, 
        { backgroundColor: isFocused ? theme.colors.surface : theme.colors.inputBg, borderColor: isFocused ? theme.colors.primary : theme.colors.border }
      ]}>
        <MaterialCommunityIcons name="magnify" size={22} color={isFocused ? theme.colors.primary : theme.colors.placeholder} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search foods, restaurants, cuisines..."
          placeholderTextColor={theme.colors.placeholder}
          style={[styles.input, { color: theme.colors.text }]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onSubmitEditing={onSubmit}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.placeholder} style={styles.rightIcon} />
          </TouchableOpacity>
        ) : (
          <View style={styles.rightIconsWrapper}>
            <TouchableOpacity onPress={handleVoicePress}>
              <MaterialCommunityIcons name="microphone" size={20} color={theme.colors.primary} style={styles.rightIcon} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleScanPress}>
              <MaterialCommunityIcons name="qrcode-scan" size={18} color={theme.colors.placeholder} style={styles.rightIcon} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Floating Suggestions list when focused */}
      {isFocused && (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {/* Recent Searches */}
            <Text style={[styles.sectionTitle, { color: theme.colors.subtext }]}>Recent Searches</Text>
            <View style={styles.chipRow}>
              {recentSearches.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.chip, { backgroundColor: theme.colors.chipBg }]}
                  onPress={() => {
                    setSearchQuery(item);
                    if (onSubmit) onSubmit();
                  }}
                >
                  <MaterialCommunityIcons name="history" size={14} color={theme.colors.subtext} style={{ marginRight: 4 }} />
                  <Text style={[styles.chipText, { color: theme.colors.text }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Trending Searches */}
            <Text style={[styles.sectionTitle, { marginTop: 16, color: theme.colors.subtext }]}>Trending Near You</Text>
            <View style={styles.trendingRow}>
              {trendingSearches.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.trendingItem}
                  onPress={() => {
                    setSearchQuery(item.name);
                    if (onSubmit) onSubmit();
                  }}
                >
                  <Text style={styles.trendingEmoji}>{item.icon}</Text>
                  <Text style={[styles.trendingText, { color: theme.colors.text }]}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    zIndex: 99,
    position: "relative",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
    marginHorizontal: 16,
    marginVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  rightIconsWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightIcon: {
    marginLeft: 12,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    maxHeight: 250,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
  },
  trendingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  trendingItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    paddingVertical: 8,
  },
  trendingEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  trendingText: {
    fontSize: 13,
  },
});

export default SearchBar;
