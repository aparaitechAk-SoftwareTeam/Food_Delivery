import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, Platform } from "react-native";
import * as Location from "expo-location";
import { useDispatch, useSelector } from "react-redux";
import { setActiveAddress } from "../redux/slices/authSlice";
import { isInsideServiceArea, isOutsideBaramati, reverseGeocodeAsync } from "../utils/locationHelper";

/** @typedef {'checking'|'choose'|'denied'|'outside'|'inside'} GateStatus */

export function useLocationGate() {
  const dispatch = useDispatch();
  const activeAddress = useSelector((state) => state.auth.activeAddress);
  const token = useSelector((state) => state.auth.token);

  /** @type {[GateStatus, Function]} */
  const [status, setStatus] = useState("checking");
  const [cityName, setCityName] = useState("");
  const appStateRef = useRef(AppState.currentState);
  const isMounted = useRef(true);

  // ── Helper to validate an address ──────────────────────────────────────────
  const validateAddress = useCallback((address) => {
    if (!address) return false;
    
    // 1. If GPS coordinates are available, use high-accuracy geofencing
    if (address.latitude != null && address.longitude != null) {
      return isInsideServiceArea(address.latitude, address.longitude);
    }
    
    // 2. Otherwise fall back to text-based city/street checking
    return !isOutsideBaramati(address);
  }, []);

  // ── Core Geofence state synchroniser ───────────────────────────────────────
  const syncGateState = useCallback((address) => {
    if (!address) {
      setStatus("choose");
      return;
    }

    const isValid = validateAddress(address);
    setCityName(address.city || "");
    setStatus(isValid ? "inside" : "outside");
  }, [validateAddress]);

  // ── Sync gate state on mount and when activeAddress changes ────────────────
  // Guard: track whether we have already resolved gate status at least once.
  // This prevents a transient null activeAddress (during Redux re-hydration or
  // an API-triggered logout interceptor) from immediately resetting an 'inside'
  // user back to the location-picker screen.
  const hasResolvedOnce = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    const timer = setTimeout(() => {
      if (!isMounted.current) return;

      // If activeAddress is null but we already resolved as 'inside', preserve
      // the current gate state until the user explicitly changes location.
      if (!activeAddress && hasResolvedOnce.current && status === "inside") {
        // Keep the gate open — do not reset to 'choose'.
        return;
      }

      syncGateState(activeAddress);
      if (activeAddress) {
        hasResolvedOnce.current = true;
      }
    }, 100);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
  }, [activeAddress, syncGateState, status]);

  // ── Manual Location Selection ──────────────────────────────────────────────
  const selectLocation = useCallback(async (address) => {
    setStatus("checking");
    
    // Artificially delay a tiny bit for a premium transition loader feel
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (isMounted.current) {
      dispatch(setActiveAddress(address));
      syncGateState(address);
    }
  }, [dispatch, syncGateState]);

  // ── GPS Current Location Retrieval ─────────────────────────────────────────
  const useCurrentLocation = useCallback(async () => {
    setStatus("checking");

    try {
      // 1. Request permission (only triggered by explicit button press)
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== "granted") {
        if (isMounted.current) setStatus("denied");
        return;
      }

      // 2. Get fresh high-accuracy GPS coordinates (timeout 15s)
      let position;
      try {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 0,
        });
      } catch {
        position = await Location.getLastKnownPositionAsync();
      }

      if (!position) {
        if (isMounted.current) {
          setCityName("Unknown");
          setStatus("outside");
        }
        return;
      }

      const { latitude, longitude } = position.coords;

      // 3. Reverse geocode to build standard address object
      let place = {};
      try {
        const geocoded = await reverseGeocodeAsync(latitude, longitude);
        if (geocoded && geocoded.length > 0) {
          place = geocoded[0];
        }
      } catch (err) {
        // non-fatal
      }

      const gpsAddress = {
        label: "Current Location",
        line1: place.name || `${place.streetNumber || ""} ${place.street || ""}`,
        line2: place.district || place.subregion || "",
        city: place.city || place.subregion || "",
        state: place.region || "",
        postalCode: place.postalCode || "",
        country: place.country || "India",
        latitude,
        longitude,
      };

      if (isMounted.current) {
        dispatch(setActiveAddress(gpsAddress));
        syncGateState(gpsAddress);
      }
    } catch (err) {
      console.warn("[useLocationGate] GPS error:", err?.message);
      if (isMounted.current) setStatus("outside");
    }
  }, [dispatch, syncGateState]);

  // ── AppState recheck when app returns to foreground ───────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active" &&
        activeAddress
      ) {
        // If they return, re-verify the currently set active address
        syncGateState(activeAddress);
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [activeAddress, syncGateState]);

  // ── Change Location ────────────────────────────────────────────────────────
  const changeLocation = useCallback(() => {
    setStatus("choose");
  }, []);

  const openSettings = useCallback(() => {
    if (Platform.OS === "ios") {
      Location.openURL("app-settings:");
    } else {
      Location.openSettings();
    }
  }, []);

  return {
    status,
    cityName,
    retry: useCurrentLocation,
    selectLocation,
    useCurrentLocation,
    changeLocation,
    openSettings,
  };
}
