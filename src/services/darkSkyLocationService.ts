
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
 * Get a description for a dark sky location based on its certification
 * @param certification Certification string
 * @returns Description text
 */
function getDarkSkyDescription(name: string, certification?: string, bortleScale?: number): string {
  if (!certification) {
    return `${name} is a dark sky location with good viewing conditions.`;
  }
  
  const bortleText = bortleScale ? ` (Bortle scale ${bortleScale})` : '';
  
  if (certification.includes('Park')) {
    return `${name} is a certified International Dark Sky Park with protected night skies and excellent stargazing conditions${bortleText}.`;
  }
  
  if (certification.includes('Reserve')) {
    return `${name} is a certified International Dark Sky Reserve combining a dark core zone with surrounding communities committed to dark sky preservation${bortleText}.`;
  }
  
  if (certification.includes('Sanctuary')) {
    return `${name} is a certified International Dark Sky Sanctuary - one of the darkest and most remote places in the world${bortleText}.`;
  }
  
  if (certification.includes('Community')) {
    return `${name} is a certified International Dark Sky Community that has shown exceptional dedication to preserving the night sky${bortleText}.`;
  }
  
  if (certification.includes('Urban Night Sky Place')) {
    return `${name} is a certified Urban Night Sky Place that demonstrates commitments to dark sky preservation despite nearby urban light pollution${bortleText}.`;
  }
  
  return `${name} is a certified dark sky location with ${certification} designation${bortleText}.`;
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
    
    // Generate a consistent ID from the name
    const id = `dark-sky-${entry.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
    
    // Get appropriate description based on certification type
    const description = getDarkSkyDescription(entry.name, entry.certification, entry.bortleScale);
    
    return {
      id,
      name: entry.name,
      latitude: entry.coordinates[0],
      longitude: entry.coordinates[1],
      siqs: Math.max(1, 10 - entry.bortleScale),
      bortleScale: entry.bortleScale,
      isDarkSkyReserve: true,
      certification: entry.certification || 'International Dark Sky Location',
      description,
      distance: distance,
      cloudCover: 0, // Will be calculated by SIQS service
      timestamp: new Date().toISOString(),
      isViable: true // Dark sky locations are generally viable for observation
    };
  } catch (error) {
    console.error(`Error converting location entry to AstroSpot: ${entry.name}`, error);
    
    // Return a minimal valid SharedAstroSpot object as fallback with required properties
    return {
      id: `dark-sky-${entry.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
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
