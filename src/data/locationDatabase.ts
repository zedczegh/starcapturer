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

export interface LocationEntry {
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  radius: number; // km - the approximate radius this location's Bortle scale applies to
  type?: 'urban' | 'rural' | 'dark-site' | 'natural';
}

// Combine all regional location databases
export const locationDatabase: LocationEntry[] = [
  ...asiaLocations,
  ...americasLocations,
  ...europeAfricaLocations,
  ...oceaniaLocations,
  ...middleEastLocations,
  ...polarLocations
];

// Move distance calculation to a utility file to avoid duplication
export { calculateDistance, deg2rad } from './utils/distanceCalculator';

/**
 * Find the closest location to given coordinates
 */
export function findClosestLocation(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  distance: number;
  type?: string;
} {
  // Delegate to the implementation in locationFinder.ts
  const { findClosestLocationImpl } = require('./utils/locationFinder');
  return findClosestLocationImpl(latitude, longitude, locationDatabase);
}

/**
 * Get a friendly location name with accurate Bortle scale
 */
export function getLocationInfo(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  formattedName: string;
} {
  const { getLocationInfoImpl } = require('./utils/locationFinder');
  return getLocationInfoImpl(latitude, longitude, locationDatabase);
}

// Keep these functions here as they are core to the API
export { getBortleScaleDescription, getBortleScaleColor } from './utils/bortleScaleUtils';
