
/**
 * Utilities for filtering locations based on various criteria
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation } from "./locationValidator";

/**
 * Check if a location is certified (Dark Sky Reserve or has certification)
 * @param location Location to check
 * @returns Boolean indicating if the location is certified
 */
export const isCertifiedLocation = (location: SharedAstroSpot): boolean => {
  return Boolean(location.isDarkSkyReserve || (location.certification && location.certification.length > 0));
};

/**
 * Filter out water locations from an array of locations
 * @param locations Array of locations to filter
 * @returns Filtered array without water locations
 */
export const filterWaterLocations = (locations: SharedAstroSpot[]): SharedAstroSpot[] => {
  return locations.filter(loc => {
    // Never filter out certified locations
    if (isCertifiedLocation(loc)) return true;
    
    // Filter out water locations
    return !isWaterLocation(loc.latitude, loc.longitude);
  });
};

/**
 * Filter locations by distance from a reference point
 * @param locations Array of locations to filter
 * @param refLat Reference latitude
 * @param refLng Reference longitude
 * @param radius Maximum distance in kilometers
 * @returns Filtered array of locations within radius
 */
export const filterLocationsByDistance = (
  locations: SharedAstroSpot[],
  refLat: number,
  refLng: number,
  radius: number
): SharedAstroSpot[] => {
  if (!locations || !Array.isArray(locations)) return [];
  if (!refLat || !refLng || !radius) return locations;
  
  return locations.filter(loc => {
    // Never filter out certified locations by distance
    if (isCertifiedLocation(loc)) return true;
    
    // Check if the location has valid distance property
    if (loc.distance !== undefined) {
      return loc.distance <= radius;
    }
    
    // If no distance property, always include
    return true;
  });
};
