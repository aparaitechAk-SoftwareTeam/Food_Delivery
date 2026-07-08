import { Platform, StyleSheet, Animated } from "react-native";

if (Platform.OS === "web") {
  // Suppress specific annoying react-native-web logs
  const originalWarn = console.warn;
  console.warn = function (...args) {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      (args[0].includes("props.pointerEvents is deprecated") ||
        args[0].includes("Cannot record touch end without a touch start") ||
        args[0].includes("shadow* style props are deprecated") ||
        args[0].includes("useNativeDriver is not supported"))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  // 1. StyleSheet shadow hook
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

  // 2. Animated useNativeDriver hook
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

  // 3. FontFaceObserver Web Timeout polyfill
  try {
    const FontFaceObserver = require("fontfaceobserver");
    FontFaceObserver.prototype.load = function () {
      return Promise.resolve();
    };
  } catch (e) {
    // Ignore if not installed or not resolvable
  }
}
