import { SERVICE_CONFIG } from "../constants/serviceConfig";
import * as Location from "expo-location";

// ─── Haversine Distance Formula ───────────────────────────────────────────────

/**
 * Calculates the great-circle distance between two GPS coordinates
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometres
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── GPS-Based Service Area Check ────────────────────────────────────────────

/**
 * Returns true if the given GPS coordinates are inside the configured
 * Baramati service area (uses Haversine distance against SERVICE_CONFIG).
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {boolean}
 */
export function isInsideServiceArea(latitude, longitude) {
  if (latitude == null || longitude == null) return false;
  const distanceKm = haversineDistanceKm(
    latitude,
    longitude,
    SERVICE_CONFIG.center.latitude,
    SERVICE_CONFIG.center.longitude
  );
  return distanceKm <= SERVICE_CONFIG.radiusKm;
}

// ─── Legacy Address-String Check (kept for backward compatibility) ─────────────

/**
 * Legacy helper used by UnserviceableScreen and old navigation logic.
 * Checks if a saved address object has "baramati" in any field.
 * Prefer isInsideServiceArea() for new code (GPS-based, more accurate).
 *
 * @param {{ city?: string, line1?: string, line2?: string, label?: string }|null} address
 * @returns {boolean} true if outside Baramati
 */
export const isOutsideBaramati = (address) => {
  if (!address) return false;

  const city = (address.city || "").toLowerCase();
  const line1 = (address.line1 || "").toLowerCase();
  const line2 = (address.line2 || "").toLowerCase();
  const label = (address.label || "").toLowerCase();

  if (
    city.includes("baramati") ||
    line1.includes("baramati") ||
    line2.includes("baramati") ||
    label.includes("baramati")
  ) {
    return false;
  }

  return true;
};

/**
  * Geocodes an address string using Nominatim with Location fallback
  */
export async function geocodeAsync(addressString) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
      {
        headers: {
          "User-Agent": "FoodExpressApp/1.0",
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return [{
        latitude: Number(data[0].lat),
        longitude: Number(data[0].lon),
      }];
    }
  } catch (err) {
    console.warn("Nominatim geocode failed, falling back to expo-location:", err);
  }

  try {
    const results = await Location.geocodeAsync(addressString);
    return results;
  } catch (err) {
    console.error("expo-location geocoding failed:", err);
    return [];
  }
}

/**
  * Reverse geocodes coordinates using Nominatim with Location fallback
  */
export async function reverseGeocodeAsync(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          "User-Agent": "FoodExpressApp/1.0",
        },
      }
    );
    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      return [{
        name: data.display_name.split(",")[0] || addr.road || addr.suburb || "",
        street: addr.road || "",
        streetNumber: addr.house_number || "",
        district: addr.suburb || addr.neighbourhood || "",
        city: addr.city || addr.town || addr.village || "",
        subregion: addr.county || "",
        region: addr.state || "",
        postalCode: addr.postcode || "",
        country: addr.country || "India",
      }];
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode failed, falling back to expo-location:", err);
  }

  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    return results;
  } catch (err) {
    console.error("expo-location reverse geocoding failed:", err);
    return [];
  }
}
