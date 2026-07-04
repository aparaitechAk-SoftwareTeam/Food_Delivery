import { SERVICE_CONFIG } from "../constants/serviceConfig";

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
