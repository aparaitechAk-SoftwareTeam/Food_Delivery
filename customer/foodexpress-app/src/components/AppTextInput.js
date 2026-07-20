import React from "react";
import { TextInput } from "react-native-paper";
import { useThemeContext } from "../constants/ThemeContext";

const AppTextInput = ({ error, style, ...props }) => {
  const { isDark, theme } = useThemeContext();

  return (
    <TextInput
      mode="outlined"
      outlineColor={error ? theme.colors.error : (isDark ? "#444444" : "#cccccc")}
      activeOutlineColor={theme.colors.primary}
      textColor={theme.colors.text}
      placeholderTextColor={theme.colors.placeholder}
      style={[
        { marginVertical: 8, backgroundColor: isDark ? theme.colors.inputBg : "#ffffff" },
        style,
      ]}
      {...props}
    />
  );
};

export default AppTextInput;
