import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Snackbar } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import AppTextInput from "../../components/AppTextInput";
import AppButton from "../../components/AppButton";
import { register } from "../../redux/slices/authSlice";

const RegisterScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);

  const handleRegister = () => {
    dispatch(register({ name, email, password }))
      .unwrap()
      .then(() => navigation.replace("Main"))
      .catch(() => setVisible(true));
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Create account
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Fill in your details to get started.
      </Text>
      <AppTextInput label="Name" value={name} onChangeText={setName} />
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
      <AppButton loading={auth.loading} onPress={handleRegister}>
        Register
      </AppButton>
      <View style={styles.row}>
        <Text>Already have an account?</Text>
        <AppButton mode="text" onPress={() => navigation.navigate("Login")}>
          Login
        </AppButton>
      </View>
      <Snackbar visible={visible} onDismiss={() => setVisible(false)}>
        {auth.error || "Unable to register"}
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

export default RegisterScreen;
