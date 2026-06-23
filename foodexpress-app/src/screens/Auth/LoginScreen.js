import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Snackbar } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import AppTextInput from "../../components/AppTextInput";
import AppButton from "../../components/AppButton";
import { login } from "../../redux/slices/authSlice";

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);

  const handleLogin = () => {
    dispatch(login({ email, password }))
      .unwrap()
      .then(() => navigation.replace("Main"))
      .catch(() => setVisible(true));
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Welcome back
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Sign in to continue ordering delicious meals.
      </Text>
      <AppTextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AppTextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <AppButton loading={auth.loading} onPress={handleLogin}>
        Login
      </AppButton>
      <View style={styles.row}>
        <Text>Don't have an account?</Text>
        <AppButton mode="text" onPress={() => navigation.navigate("Register")}>
          Register
        </AppButton>
      </View>
      <AppButton
        mode="text"
        onPress={() => navigation.navigate("ForgotPassword")}
      >
        Forgot Password?
      </AppButton>
      <Snackbar visible={visible} onDismiss={() => setVisible(false)}>
        {auth.error || "Unable to login"}
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
});

export default LoginScreen;
