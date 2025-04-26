
/**
 * Elevation API service to fetch terrain elevation data
 */

// Cache for elevation data to minimize API calls
const elevationCache = new Map<string, number>();

/**
 * Fetch elevation data for a specific latitude/longitude
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Elevation in meters
 */
export async function fetchElevation(
  latitude: number,
  longitude: number
): Promise<number> {
  // Create cache key from coordinates
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Check cache first
  if (elevationCache.has(cacheKey)) {
    return elevationCache.get(cacheKey) || 0;
  }
  
  try {
    // In a real implementation, this would call an elevation API
    // For now, we'll simulate some elevation data based on coordinates
    
    // This is a simple placeholder that generates reasonable elevation values
    // based on latitude and longitude - replace with actual API call
    const elevation = Math.abs(Math.sin(latitude) * Math.cos(longitude) * 1500);
    
    // Add some randomness to simulate natural terrain
    const randomVariation = Math.random() * 200 - 100;
    const finalElevation = Math.max(0, Math.round(elevation + randomVariation));
    
    // Cache the result
    elevationCache.set(cacheKey, finalElevation);
    
    return finalElevation;
  } catch (error) {
    console.error("Error fetching elevation data:", error);
    return 0; // Default to sea level on error
  }
}

/**
 * Clear the elevation cache
 */
export function clearElevationCache(): void {
  elevationCache.clear();
}
