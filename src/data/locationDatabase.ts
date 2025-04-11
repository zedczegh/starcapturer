
/**
 * Interface for location entries in the database
 */
export interface LocationEntry {
  name: string;
  chineseName?: string; // Added the chineseName property
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  radius: number;
  type?: 'urban' | 'suburban' | 'rural' | 'natural' | 'dark-site';
  certification?: string;
  isDarkSkyReserve?: boolean;
}

// Import collections of locations from region files
import { asiaLocations } from './regions/asiaLocations';
import { europeAfricaLocations } from './regions/europeAfricaLocations';
import { americasLocations } from './regions/americasLocations';
import { oceaniaLocations } from './regions/oceaniaLocations';
import { centralAsiaLocations } from './regions/centralAsiaLocations';
import { polarLocations } from './regions/polarLocations';
import { middleEastLocations } from './regions/middleEastLocations';
import { darkSkyLocations } from './regions/darkSkyLocations';
import { chinaMountainLocations } from './regions/chinaMountainLocations';
import { chinaSuburbanLocations } from './regions/chinaSuburbanLocations';
import { deg2rad, calculateDistance } from './utils/distanceCalculator';

// Combine all location collections into a single database
export const locationDatabase: LocationEntry[] = [
  ...asiaLocations,
  ...europeAfricaLocations,
  ...americasLocations,
  ...oceaniaLocations,
  ...centralAsiaLocations,
  ...polarLocations,
  ...middleEastLocations,
  ...darkSkyLocations,
  ...chinaMountainLocations,
  ...chinaSuburbanLocations
];

/**
 * Find the closest location in the database to the given coordinates
 * @param latitude Latitude of target location
 * @param longitude Longitude of target location
 * @returns Closest location entry with distance added
 */
export function findClosestLocation(latitude: number, longitude: number): LocationEntry & { distance: number } {
  if (!locationDatabase || locationDatabase.length === 0) {
    throw new Error('Location database is empty or not initialized');
  }

  let closest: LocationEntry | null = null;
  let minDistance = Infinity;

  for (const location of locationDatabase) {
    const [locLat, locLng] = location.coordinates;
    const distance = calculateDistance(latitude, longitude, locLat, locLng);
    
    if (distance < minDistance) {
      minDistance = distance;
      closest = location;
    }
  }

  if (!closest) {
    throw new Error('Failed to find closest location');
  }

  return { ...closest, distance: minDistance };
}

/**
 * Get location info for the given coordinates
 * @param latitude Latitude of target location
 * @param longitude Longitude of target location
 * @returns Location info with distance, bortle scale etc.
 */
export function getLocationInfo(latitude: number, longitude: number) {
  const closest = findClosestLocation(latitude, longitude);
  return {
    name: closest.name,
    chineseName: closest.chineseName,
    bortleScale: closest.bortleScale,
    distance: closest.distance,
    type: closest.type || 'natural'
  };
}

// Re-export distance calculator functions to maintain compatibility
export { calculateDistance, deg2rad };
