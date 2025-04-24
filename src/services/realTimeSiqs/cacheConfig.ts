
/**
 * Configuration settings for SIQS caching system
 */

// Cache duration in milliseconds
export const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Cache cleanup interval
export const AUTO_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Maximum cache entries
export const MAX_CACHE_ENTRIES = 300;

/**
 * Get a consistent location key format for caching
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Consistent string key for the location
 */
export function getLocationKey(latitude: number, longitude: number): string {
  // Use 4 decimal places for sufficient precision (~11m accuracy)
  return `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
}

/**
 * Get current cache duration in milliseconds
 * This is a function to allow for dynamic adjustments in the future
 */
export function getCacheDuration(): number {
  return CACHE_DURATION;
}

/**
 * Check if two locations are effectively the same for caching purposes
 * @param lat1 First location latitude
 * @param lon1 First location longitude
 * @param lat2 Second location latitude
 * @param lon2 Second location longitude
 * @returns True if locations should use the same cache key
 */
export function areLocationsEquivalent(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): boolean {
  // Using 4 decimal places comparison (approximately 11m precision)
  return lat1.toFixed(4) === lat2.toFixed(4) && lon1.toFixed(4) === lon2.toFixed(4);
}

/**
 * Generate location ID suitable for routing and persistence
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Location ID string
 */
export function generateLocationId(latitude: number, longitude: number): string {
  return `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
}

/**
 * Extract coordinates from location ID
 * @param locationId Location ID string
 * @returns Coordinates object or null if invalid format
 */
export function extractCoordinatesFromId(locationId: string): { latitude: number, longitude: number } | null {
  if (!locationId.startsWith('loc-')) return null;
  
  try {
    const parts = locationId.replace('loc-', '').split('-');
    if (parts.length !== 2) return null;
    
    const latitude = parseFloat(parts[0]);
    const longitude = parseFloat(parts[1]);
    
    if (isNaN(latitude) || isNaN(longitude)) return null;
    
    return { latitude, longitude };
  } catch (error) {
    console.error("Error extracting coordinates from ID:", error);
    return null;
  }
}
