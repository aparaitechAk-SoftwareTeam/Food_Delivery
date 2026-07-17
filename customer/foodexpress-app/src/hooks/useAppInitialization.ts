import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import * as Font from "expo-font";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { loadUserFromStorage } from "../redux/slices/authSlice";

export function useAppInitialization() {
  const [isReady, setIsReady] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    let active = true;

    async function initialize() {
      const startTime = Date.now();

      try {
        // 1. Load vector icons and fonts
        const fontPromise = Font.loadAsync({
          ...MaterialCommunityIcons.font,
          ...Ionicons.font,
        });

        // 2. Load authentication user from AsyncStorage
        // We dispatch and wait for the action to complete.
        const authPromise = (dispatch as any)(loadUserFromStorage());

        // Wait for both loading tasks to complete
        await Promise.all([fontPromise, authPromise]);
      } catch (error) {
        console.warn("Error during app initialization:", error);
      } finally {
        // 3. Enforce a minimum duration of 2500ms for premium animation loop
        const elapsedTime = Date.now() - startTime;
        const minimumDelay = 2500;
        const remainingTime = Math.max(0, minimumDelay - elapsedTime);

        setTimeout(() => {
          if (active) {
            setIsReady(true);
          }
        }, remainingTime);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [dispatch]);

  return { isReady };
}