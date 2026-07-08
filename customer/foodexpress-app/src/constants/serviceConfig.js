/**
 * serviceConfig.js
 *
 * Single source of truth for the Baramati delivery zone.
 * Change ONLY this file to expand/shrink the service radius
 * or to update the center coordinates.
 */

export const SERVICE_CONFIG = {
  /** Baramati city center coordinates */
  center: {
    latitude: 18.1529,
    longitude: 74.5818,
  },

  /**
   * Service radius in kilometres.
   * Covers Baramati city + MIDC + Vidyanagar + Bhigwan Road surroundings.
   * Increase to expand the delivery zone.
   */
  radiusKm: 20,

  /** Human-readable zone name shown in UI */
  zoneName: "Baramati",

  /** Sub-areas listed on the unserviceable screen footer */
  liveAreas: ["Baramati City", "MIDC", "Vidyanagar", "Bhigwan Road"],
};
