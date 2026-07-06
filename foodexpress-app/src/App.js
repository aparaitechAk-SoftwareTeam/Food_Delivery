import React, { useEffect } from "react";
import { Animated, Platform } from "react-native";

// Polyfill Animated driver for Web to avoid "useNativeDriver is not supported" warnings
if (Platform.OS === "web") {
  const originalWarn = console.warn;
  console.warn = function (...args) {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      (args[0].includes("props.pointerEvents is deprecated") ||
        args[0].includes("Cannot record touch end without a touch start"))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  const { StyleSheet } = require("react-native");
  const originalCreate = StyleSheet.create;
  StyleSheet.create = function (styles) {
    const newStyles = {};
    for (const key in styles) {
      if (Object.prototype.hasOwnProperty.call(styles, key)) {
        const style = styles[key];
        if (style && typeof style === "object") {
          if (
            style.shadowColor !== undefined ||
            style.shadowOpacity !== undefined ||
            style.shadowRadius !== undefined ||
            style.shadowOffset !== undefined
          ) {
            const shadowColor = style.shadowColor || "rgba(0,0,0,0.2)";
            const shadowOpacity = style.shadowOpacity !== undefined ? style.shadowOpacity : 1;
            let offsetX = 0;
            let offsetY = 0;
            if (style.shadowOffset && typeof style.shadowOffset === "object") {
              offsetX = style.shadowOffset.width || 0;
              offsetY = style.shadowOffset.height || 0;
            }
            const shadowRadius = style.shadowRadius !== undefined ? style.shadowRadius : 0;
            const hexToRgba = (hex, alpha = 1) => {
              if (!hex || !hex.startsWith("#")) return hex || "rgba(0,0,0,0.2)";
              let c = hex.substring(1);
              if (c.length === 3) {
                c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
              }
              const num = parseInt(c, 16);
              return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
            };
            const shadowColorWithOpacity = hexToRgba(shadowColor, shadowOpacity);
            style.boxShadow = `${offsetX}px ${offsetY}px ${shadowRadius}px ${shadowColorWithOpacity}`;
            delete style.shadowColor;
            delete style.shadowOffset;
            delete style.shadowOpacity;
            delete style.shadowRadius;
          }
        }
        newStyles[key] = style;
      }
    }
    return originalCreate(newStyles);
  };

  const wrapAnimation = (originalFn) => {
    return (value, config) => {
      if (config && config.useNativeDriver !== undefined) {
        config.useNativeDriver = false;
      }
      return originalFn(value, config);
    };
  };

  Animated.timing = wrapAnimation(Animated.timing);
  Animated.spring = wrapAnimation(Animated.spring);
  Animated.decay = wrapAnimation(Animated.decay);

  const originalEvent = Animated.event;
  Animated.event = (argMapping, config) => {
    if (config && config.useNativeDriver !== undefined) {
      config.useNativeDriver = false;
    }
    return originalEvent(argMapping, config);
  };
}

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
