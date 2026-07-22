import "./patchStyles";
import React from "react";
import { LogBox } from "react-native";
LogBox.ignoreLogs([
  "props.pointerEvents is deprecated",
  "SafeAreaView has been deprecated",
]);

import { Provider } from "react-redux";
import { Provider as PaperProvider } from "react-native-paper";
import { store } from "./redux/store";
import AppNavigator from "./navigation/AppNavigator";
import SplashNavigator from "./navigation/SplashNavigator";
import { StatusBar } from "expo-status-bar";
import { CustomThemeProvider, useThemeContext } from "./constants/ThemeContext";

// Location Gate
import { useLocationGate } from "./hooks/useLocationGate";
import LocationCheckingScreen from "./screens/Location/LocationCheckingScreen";
import PermissionDeniedScreen from "./screens/Location/PermissionDeniedScreen";
import ChooseLocationScreen from "./screens/Location/ChooseLocationScreen";
import ServiceNotAvailableScreen from "./screens/Location/ServiceNotAvailableScreen";

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

  return children;
};

const MainAppContent = () => {
  const { isDark, theme } = useThemeContext();

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={theme.colors.surface} />
      <SplashNavigator>
        <LocationGate>
          <AppNavigator />
        </LocationGate>
      </SplashNavigator>
    </PaperProvider>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <CustomThemeProvider>
        <MainAppContent />
      </CustomThemeProvider>
    </Provider>
  );
};

export default App;
