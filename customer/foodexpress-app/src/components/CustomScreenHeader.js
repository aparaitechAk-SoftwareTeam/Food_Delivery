import React from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../constants/ThemeContext";

const CustomScreenHeader = ({ title, navigation, showBack = true, rightAction, redirectToHome = false }) => {
  const { theme } = useThemeContext();

  const handleBack = () => {
    if (redirectToHome && navigation) {
      navigation.navigate("Main", { screen: "Home" });
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const shouldShowBack = showBack && navigation && (navigation.canGoBack() || redirectToHome);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.headerBg, borderBottomColor: theme.colors.border }]}>
      <View style={styles.headerContainer}>
        {shouldShowBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.titleContainer}>
          <Text numberOfLines={1} style={[styles.titleText, { color: theme.colors.text }]}>
            {title}
          </Text>
        </View>

        {rightAction ? (
          <View style={styles.rightActionContainer}>{rightAction}</View>
        ) : (
          <View style={styles.rightPlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    borderBottomWidth: 1,
  },
  headerContainer: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  backPlaceholder: {
    width: 44,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  rightActionContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -8,
  },
  rightPlaceholder: {
    width: 44,
  },
});

export default CustomScreenHeader;
