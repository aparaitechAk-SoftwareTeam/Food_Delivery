import React, { useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Text, Avatar } from "react-native-paper";

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // For quick demo: navigate to Main tabs so UI renders immediately.
    const timer = setTimeout(() => navigation.replace("Main"), 800);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Avatar.Text size={120} label="FE" style={styles.logo} />
      <Text variant="headlineLarge" style={styles.title}>
        FoodExpress
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Fast food delivery at your door.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 32,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
  },
});

export default SplashScreen;
