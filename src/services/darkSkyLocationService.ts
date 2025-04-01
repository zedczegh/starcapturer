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
    try {
      cachedDarkSkyLocations = locationDatabase.filter(loc => loc.type === 'dark-site');
    } catch (error) {
      console.error("Error filtering dark sky locations:", error);
      return [];
    }
  }
  return cachedDarkSkyLocations || [];
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
  try {
    const darkSkyLocations = getAllDarkSkyLocations();
    
    return darkSkyLocations.filter(location => {
      try {
        const distance = calculateDistance(
          latitude,
          longitude,
          location.coordinates[0],
          location.coordinates[1]
        );
        
        return distance <= radius;
      } catch (error) {
        console.error(`Error calculating distance for location ${location.name}:`, error);
        return false;
      }
    });
  } catch (error) {
    console.error("Error finding dark sky locations within radius:", error);
    return [];
  }
}

/**
 * Determine certification type based on location name or properties
 * @param location The location entry
 * @returns Certification string
 */
function determineCertificationType(location: LocationEntry): string {
  const lowerName = location.name.toLowerCase();
  
  if (lowerName.includes('sanctuary')) {
    return 'International Dark Sky Sanctuary';
  } else if (lowerName.includes('reserve')) {
    return 'International Dark Sky Reserve';
  } else if (lowerName.includes('community') || 
            lowerName.includes('village') || 
            lowerName.includes('town') ||
            lowerName.includes('city')) {
    return 'International Dark Sky Community';
  } else if (lowerName.includes('urban')) {
    return 'Urban Night Sky Place';
  } else {
    // Default to park for national parks, state parks, etc.
    return 'International Dark Sky Park';
  }
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
  try {
    const distance = calculateDistance(
      userLatitude,
      userLongitude,
      entry.coordinates[0],
      entry.coordinates[1]
    );
    
    // Determine certification type
    const certification = determineCertificationType(entry);
    const isDarkSkyReserve = certification === 'International Dark Sky Reserve';
    
    // Calculate a realistic SIQS score based on Bortle scale
    const baseSiqs = Math.max(1, 10 - entry.bortleScale);
    // Add some variability but keep scores high for certified locations
    const siqs = Math.max(6, Math.min(9, baseSiqs + (Math.random() * 1.5)));
    
    return {
      id: `local-${entry.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: entry.name,
      latitude: entry.coordinates[0],
      longitude: entry.coordinates[1],
      siqs: siqs,
      bortleScale: entry.bortleScale,
      isDarkSkyReserve: isDarkSkyReserve,
      certification: certification,
      description: `${entry.name} is a certified dark sky location with excellent viewing conditions (Bortle scale ${entry.bortleScale}).`,
      distance: distance,
      cloudCover: 0, // Will be calculated by SIQS service
      isViable: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error converting location entry to AstroSpot: ${entry.name}`, error);
    
    // Return a minimal valid SharedAstroSpot object as fallback with required properties
    return {
      id: `local-${entry.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: entry.name,
      latitude: entry.coordinates[0],
      longitude: entry.coordinates[1],
      bortleScale: entry.bortleScale || 5, // Provide a default value
      siqs: 0, // Default SIQS
      timestamp: new Date().toISOString()
    };
  }
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
  try {
    const locations = findDarkSkyLocationsWithinRadius(latitude, longitude, radius);
    
    return locations.map(location => 
      convertToSharedAstroSpot(location, latitude, longitude)
    );
  } catch (error) {
    console.error("Error getting dark sky astro spots:", error);
    return [];
  }
}
