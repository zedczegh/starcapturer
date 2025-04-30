
import { isWaterLocation } from './locationWaterCheck';

/**
 * Basic validation helpers
 */

/**
 * Check if a latitude is valid
 * @param lat The latitude to check
 * @returns True if valid
 */
export const isValidLatitude = (lat: number): boolean => {
  return lat >= -90 && lat <= 90;
};

/**
 * Check if a longitude is valid
 * @param lng The longitude to check
 * @returns True if valid
 */
export const isValidLongitude = (lng: number): boolean => {
  return lng >= -180 && lng <= 180;
};

/**
 * Check if coordinates are valid
 * @param lat The latitude to check
 * @param lng The longitude to check
 * @returns True if valid
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return isValidLatitude(lat) && isValidLongitude(lng);
};

/**
 * Check if a location is in water
 * This is a wrapper around the water check to make it sync
 * @param lat The latitude to check
 * @param lng The longitude to check
 * @returns True if water, false otherwise
 */
export const isWaterLocationSync = (lat: number, lng: number): boolean => {
  // Use simple version as fallback for sync operations
  return isWaterLocationSimple(lat, lng);
};
