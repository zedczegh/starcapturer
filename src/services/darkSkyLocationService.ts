
/**
 * Service for efficiently retrieving Dark Sky locations
 * Provides optimized access to the dark sky locations database
 */

import { locationDatabase, LocationEntry } from '@/data/locationDatabase';
import { calculateDistance } from '@/lib/api/coordinates';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Cache of dark sky locations for quick access
let cachedDarkSkyLocations: LocationEntry[] | null = null;
let lastCacheTimestamp: number = 0;
const CACHE_VALIDITY_PERIOD = 30 * 60 * 1000; // 30 minutes

/**
 * Get all dark sky locations from the database with improved caching
 * @returns Array of LocationEntry with type 'dark-site'
 */
export function getAllDarkSkyLocations(): LocationEntry[] {
  const now = Date.now();
  
  // Check if cache is valid
  if (!cachedDarkSkyLocations || now - lastCacheTimestamp > CACHE_VALIDITY_PERIOD) {
    try {
      cachedDarkSkyLocations = locationDatabase.filter(loc => loc.type === 'dark-site');
      lastCacheTimestamp = now;
    } catch (error) {
      console.error("Error filtering dark sky locations:", error);
      return [];
    }
  }
  
  return cachedDarkSkyLocations || [];
}

/**
 * Find dark sky locations within a radius with error handling
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
  // Validate inputs
  if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(radius)) {
    console.error("Invalid coordinates or radius for dark sky location search");
    return [];
  }
  
  if (radius <= 0) {
    return [];
  }
  
  try {
    const darkSkyLocations = getAllDarkSkyLocations();
    
    return darkSkyLocations.filter(location => {
      try {
        if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
          console.error(`Invalid coordinates for location ${location.name}`);
          return false;
        }
        
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
 * Convert LocationEntry to SharedAstroSpot format with improved error handling
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
    // Validate coordinates
    if (!Array.isArray(entry.coordinates) || entry.coordinates.length !== 2) {
      throw new Error(`Invalid coordinates for location ${entry.name}`);
    }
    
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
      siqs: Math.max(1, 10 - (entry.bortleScale || 1)), // Default to high SIQS if no Bortle
      bortleScale: entry.bortleScale || 1, // Assume excellent conditions if not specified
      isDarkSkyReserve: true,
      certification: entry.certification || 'International Dark Sky Location',
      description,
      distance: distance,
      cloudCover: 0, // Will be calculated by SIQS service
      timestamp: new Date().toISOString(),
      isViable: true, // Dark sky locations are generally viable for observation
      type: entry.type || 'dark-site' // Include the type information
    };
  } catch (error) {
    console.error(`Error converting location entry to AstroSpot: ${entry.name}`, error);
    
    // Return a minimal valid SharedAstroSpot object as fallback with required properties
    return {
      id: `dark-sky-${entry.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
      name: entry.name,
      latitude: entry.coordinates?.[0] || 0,
      longitude: entry.coordinates?.[1] || 0,
      bortleScale: entry.bortleScale || 1, // Provide a default value
      siqs: entry.bortleScale ? Math.max(1, 10 - entry.bortleScale) : 9, // Default high SIQS
      timestamp: new Date().toISOString(),
      isDarkSkyReserve: true,
      certification: entry.certification || 'International Dark Sky Location'
    };
  }
}

/**
 * Get dark sky locations as SharedAstroSpot objects with better error handling
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
  if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(radius)) {
    console.error("Invalid parameters for getDarkSkyAstroSpots");
    return [];
  }
  
  try {
    const locations = findDarkSkyLocationsWithinRadius(latitude, longitude, radius);
    
    return locations.map(location => 
      convertToSharedAstroSpot(location, latitude, longitude)
    ).filter(spot => !!spot.id); // Filter out any invalid spots
  } catch (error) {
    console.error("Error getting dark sky astro spots:", error);
    return [];
  }
}

/**
 * Find a specific dark sky location by name
 * @param name Name to search for
 * @returns LocationEntry if found, null otherwise
 */
export function findDarkSkyLocationByName(name: string): LocationEntry | null {
  if (!name) return null;
  
  try {
    const darkSkyLocations = getAllDarkSkyLocations();
    const normalizedSearch = name.toLowerCase().trim();
    
    // Try exact match first
    const exactMatch = darkSkyLocations.find(
      loc => loc.name.toLowerCase() === normalizedSearch
    );
    
    if (exactMatch) return exactMatch;
    
    // Try partial match
    const partialMatch = darkSkyLocations.find(
      loc => loc.name.toLowerCase().includes(normalizedSearch)
    );
    
    return partialMatch || null;
  } catch (error) {
    console.error("Error finding dark sky location by name:", error);
    return null;
  }
}
