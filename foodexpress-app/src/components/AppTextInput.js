import React from "react";
import { TextInput } from "react-native-paper";

const AppTextInput = ({ error, ...props }) => (
  <TextInput
    mode="outlined"
    outlineColor={error ? "#d32f2f" : "#ccc"}
    activeOutlineColor="#ff6b00"
    style={{ marginVertical: 8 }}
    {...props}
  />
);

export default AppTextInput;
