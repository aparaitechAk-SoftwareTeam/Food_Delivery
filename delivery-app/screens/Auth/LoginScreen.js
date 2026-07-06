import React, { useState, useContext } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Text, TextInput, Button, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../utils/api";
import { AuthContext } from "../../App";

const LoginScreen = () => {
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Required fields missing", "Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password: password.trim(),
      });

      const { token, user } = response.data;
      if (user.role !== "delivery") {
        Alert.alert("Access Denied", "Only registered delivery boy accounts can access this application.");
        return;
      }

      await AsyncStorage.setItem("rider_token", token);
      await AsyncStorage.setItem("rider_user", JSON.stringify(user));
      signIn();
    } catch (err) {
      Alert.alert("Login Failed", err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <View style={styles.brandBadge}>
            <MaterialCommunityIcons name="moped" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>FoodExpress</Text>
          <Text style={styles.brandSubtitle}>Rider Portal</Text>
        </View>

        <View style={styles.formSection}>
          <TextInput
            label="Rider Email"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            textColor="#FFFFFF"
            outlineColor="#2a3347"
            activeOutlineColor="#ff6b00"
            style={styles.input}
            disabled={loading}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            label="Password"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            textColor="#FFFFFF"
            outlineColor="#2a3347"
            activeOutlineColor="#ff6b00"
            secureTextEntry={secureText}
            right={
              <TextInput.Icon 
                icon={secureText ? "eye-off" : "eye"} 
                color="#667085"
                onPress={() => setSecureText(!secureText)} 
              />
            }
            style={styles.input}
            disabled={loading}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            buttonColor="#ff6b00"
            textColor="#FFFFFF"
            style={styles.loginBtn}
            labelStyle={styles.btnLabel}
          >
            {loading ? "Authenticating..." : "Rider Secure Sign In"}
          </Button>
        </View>

        <Text style={styles.footerText}>Protected by FoodExpress Security Protocols</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#ff6b00",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ff6b00",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 4,
  },
  formSection: {
    backgroundColor: "#161b26",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#222a3a",
  },
  input: {
    backgroundColor: "transparent",
    marginBottom: 16,
  },
  loginBtn: {
    borderRadius: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  btnLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  footerText: {
    fontSize: 10,
    color: "#475467",
    textAlign: "center",
    marginTop: 40,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

export default LoginScreen;
