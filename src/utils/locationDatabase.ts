
import { LocationEntry } from '@/data/locationDatabase';
import { findClosestLocationImpl, getLocationInfoImpl } from './locationFinder';
import { calculateDistance, degToRad } from '@/utils/geoUtils';
import { getBortleScaleDescription, getBortleScaleColor } from '@/data/utils/bortleScaleUtils';

/**
 * Find the closest location to given coordinates
 */
export function findClosestLocation(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  distance: number;
  type?: string;
} {
  try {
    return findClosestLocationImpl(latitude, longitude, locationDatabase);
  } catch (error) {
    console.error("Error finding closest location:", error);
    return {
      name: `Location at ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      bortleScale: 5,
      distance: 0
    };
  }
}

/**
 * Get a friendly location name with accurate Bortle scale
 */
export function getLocationInfo(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  formattedName: string;
} {
  try {
    return getLocationInfoImpl(latitude, longitude, locationDatabase);
  } catch (error) {
    console.error("Error getting location info:", error);
    return {
      name: `Location at ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      bortleScale: 5,
      formattedName: `Unknown Location`
    };
  }
}

// Re-export utility functions
export { calculateDistance, degToRad, getBortleScaleDescription, getBortleScaleColor };
