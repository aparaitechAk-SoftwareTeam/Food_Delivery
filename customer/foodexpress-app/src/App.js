import "./patchStyles";
import React, { useEffect } from "react";
import { Platform } from "react-native";

import { LogBox } from "react-native";
LogBox.ignoreLogs([
  "props.pointerEvents is deprecated",
  "SafeAreaView has been deprecated",
]);

import { Provider } from "react-redux";
import { Provider as PaperProvider } from "react-native-paper";
import { store } from "./redux/store";
import AppNavigator from "./navigation/AppNavigator";
import { lightTheme, darkTheme } from "./constants/theme";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { loadUserFromStorage } from "./redux/slices/authSlice";

// Location Gate
import { useLocationGate } from "./hooks/useLocationGate";
import LocationCheckingScreen from "./screens/Location/LocationCheckingScreen";
import PermissionDeniedScreen from "./screens/Location/PermissionDeniedScreen";
import ChooseLocationScreen from "./screens/Location/ChooseLocationScreen";
import ServiceNotAvailableScreen from "./screens/Location/ServiceNotAvailableScreen";

/**
 * LocationGate
 *
 * Sits ABOVE the NavigationContainer.
 * Renders the appropriate screen based on location check status.
 * AppNavigator is ONLY rendered when status === 'inside'.
 */
const LocationGate = ({ children }) => {
  const {
    status,
    cityName,
    retry,
    openSettings,
    selectLocation,
    useCurrentLocation,
    changeLocation,
  } = useLocationGate();

  if (status === "checking") {
    return <LocationCheckingScreen />;
  }

  if (status === "choose") {
    return (
      <ChooseLocationScreen
        onSelectLocation={selectLocation}
        onUseCurrentLocation={useCurrentLocation}
      />
    );
  }

  if (status === "denied") {
    return (
      <PermissionDeniedScreen
        onRetry={useCurrentLocation}
        onOpenSettings={openSettings}
      />
    );
  }

  if (status === "outside") {
    return (
      <ServiceNotAvailableScreen
        onChooseAnother={changeLocation}
        onUseCurrentLocation={useCurrentLocation}
      />
    );
  }

  // status === 'inside' — unlock the full app
  return children;
};

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
        <LocationGate>
          <AppNavigator />
        </LocationGate>
      </PaperProvider>
    </Provider>
  );
};

export default App;
