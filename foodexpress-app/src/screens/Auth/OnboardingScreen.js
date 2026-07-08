import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Button, Text, Avatar } from "react-native-paper";

const OnboardingScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Avatar.Icon size={240} icon="silverware-fork-knife" style={styles.image} />
    <Text variant="headlineLarge" style={styles.title}>
      Discover your favorite meals
    </Text>
    <Text variant="bodyMedium" style={styles.subtitle}>
      Browse restaurants, order quickly, and track delivery in real time.
    </Text>
    <Button
      mode="contained"
      onPress={() => navigation.replace("Login")}
      style={styles.button}
    >
      Get Started
    </Button>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  image: {
    width: 240,
    height: 240,
    marginBottom: 32,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    color: "#666",
  },
  button: {
    width: "100%",
    borderRadius: 12,
  },
});

export default OnboardingScreen;
