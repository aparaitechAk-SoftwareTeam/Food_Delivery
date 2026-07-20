import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, BackHandler } from "react-native";
import { Text, Snackbar, Portal, Dialog, TextInput, Checkbox } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppTextInput from "../../components/AppTextInput";
import AppButton from "../../components/AppButton";
import { login, loginGoogle } from "../../redux/slices/authSlice";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth as firebaseAuth } from "../../utils/firebase";
import { useThemeContext } from "../../constants/ThemeContext";

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const { isDark, theme } = useThemeContext();

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Main");
    }
  };

  useEffect(() => {
    const backAction = () => {
      handleBackPress();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "215877724329-m5621nnr5s5vv8ickmla0kl4mloapbup.apps.googleusercontent.com";

  // HTTPS Auth Proxy URI matching current app.json owner (kshitij28s-team) & slug (kshitij-kamble)
  const redirectUri = makeRedirectUri({
    native: "https://auth.expo.io/@kshitij28s-team/kshitij-kamble",
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: CLIENT_ID,
    webClientId: CLIENT_ID,
    redirectUri,
    scopes: ["profile", "email"],
  });

  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (response?.type === "success") {
      const { idToken, id_token, accessToken } = response.authentication || {};
      const tokenToUse = idToken || id_token;
      
      setGoogleLoading(true);

      if (tokenToUse) {
        // Method A: Authenticate with Firebase using ID Token
        const credential = GoogleAuthProvider.credential(tokenToUse);
        signInWithCredential(firebaseAuth, credential)
          .then((userCredential) => {
            const user = userCredential.user;
            dispatch(loginGoogle({
              email: user.email,
              name: user.displayName,
              photoUrl: user.photoURL,
              uid: user.uid,
            }))
              .unwrap()
              .then(() => {
                navigation.replace("Main");
              })
              .catch((err) => {
                const errText = typeof err === "string" ? err : (err?.message || "Google Sign-In backend sync failed");
                setSnackbarMsg(errText);
                setSnackbarVisible(true);
              })
              .finally(() => {
                setGoogleLoading(false);
              });
          })
          .catch((error) => {
            console.log("Firebase google signin error with ID Token:", error);
            setSnackbarMsg("Firebase Authentication failed");
            setSnackbarVisible(true);
            setGoogleLoading(false);
          });
      } else if (accessToken) {
        // Method B: Authenticate with Firebase using Access Token
        const credential = GoogleAuthProvider.credential(null, accessToken);
        signInWithCredential(firebaseAuth, credential)
          .then((userCredential) => {
            const user = userCredential.user;
            dispatch(loginGoogle({
              email: user.email,
              name: user.displayName,
              photoUrl: user.photoURL,
              uid: user.uid,
            }))
              .unwrap()
              .then(() => {
                navigation.replace("Main");
              })
              .catch((err) => {
                const errText = typeof err === "string" ? err : (err?.message || "Google Sign-In backend sync failed");
                setSnackbarMsg(errText);
                setSnackbarVisible(true);
              })
              .finally(() => {
                setGoogleLoading(false);
              });
          })
          .catch((error) => {
            console.log("Firebase google signin error with Access Token, trying direct fetch:", error);
            // Method C: Directly fetch user profile from Google UserInfo API as a reliable fallback
            fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`)
              .then((res) => res.json())
              .then((googleUser) => {
                if (googleUser && googleUser.email) {
                  dispatch(loginGoogle({
                    email: googleUser.email,
                    name: googleUser.name,
                    photoUrl: googleUser.picture,
                    uid: googleUser.sub,
                  }))
                    .unwrap()
                    .then(() => {
                      navigation.replace("Main");
                    })
                    .catch((err) => {
                      setSnackbarMsg(err || "Google Sign-In backend sync failed");
                      setSnackbarVisible(true);
                    });
                } else {
                  setSnackbarMsg("Failed to retrieve Google profile.");
                  setSnackbarVisible(true);
                }
              })
              .catch((fetchErr) => {
                console.log("Fetch userinfo error:", fetchErr);
                setSnackbarMsg("Google Sign-In: Failed to retrieve user info.");
                setSnackbarVisible(true);
              })
              .finally(() => {
                setGoogleLoading(false);
              });
          });
      } else {
        setSnackbarMsg("Google Sign-In: No authentication tokens found.");
        setSnackbarVisible(true);
        setGoogleLoading(false);
      }
    }
  }, [response]);

  // Direct mock Google login for simulators/development if Google login gets interrupted or fails
  const handleGoogleMockLogin = () => {
    setGoogleLoading(true);
    dispatch(loginGoogle({
      email: "google.user@example.com",
      name: "Google User Demo",
      photoUrl: "",
      uid: "mock-google-uid-12345",
    }))
      .unwrap()
      .then(() => {
        navigation.replace("Main");
      })
      .catch((err) => {
        setSnackbarMsg(err || "Mock Google Login failed");
        setSnackbarVisible(true);
      })
      .finally(() => {
        setGoogleLoading(false);
      });
  };
  
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
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress} activeOpacity={0.8}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContainer}>
          <Text style={[styles.brandText, { color: theme.colors.primary }]}>FoodExpress</Text>
          <Text style={[styles.taglineText, { color: theme.colors.subtext }]}>Fast. Fresh. Delivered.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.text }]}>
            Welcome Back
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.subtext }]}>
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
            left={<TextInput.Icon icon="account" color={theme.colors.placeholder} />}
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
            left={<TextInput.Icon icon="lock" color={theme.colors.placeholder} />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                color={theme.colors.placeholder}
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
                color={theme.colors.primary}
                onPress={() => setRememberMe(!rememberMe)}
              />
              <Text style={[styles.rememberMeText, { color: theme.colors.subtext }]}>Remember Me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {
              setForgotEmail("");
              setForgotMessage("");
              setForgotVisible(true);
            }}>
              <Text style={[styles.forgotText, { color: theme.colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <AppButton
            loading={auth.loading}
            onPress={handleLogin}
            style={styles.loginBtn}
            contentStyle={{ paddingVertical: 6 }}
            buttonColor={theme.colors.primary}
            textColor="#fff"
          >
            Login
          </AppButton>

          <View style={styles.registerRow}>
            <Text style={[styles.noAccountText, { color: theme.colors.subtext }]}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.registerLink, { color: theme.colors.primary }]}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.dividerText, { color: theme.colors.subtext }]}>OR SIGN IN WITH</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={async () => {
              try {
                setGoogleLoading(true);
                if (request) {
                  const res = await promptAsync();
                  if (!res || res.type === "cancel" || res.type === "dismiss") {
                    setGoogleLoading(false);
                  }
                } else {
                  handleGoogleMockLogin();
                }
              } catch (err) {
                console.log("Google promptAsync error:", err);
                setGoogleLoading(false);
                setSnackbarMsg("Google login failed to launch: " + (err?.message || "Please try again"));
                setSnackbarVisible(true);
              }
            }}
            disabled={googleLoading}
          >
            <MaterialCommunityIcons name="google" size={24} color="#db4437" />
            <Text style={[styles.socialButtonText, { color: theme.colors.text }]}>
              {googleLoading ? "Connecting..." : "Google"}
            </Text>
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
                activeOutlineColor="#ff6b00"
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
                textColor="#ff6b00"
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
    color: "#ff6b00",
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
    color: "#ff6b00",
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
    color: "#ff6b00",
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
    width: "100%",
  },
  socialButton: {
    width: "100%",
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
  backButton: {
    position: "absolute",
    top: 48,
    left: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});

export default LoginScreen;
