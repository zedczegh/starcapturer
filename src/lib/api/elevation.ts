
/**
 * Elevation data API functions
 */

import { memoize } from "@/utils/memoization";

// Cache for elevation data
const elevationCache = new Map<string, number>();

/**
 * Fetch elevation data for a specific location
 * 
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Elevation in meters above sea level
 */
export async function fetchElevation(
  latitude: number,
  longitude: number
): Promise<number> {
  // Create cache key
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Check cache first
  if (elevationCache.has(cacheKey)) {
    return elevationCache.get(cacheKey) || 0;
  }
  
  // In a real implementation, this would call an elevation API
  // For now, we'll use a deterministic algorithm to generate realistic elevations
  // based on coordinates
  
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate pseudo-random but deterministic elevation
    // This will generate the same elevation for the same coordinates
    const latSeed = Math.sin(latitude * 0.01745) * 10000;
    const lonSeed = Math.cos(longitude * 0.01745) * 10000;
    const baseSeed = (latSeed + lonSeed) * 0.5;
    
    // Add some "mountain ranges" and "plains"
    const mountainFactor = Math.sin(latitude * 0.05 + longitude * 0.05) * 0.5 + 0.5;
    
    // Generate elevation - Vary between 0 and 5000m with mountain patterns
    let elevation = Math.abs(baseSeed % 1000) + (mountainFactor * 4000);
    
    // Add some "sea level" points for coastal areas
    if (Math.abs(baseSeed % 7) < 1) {
      elevation = Math.min(elevation, 100);
    }
    
    // Round to the nearest meter
    elevation = Math.round(elevation);
    
    // Cache the result
    elevationCache.set(cacheKey, elevation);
    
    return elevation;
  } catch (error) {
    console.error("Error fetching elevation data:", error);
    return 0;
  }
}

/**
 * Clear the elevation cache
 */
export function clearElevationCache(): void {
  elevationCache.clear();
}

/**
 * Memoized version of the elevation fetching function
 */
export const memoizedFetchElevation = memoize(fetchElevation);
