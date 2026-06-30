import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Snackbar, IconButton } from "react-native-paper";
import AppTextInput from "../../components/AppTextInput";
import AppButton from "../../components/AppButton";
import authService from "../../services/authService";

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP, Step 3: Reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState(""); // Dev aid

  const showToast = (msg) => {
    setMessage(msg);
    setVisible(true);
  };

  const handleRequestOtp = async () => {
    if (!email) {
      showToast("Email address is required");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.otp) {
        setReceivedOtp(response.otp);
        showToast(`OTP generated: ${response.otp} (For testing/copying)`);
      } else {
        showToast("OTP sent to your email address");
      }
      setStep(2);
    } catch (error) {
      showToast(error?.response?.data?.message || error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      showToast("Verification code is required");
      return;
    }
    setLoading(true);
    try {
      await authService.verifyOtp(email, otp);
      showToast("OTP verified successfully!");
      setStep(3);
    } catch (error) {
      showToast(error?.response?.data?.message || error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password) {
      showToast("New password is required");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email, otp, password);
      showToast("Password reset successfully! Redirecting...");
      setTimeout(() => {
        navigation.navigate("Login");
      }, 1500);
    } catch (error) {
      showToast(error?.response?.data?.message || error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {step === 1 && "Reset Password"}
        {step === 2 && "Enter Verification Code"}
        {step === 3 && "Create New Password"}
      </Text>
      
      <Text variant="bodyMedium" style={styles.subtitle}>
        {step === 1 && "Enter your registered email address to receive a 6-digit OTP code."}
        {step === 2 && `We've sent a 6-digit code to ${email}.`}
        {step === 3 && "Set your secure new password to log back into your account."}
      </Text>

      {step === 1 && (
        <View style={styles.form}>
          <AppTextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="email-outline"
          />
          <AppButton loading={loading} onPress={handleRequestOtp} style={styles.submitBtn}>
            Send OTP
          </AppButton>
        </View>
      )}

      {step === 2 && (
        <View style={styles.form}>
          <AppTextInput
            label="6-Digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            leftIcon="numeric"
          />
          {receivedOtp ? (
            <Text style={styles.devOtpText}>Testing OTP: <Text style={styles.otpHighlight}>{receivedOtp}</Text></Text>
          ) : null}
          <AppButton loading={loading} onPress={handleVerifyOtp} style={styles.submitBtn}>
            Verify Code
          </AppButton>
          <TouchableOpacity onPress={handleRequestOtp} disabled={loading}>
            <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <View style={styles.form}>
          <View style={styles.passInputWrapper}>
            <AppTextInput
              label="New Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              leftIcon="lock-outline"
            />
            <IconButton
              icon={showPassword ? "eye-off" : "eye"}
              size={20}
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            />
          </View>

          <AppTextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            leftIcon="lock-check-outline"
          />

          <AppButton loading={loading} onPress={handleResetPassword} style={styles.submitBtn}>
            Reset Password
          </AppButton>
        </View>
      )}

      <AppButton mode="text" onPress={() => navigation.navigate("Login")} style={styles.backBtn}>
        Back to Login
      </AppButton>

      <Snackbar visible={visible} onDismiss={() => setVisible(false)} duration={4000}>
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
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontWeight: "bold",
    color: "#1D2939",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    color: "#667085",
    lineHeight: 20,
    marginBottom: 28,
  },
  form: {
    width: "100%",
  },
  submitBtn: {
    backgroundColor: "#FF6F61",
    borderRadius: 12,
    marginTop: 14,
    height: 48,
    justifyContent: "center",
  },
  backBtn: {
    marginTop: 16,
  },
  resendText: {
    textAlign: "center",
    color: "#FF6F61",
    fontWeight: "bold",
    marginTop: 16,
    fontSize: 13,
  },
  passInputWrapper: {
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: 8,
    top: 14,
    zIndex: 99,
  },
  devOtpText: {
    fontSize: 12,
    color: "#667085",
    textAlign: "center",
    marginTop: 6,
  },
  otpHighlight: {
    fontWeight: "bold",
    color: "#FF6F61",
  },
});

export default ForgotPasswordScreen;
