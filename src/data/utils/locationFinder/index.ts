
import { LocationEntry } from "../../locationDatabase";
import { calculateDistance } from "../distanceCalculator";
import { findClosestLocationStrategy } from "./findClosestLocationStrategy";
import { getLocationNameFormatting } from "./locationNameFormatter";

/**
 * Find the closest location to given coordinates
 * Enhanced algorithm with terrain type weighting, multi-point interpolation and special handling for mountainous areas
 */
export function findClosestLocationImpl(
  latitude: number, 
  longitude: number, 
  locationDatabase: LocationEntry[]
): {
  name: string;
  bortleScale: number;
  distance: number;
  type?: string;
} {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return {
      name: `Unknown Location`,
      bortleScale: 5,
      distance: 0
    };
  }

  return findClosestLocationStrategy(latitude, longitude, locationDatabase);
}

/**
 * Get a friendly location name with accurate Bortle scale
 * Enhanced with more descriptive naming
 */
export function getLocationInfoImpl(
  latitude: number, 
  longitude: number, 
  locationDatabase: LocationEntry[]
): {
  name: string;
  bortleScale: number;
  formattedName: string;
} {
  const result = findClosestLocationImpl(latitude, longitude, locationDatabase);
  return getLocationNameFormatting(result);
}
