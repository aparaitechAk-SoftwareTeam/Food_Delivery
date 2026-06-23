import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { Provider as PaperProvider } from "react-native-paper";
import { store } from "./redux/store";
import AppNavigator from "./navigation/AppNavigator";
import { lightTheme, darkTheme } from "./constants/theme";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { loadUserFromStorage } from "./redux/slices/authSlice";

const App = () => {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? darkTheme : lightTheme;

  useEffect(() => {
    store.dispatch(loadUserFromStorage());
  }, []);

  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <AppNavigator />
      </PaperProvider>
    </Provider>
  );
};

export default App;
