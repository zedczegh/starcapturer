
/**
 * Service for efficiently retrieving Dark Sky locations
 * Provides optimized access to the dark sky locations database
 */

import { locationDatabase, LocationEntry } from '@/data/locationDatabase';
import { calculateDistance } from '@/lib/api/coordinates';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationValidator';

// Cache of dark sky locations for quick access
let cachedDarkSkyLocations: LocationEntry[] | null = null;
// Cache for filtered locations by radius
const radiusCache = new Map<string, LocationEntry[]>();

// Constants for intelligent loading
const CACHE_TTL = 3600000; // 1 hour cache validity
let cacheTimestamp = 0;

/**
 * Get all dark sky locations from the database with intelligent filtering
 * @returns Array of LocationEntry with type 'dark-site'
 */
export function getAllDarkSkyLocations(): LocationEntry[] {
  const now = Date.now();
  
  // Check if cache is expired
  if (!cachedDarkSkyLocations || (now - cacheTimestamp > CACHE_TTL)) {
    try {
      // Filter dark-site locations and exclude water locations
      const darkSiteLocations = locationDatabase.filter(loc => loc.type === 'dark-site');
      const filteredLocations = darkSiteLocations.filter(loc => {
        // Skip water locations with improved detection
        if (loc.bortleScale <= 2) {
          // For premium dark sites, use more accurate water detection
          const isWater = isWaterLocation(loc.coordinates[0], loc.coordinates[1], true);
          if (isWater) {
            return false;
          }
        } else {
          // For urban or less dark sites, use standard water detection
          const isWater = isWaterLocation(loc.coordinates[0], loc.coordinates[1]);
          if (isWater) {
            return false;
          }
        }
        return true;
      });
      
      cachedDarkSkyLocations = filteredLocations;
      cacheTimestamp = now;
      
      // Clear radius cache when main cache is refreshed
      radiusCache.clear();
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
    // Check cache first using a key based on coordinates and radius
    const cacheKey = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
    const cachedResult = radiusCache.get(cacheKey);
    if (cachedResult) {
      console.log(`Using cached dark sky locations for ${cacheKey}`);
      return cachedResult;
    }
    
    // If no cache hit, calculate from full dataset
    const darkSkyLocations = getAllDarkSkyLocations();
    
    // Use more efficient filtering
    const result = darkSkyLocations.filter(location => {
      try {
        // For dark sky sites, always include those with bortleScale <= 2
        // regardless of distance if radius > 500km to ensure we show premium sites
        if (location.bortleScale <= 2 && radius > 500) {
          return true;
        }
        
        // Calculate distance only if needed
        const distance = calculateDistance(
          latitude,
          longitude,
          location.coordinates[0],
          location.coordinates[1]
        );
        
        // Include if within radius or if it's a premium dark sky location within reasonable distance
        if (distance <= radius) {
          return true;
        }
        
        // Always include very dark sites (Bortle 1-2) if within extended radius
        if (location.bortleScale <= 2 && distance <= radius * 1.5) {
          return true;
        }
        
        return false;
      } catch (error) {
        console.error(`Error calculating distance for location ${location.name}:`, error);
        return false;
      }
    });
    
    // Cache the result for future use
    radiusCache.set(cacheKey, result);
    
    // Limit cache size to prevent memory issues
    if (radiusCache.size > 100) {
      // Remove oldest entry
      const firstKey = radiusCache.keys().next().value;
      radiusCache.delete(firstKey);
    }
    
    return result;
  } catch (error) {
    console.error("Error finding dark sky locations within radius:", error);
    return [];
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
    
    // Create more detailed certification info based on the location name
    let certification = 'International Dark Sky Association';
    
    if (entry.name.includes("Sanctuary")) {
      certification = "IDA Dark Sky Sanctuary";
    } else if (entry.name.includes("Reserve")) {
      certification = "IDA Dark Sky Reserve";
    } else if (entry.name.includes("Park") && !entry.name.includes("Community")) {
      certification = "IDA Dark Sky Park";
    } else if (entry.name.includes("Community") || entry.name.includes("Town") || entry.name.includes("City")) {
      certification = "IDA Dark Sky Community";
    } else if (entry.name.includes("Urban")) {
      certification = "IDA Urban Night Sky Place";
    }
    
    // Calculate SIQS based on Bortle scale with some variation
    // Base SIQS score is inversely proportional to Bortle scale
    const baseScore = Math.max(1, 10 - entry.bortleScale);
    
    // Add some variation based on properties to differentiate locations
    let siqsModifier = 0;
    
    // Premium locations get a slight boost
    if (entry.bortleScale <= 2) {
      siqsModifier += 0.2;
    }
    
    // Larger protected areas get a boost
    if (entry.radius >= 40) {
      siqsModifier += 0.3;
    }
    
    // Calculate final SIQS value, capped at 9.5 for realism
    const siqs = Math.min(9.5, baseScore + siqsModifier);
    
    return {
      id: `dark-sky-${entry.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: entry.name,
      latitude: entry.coordinates[0],
      longitude: entry.coordinates[1],
      siqs: siqs,
      bortleScale: entry.bortleScale,
      isDarkSkyReserve: true,
      certification: certification,
      description: `${entry.name} is a certified dark sky location with excellent viewing conditions (Bortle scale ${entry.bortleScale}).`,
      distance: distance,
      timestamp: new Date().toISOString(),
      isViable: true
    };
  } catch (error) {
    console.error(`Error converting location entry to AstroSpot: ${entry.name}`, error);
    
    // Return a minimal valid SharedAstroSpot object as fallback with required properties
    return {
      id: `dark-sky-${entry.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: entry.name,
      latitude: entry.coordinates[0],
      longitude: entry.coordinates[1],
      bortleScale: entry.bortleScale || 5,
      siqs: 0,
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
    console.log(`Retrieving dark sky locations within ${radius}km of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    const locations = findDarkSkyLocationsWithinRadius(latitude, longitude, radius);
    
    // Always ensure we're showing at least some premium dark sky locations
    if (locations.length < 5 && radius < 1000) {
      console.log("Not enough dark sky locations in range, extending search");
      const extendedLocations = findDarkSkyLocationsWithinRadius(latitude, longitude, Math.max(1000, radius * 2));
      // Filter to only include premium locations (Bortle 1-2)
      const premiumLocations = extendedLocations.filter(loc => loc.bortleScale <= 2);
      
      // Take the 5 closest premium locations
      const premiumSpots = premiumLocations.map(loc => ({
        location: loc,
        distance: calculateDistance(latitude, longitude, loc.coordinates[0], loc.coordinates[1])
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)
      .map(item => item.location);
      
      // Return the locations in range plus the premium locations
      return [...locations, ...premiumSpots]
        .filter((loc, index, self) => 
          // Remove duplicates
          index === self.findIndex(t => 
            t.coordinates[0] === loc.coordinates[0] && t.coordinates[1] === loc.coordinates[1]
          )
        )
        .map(location => convertToSharedAstroSpot(location, latitude, longitude));
    }
    
    return locations.map(location => 
      convertToSharedAstroSpot(location, latitude, longitude)
    );
  } catch (error) {
    console.error("Error getting dark sky astro spots:", error);
    return [];
  }
}

/**
 * Clear all caches to force fresh data loading
 */
export function clearDarkSkyCache(): void {
  cachedDarkSkyLocations = null;
  radiusCache.clear();
  cacheTimestamp = 0;
  console.log("All dark sky location caches cleared");
}

/**
 * Get specific dark sky location categories
 * @param category The category to filter by ('sanctuary', 'reserve', 'park', 'community', 'urban')
 * @returns Array of SharedAstroSpot of the specified category
 */
export function getDarkSkyLocationsByCategory(
  category: 'sanctuary' | 'reserve' | 'park' | 'community' | 'urban',
  latitude: number,
  longitude: number
): SharedAstroSpot[] {
  const allLocations = getAllDarkSkyLocations();
  
  let filtered: LocationEntry[] = [];
  
  switch (category) {
    case 'sanctuary':
      filtered = allLocations.filter(loc => loc.name.includes("Sanctuary"));
      break;
    case 'reserve':
      filtered = allLocations.filter(loc => loc.name.includes("Reserve"));
      break;
    case 'park':
      filtered = allLocations.filter(loc => 
        loc.name.includes("Park") && !loc.name.includes("Community")
      );
      break;
    case 'community':
      filtered = allLocations.filter(loc => 
        loc.name.includes("Community") || 
        (loc.radius <= 15 && (loc.name.includes("Town") || loc.name.includes("City")))
      );
      break;
    case 'urban':
      filtered = allLocations.filter(loc => 
        loc.name.includes("Urban") || loc.bortleScale >= 5
      );
      break;
  }
  
  return filtered.map(location => 
    convertToSharedAstroSpot(location, latitude, longitude)
  );
}
