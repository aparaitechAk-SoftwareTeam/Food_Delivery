import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightTheme, darkTheme } from "./theme";

const STORAGE_KEY = "@foodexpress_theme_mode";

const ThemeContext = createContext({
  themeMode: "light",
  isDark: false,
  theme: lightTheme,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const CustomThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState("light");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedMode === "dark" || savedMode === "light") {
          setThemeModeState(savedMode);
        } else {
          // Always default to Light Mode. Do NOT let device OS dark mode override the app theme.
          setThemeModeState("light");
        }
      } catch (err) {
        setThemeModeState("light");
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedTheme();
  }, []);

  const setThemeMode = async (mode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (err) {
      console.warn("Failed to save theme preference:", err);
    }
  };

  const toggleTheme = () => {
    const nextMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextMode);
  };

  const isDark = themeMode === "dark";
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        theme,
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);

export default ThemeContext;
