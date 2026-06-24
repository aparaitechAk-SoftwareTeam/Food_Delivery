import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Snackbar } from "react-native-paper";
import AppTextInput from "../../components/AppTextInput";
import AppButton from "../../components/AppButton";
import authService from "../../services/authService";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      setMessage(response.message || "Please check your email.");
      setVisible(true);
    } catch (error) {
      setMessage(error?.message || String(error) || "An error occurred");
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Forgot password
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Enter your email to receive reset instructions.
      </Text>
      <AppTextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AppButton loading={loading} onPress={handleSubmit}>
        Send reset link
      </AppButton>
      <AppButton mode="text" onPress={() => navigation.goBack()}>
        Back to Login
      </AppButton>
      <Snackbar visible={visible} onDismiss={() => setVisible(false)}>
        {message}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
    color: "#666",
  },
});

export default ForgotPasswordScreen;
