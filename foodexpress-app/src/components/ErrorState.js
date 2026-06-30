import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ErrorState = ({
  title = "Connection Error",
  description = "Something went wrong while connecting to the server. Please check your internet connection and try again.",
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#D92D20" />
      </View>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        {description}
      </Text>
      {onRetry && (
        <Button
          mode="contained"
          onPress={onRetry}
          style={styles.button}
          labelStyle={styles.buttonText}
          icon="reload"
        >
          Try Again
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: "#FEE4E2",
    elevation: 2,
    shadowColor: "#D92D20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE4E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
    color: "#B42318",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    color: "#667085",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#D92D20",
    borderRadius: 24,
    paddingHorizontal: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default ErrorState;
