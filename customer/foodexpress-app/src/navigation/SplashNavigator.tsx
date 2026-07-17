import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import AnimatedSplash from "../components/AnimatedSplash";
import { useAppInitialization } from "../hooks/useAppInitialization";

interface SplashNavigatorProps {
  children: React.ReactNode;
}

export default function SplashNavigator({ children }: SplashNavigatorProps) {
  const { isReady } = useAppInitialization();
  const [isVisible, setIsVisible] = useState(true);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isReady) {
      opacity.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(setIsVisible)(false);
        }
      });
    }
  }, [isReady]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      {/* Underlying app content renders in the background */}
      {children}

      {/* Splash overlay */}
      {isVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, styles.overlay]}>
          <AnimatedSplash />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    zIndex: 9999, // Ensure splash screen stays on top of navigation
  },
});