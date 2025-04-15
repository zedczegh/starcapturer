/**
 * Database of locations with accurate Bortle scale values
 * Data sourced from astronomical observations and light pollution maps
 */

import { asiaLocations } from './regions/asiaLocations';
import { americasLocations } from './regions/americasLocations';
import { europeAfricaLocations } from './regions/europeAfricaLocations';
import { oceaniaLocations } from './regions/oceaniaLocations';
import { middleEastLocations } from './regions/middleEastLocations';
import { polarLocations } from './regions/polarLocations';
import { centralAsiaLocations } from './regions/centralAsiaLocations';
import { chinaSuburbanLocations } from './regions/chinaSuburbanLocations';
import { chinaMountainLocations } from './regions/chinaMountainLocations';
import { darkSkyLocations } from './regions/darkSkyLocations';
import { chinaCityLocations } from './regions/chinaCityLocations';
import { internationalLocations } from './regions/internationalLocations';
import { calculateDistance, deg2rad } from '@/utils/geoUtils';

export interface LocationEntry {
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  radius: number; // km - the approximate radius this location's Bortle scale applies to
  type?: 'urban' | 'rural' | 'dark-site' | 'natural' | 'suburban';
  chineseName?: string; // Add optional chineseName field
}

// Combine all regional location databases
export const locationDatabase: LocationEntry[] = [
  ...asiaLocations,
  ...americasLocations,
  ...europeAfricaLocations,
  ...oceaniaLocations,
  ...middleEastLocations,
  ...polarLocations,
  ...centralAsiaLocations,
  ...chinaSuburbanLocations,
  ...chinaMountainLocations,
  ...darkSkyLocations,
  ...chinaCityLocations,     // Add the new China city locations
  ...internationalLocations  // Add the new international locations
];

// Export utility functions from geoUtils to avoid duplication
export { calculateDistance, deg2rad } from '@/utils/geoUtils';

/**
 * Find the closest location to given coordinates
 * With improved error handling to ensure valid output
 */
export function findClosestLocation(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  distance: number;
  type?: string;
} {
  // Ensure database has content
  if (!locationDatabase || locationDatabase.length === 0) {
    return {
      name: `Unknown Location`,
      bortleScale: 5,
      distance: 0
    };
  }

  // Validate input coordinates
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return {
      name: `Unknown Location`,
      bortleScale: 5,
      distance: 0
    };
  }

  try {
    // Delegate to the implementation in locationFinder.ts
    const { findClosestLocationImpl } = require('./utils/locationFinder');
    return findClosestLocationImpl(latitude, longitude, locationDatabase);
  } catch (error) {
    console.error("Error finding closest location:", error);
    // Fallback if implementation fails
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
    const { getLocationInfoImpl } = require('./utils/locationFinder');
    return getLocationInfoImpl(latitude, longitude, locationDatabase);
  } catch (error) {
    console.error("Error getting location info:", error);
    // Fallback if implementation fails
    return {
      name: `Location at ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      bortleScale: 5,
      formattedName: `Unknown Location`
    };
  }
}

// Keep these functions here as they are core to the API
export { getBortleScaleDescription, getBortleScaleColor } from './utils/bortleScaleUtils';
