import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

export const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#ff6b00",
    primaryDark: "#e05d00",
    background: "#0b0f19",
    surface: "#161b26",
    card: "#161b26",
    text: "#ffffff",
    subtext: "#8a96a8",
    placeholder: "#667085",
    border: "#222a3a",
    divider: "#1e2636",
    headerBg: "#161b26",
    inputBg: "#161b26",
    chipBg: "#1c2333",
    success: "#22c55e",
    error: "#ef4444",
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#ff6b00",
    primaryDark: "#e05d00",
    background: "#f8fafc",
    surface: "#ffffff",
    card: "#ffffff",
    text: "#0f172a",
    subtext: "#64748b",
    placeholder: "#94a3b8",
    border: "#e2e8f0",
    divider: "#f1f5f9",
    headerBg: "#ffffff",
    inputBg: "#ffffff",
    chipBg: "#f1f5f9",
    success: "#16a34a",
    error: "#dc2626",
  },
};
