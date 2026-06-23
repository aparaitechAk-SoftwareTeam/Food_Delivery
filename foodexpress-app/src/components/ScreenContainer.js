import React from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { useTheme } from "react-native-paper";

const ScreenContainer = ({
  children,
  refreshing,
  onRefresh,
  scrollable = true,
  style,
}) => {
  const theme = useTheme();
  const content = (
    <View
      style={[
        { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : null
        }
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

export default ScreenContainer;
