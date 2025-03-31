
/**
 * Service for efficiently retrieving Dark Sky locations
 * Provides optimized access to the dark sky locations database
 */

import { locationDatabase, LocationEntry } from '@/data/locationDatabase';
import { calculateDistance } from '@/lib/api/coordinates';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Cache of dark sky locations for quick access
let cachedDarkSkyLocations: LocationEntry[] | null = null;

/**
 * Get all dark sky locations from the database
 * @returns Array of LocationEntry with type 'dark-site'
 */
export function getAllDarkSkyLocations(): LocationEntry[] {
  if (!cachedDarkSkyLocations) {
    cachedDarkSkyLocations = locationDatabase.filter(loc => loc.type === 'dark-site');
  }
  return cachedDarkSkyLocations;
}

/**
 * Find dark sky locations within a radius
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Array of LocationEntry within radius
 */
export function findDarkSkyLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number
): LocationEntry[] {
  const darkSkyLocations = getAllDarkSkyLocations();
  
  return darkSkyLocations.filter(location => {
    const distance = calculateDistance(
      latitude,
      longitude,
      location.coordinates[0],
      location.coordinates[1]
    );
    
    return distance <= radius;
  });
}

/**
 * Convert LocationEntry to SharedAstroSpot format
 * @param entry LocationEntry from database
 * @param userLatitude User latitude for distance calculation
 * @param userLongitude User longitude for distance calculation
 * @returns SharedAstroSpot object
 */
export function convertToSharedAstroSpot(
  entry: LocationEntry,
  userLatitude: number,
  userLongitude: number
): SharedAstroSpot {
  const distance = calculateDistance(
    userLatitude,
    userLongitude,
    entry.coordinates[0],
    entry.coordinates[1]
  );
  
  return {
    id: `local-${entry.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: entry.name,
    latitude: entry.coordinates[0],
    longitude: entry.coordinates[1],
    siqs: Math.max(1, 10 - entry.bortleScale),
    bortleScale: entry.bortleScale,
    isDarkSkyReserve: true,
    certification: 'International Dark Sky Association',
    description: `${entry.name} is a certified dark sky location with excellent viewing conditions (Bortle scale ${entry.bortleScale}).`,
    distanceKm: distance,
    type: 'dark-sky',
    cloudCover: 0, // Will be calculated by SIQS service
    visibility: 0  // Will be calculated by SIQS service
  };
}

/**
 * Get dark sky locations as SharedAstroSpot objects
 * @param latitude User latitude
 * @param longitude User longitude
 * @param radius Search radius in km
 * @returns Array of SharedAstroSpot
 */
export function getDarkSkyAstroSpots(
  latitude: number,
  longitude: number,
  radius: number
): SharedAstroSpot[] {
  const locations = findDarkSkyLocationsWithinRadius(latitude, longitude, radius);
  
  return locations.map(location => 
    convertToSharedAstroSpot(location, latitude, longitude)
  );
}
