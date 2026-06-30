import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, Snackbar, Portal, Dialog, TextInput, Checkbox } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppTextInput from "../../components/AppTextInput";
import AppButton from "../../components/AppButton";
import { login } from "../../redux/slices/authSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const LoginScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  // Forgot Password Dialog
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  // Load remembered credentials
  useEffect(() => {
    const loadSavedCreds = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("foodexpress_remembered_user");
        const savedRemember = await AsyncStorage.getItem("foodexpress_remember_me");
        if (savedUser && savedRemember === "true") {
          setEmailOrPhone(savedUser);
          setRememberMe(true);
        }
      } catch (err) {
        console.log("Error loading remembered credentials", err);
      }
    };
    loadSavedCreds();
  }, []);

  const validate = () => {
    let valid = true;
    if (!emailOrPhone.trim()) {
      setEmailError("Email or Mobile Number is required");
      valid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 4) {
      setPasswordError("Password must be at least 4 characters");
      valid = false;
    } else {
      setPasswordError("");
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    dispatch(login({ email: emailOrPhone, password }))
      .unwrap()
      .then(async (res) => {
        if (rememberMe) {
          await AsyncStorage.setItem("foodexpress_remembered_user", emailOrPhone);
          await AsyncStorage.setItem("foodexpress_remember_me", "true");
        } else {
          await AsyncStorage.removeItem("foodexpress_remembered_user");
          await AsyncStorage.setItem("foodexpress_remember_me", "false");
        }
        
        const redirectTo = route.params?.redirectTo;
        if (redirectTo) {
          if (redirectTo === "Main") {
            navigation.replace("Main", { screen: route.params.redirectTab });
          } else {
            navigation.replace("Main");
            setTimeout(() => {
              navigation.navigate(redirectTo, route.params.redirectParams || {});
            }, 100);
          }
        } else {
          navigation.replace("Main");
        }
      })
      .catch((err) => {
        const errorMsg = typeof err === "string" ? err : (err?.message || "Invalid credentials");
        setSnackbarMsg(errorMsg);
        setSnackbarVisible(true);
      });
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotMessage("Please enter your email address");
      return;
    }
    setForgotLoading(true);
    try {
      // Mock forgot password call
      setTimeout(() => {
        setForgotLoading(false);
        setForgotMessage("Password reset instructions sent to your email!");
      }, 1500);
    } catch (err) {
      setForgotLoading(false);
      setForgotMessage("Error sending reset email. Please try again.");
    }
  };

  return (
    <Portal.Host>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.brandText}>FoodExpress</Text>
          <Text style={styles.taglineText}>Fast. Fresh. Delivered.</Text>
        </View>

        <View style={styles.card}>
          <Text variant="headlineSmall" style={styles.title}>
            Welcome Back
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Login to order delicious meals from your favorite restaurants
          </Text>

          <AppTextInput
            label="Email or Mobile Number"
            value={emailOrPhone}
            onChangeText={(text) => {
              setEmailOrPhone(text);
              if (text) setEmailError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!emailError}
            left={<TextInput.Icon icon="account" />}
          />
          {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

          <AppTextInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (text) setPasswordError("");
            }}
            secureTextEntry={!showPassword}
            error={!!passwordError}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Checkbox
                status={rememberMe ? "checked" : "unchecked"}
                color="#22C55E"
                onPress={() => setRememberMe(!rememberMe)}
              />
              <Text style={styles.rememberMeText}>Remember Me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              setForgotEmail("");
              setForgotMessage("");
              setForgotVisible(true);
            }}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <AppButton
            loading={auth.loading}
            onPress={handleLogin}
            style={styles.loginBtn}
            contentStyle={{ paddingVertical: 6 }}
            buttonColor="#22C55E"
            textColor="#fff"
          >
            Login
          </AppButton>

          <View style={styles.registerRow}>
            <Text style={styles.noAccountText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
            <MaterialCommunityIcons name="google" size={24} color="#db4437" />
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialButton, styles.fbButton]}>
            <MaterialCommunityIcons name="facebook" size={24} color="#4267b2" />
            <Text style={styles.socialButtonText}>Facebook</Text>
          </TouchableOpacity>
        </View>

        {/* Forgot Password Dialog */}
        <Portal>
          <Dialog visible={forgotVisible} onDismiss={() => setForgotVisible(false)}>
            <Dialog.Title>Reset Password</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogSubtitle}>
                Enter your email address and we'll send you instructions to reset your password.
              </Text>
              <TextInput
                mode="outlined"
                label="Email Address"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.dialogInput}
                activeOutlineColor="#22C55E"
              />
              {!!forgotMessage && (
                <Text style={forgotMessage.includes("sent") ? styles.successDialogText : styles.errorText}>
                  {forgotMessage}
                </Text>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <AppButton mode="text" onPress={() => setForgotVisible(false)} textColor="#666">
                Cancel
              </AppButton>
              <AppButton
                loading={forgotLoading}
                onPress={handleForgotPassword}
                textColor="#22C55E"
              >
                Send
              </AppButton>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: "Dismiss",
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMsg}
        </Snackbar>
      </ScrollView>
    </Portal.Host>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  brandText: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#22C55E",
    letterSpacing: 1,
  },
  taglineText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginLeft: 4,
    marginTop: -2,
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeText: {
    fontSize: 13,
    color: "#555",
    marginLeft: 2,
  },
  forgotText: {
    fontSize: 13,
    color: "#22C55E",
    fontWeight: "600",
  },
  loginBtn: {
    marginTop: 16,
    borderRadius: 8,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  noAccountText: {
    fontSize: 14,
    color: "#666",
  },
  registerLink: {
    fontSize: 14,
    color: "#22C55E",
    fontWeight: "bold",
    marginLeft: 6,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    fontSize: 12,
    color: "#aaa",
    paddingHorizontal: 12,
    fontWeight: "600",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  socialButton: {
    flex: 0.48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  googleButton: {},
  fbButton: {},
  socialButtonText: {
    marginLeft: 8,
    fontWeight: "600",
    color: "#444",
  },
  dialogSubtitle: {
    color: "#555",
    marginBottom: 16,
    lineHeight: 20,
  },
  dialogInput: {
    backgroundColor: "#fff",
  },
  successDialogText: {
    color: "#2e7d32",
    fontSize: 13,
    marginTop: 8,
    fontWeight: "500",
  },
});

export default LoginScreen;
