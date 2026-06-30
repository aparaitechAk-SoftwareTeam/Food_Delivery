import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, Snackbar, Checkbox, TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import AppTextInput from "../../components/AppTextInput";
import AppButton from "../../components/AppButton";
import { register } from "../../redux/slices/authSlice";

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation Errors
  const [errors, setErrors] = useState({});

  // Snackbar
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const evaluatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "#ddd" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) {
      return { score, label: "Weak", color: "#d32f2f" };
    } else if (score <= 4) {
      return { score, label: "Medium", color: "#ff9800" };
    } else {
      return { score, label: "Strong", color: "#2e7d32" };
    }
  };

  const strength = evaluatePasswordStrength(password);

  const validate = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = "Full Name is required";
    
    if (!email.trim()) {
      tempErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (!phone.trim()) {
      tempErrors.phone = "Mobile Number is required";
    } else if (!/^\d{10}$/.test(phone.trim())) {
      tempErrors.phone = "Mobile number must be a 10-digit number";
    }

    if (!password) {
      tempErrors.password = "Password is required";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    } else if (strength.label === "Weak") {
      tempErrors.password = "Password is too weak. Add capital letters, digits or symbols.";
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }

    if (!termsAccepted) {
      tempErrors.terms = "You must accept the Terms & Conditions";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;

    dispatch(register({ name, email, phone, password }))
      .unwrap()
      .then(() => {
        setSnackbarMsg("Registration successful! Logging in...");
        setSnackbarVisible(true);
        setTimeout(() => {
          navigation.replace("Main");
        }, 1000);
      })
      .catch((err) => {
        const errorMsg = typeof err === "string" ? err : (err?.message || "Unable to register");
        setSnackbarMsg(errorMsg);
        setSnackbarVisible(true);
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.brandText}>FoodExpress</Text>
        <Text style={styles.taglineText}>Create Your Account</Text>
      </View>

      <View style={styles.card}>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sign up to get fresh, tasty meals delivered straight to your door
        </Text>

        <AppTextInput
          label="Full Name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (text) setErrors((prev) => ({ ...prev, name: null }));
          }}
          error={!!errors.name}
          left={<TextInput.Icon icon="account" />}
        />
        {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <AppTextInput
          label="Email Address"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (text) setErrors((prev) => ({ ...prev, email: null }));
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!errors.email}
          left={<TextInput.Icon icon="email" />}
        />
        {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <AppTextInput
          label="Mobile Number"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            if (text) setErrors((prev) => ({ ...prev, phone: null }));
          }}
          keyboardType="phone-pad"
          maxLength={10}
          error={!!errors.phone}
          left={<TextInput.Icon icon="phone" />}
        />
        {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

        <AppTextInput
          label="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (text) setErrors((prev) => ({ ...prev, password: null }));
          }}
          secureTextEntry={!showPassword}
          error={!!errors.password}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />
        {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthRow}>
              <Text style={styles.strengthLabelText}>Password Strength: </Text>
              <Text style={[styles.strengthText, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: strength.color,
                    width: `${(strength.score / 5) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <AppTextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (text) setErrors((prev) => ({ ...prev, confirmPassword: null }));
          }}
          secureTextEntry={!showConfirmPassword}
          error={!!errors.confirmPassword}
          left={<TextInput.Icon icon="lock-check" />}
          right={
            <TextInput.Icon
              icon={showConfirmPassword ? "eye-off" : "eye"}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
        />
        {!!errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}

        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => {
            setTermsAccepted(!termsAccepted);
            if (!termsAccepted) setErrors((prev) => ({ ...prev, terms: null }));
          }}
        >
          <Checkbox
            status={termsAccepted ? "checked" : "unchecked"}
            color="#22C55E"
            onPress={() => {
              setTermsAccepted(!termsAccepted);
              if (!termsAccepted) setErrors((prev) => ({ ...prev, terms: null }));
            }}
          />
          <Text style={styles.termsText}>
            I agree to the Terms of Service & Privacy Policy
          </Text>
        </TouchableOpacity>
        {!!errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

        <AppButton
          loading={auth.loading}
          onPress={handleRegister}
          style={styles.registerBtn}
          contentStyle={{ paddingVertical: 6 }}
          buttonColor="#22C55E"
          textColor="#fff"
        >
          Register
        </AppButton>

        <View style={styles.loginRow}>
          <Text style={styles.alreadyAccountText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMsg}
      </Snackbar>
    </ScrollView>
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
    marginBottom: 24,
  },
  brandText: {
    fontSize: 34,
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
  subtitle: {
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginLeft: 4,
    marginTop: -2,
    marginBottom: 6,
  },
  strengthContainer: {
    marginVertical: 6,
    paddingHorizontal: 4,
  },
  strengthRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  strengthLabelText: {
    fontSize: 12,
    color: "#666",
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#eee",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  termsText: {
    fontSize: 13,
    color: "#555",
    flex: 1,
    marginLeft: 2,
  },
  registerBtn: {
    marginTop: 20,
    borderRadius: 8,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  alreadyAccountText: {
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    fontSize: 14,
    color: "#22C55E",
    fontWeight: "bold",
    marginLeft: 6,
  },
});

export default RegisterScreen;
