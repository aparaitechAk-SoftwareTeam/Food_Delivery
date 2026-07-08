import React from "react";
import { ActivityIndicator } from "react-native";
import { Button } from "react-native-paper";

const AppButton = ({ loading, mode = "contained", ...props }) => (
  <Button mode={mode} loading={loading} uppercase={false} {...props}>
    {props.children}
  </Button>
);

export default AppButton;
