
/**
 * Bortle scale service for managing light pollution data
 */

import { getTerrainCorrectedBortleScale } from "../utils/terrainCorrection";

// Cache for Bortle scale data
const bortleCache = new Map<string, number>();

/**
 * Get Bortle scale value for a specific location
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Bortle scale value (1-9)
 */
export async function getBortleScale(
  latitude: number,
  longitude: number
): Promise<number> {
  try {
    // Create cache key
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    // Check cache first
    if (bortleCache.has(cacheKey)) {
      return bortleCache.get(cacheKey) || 5;
    }
    
    // In a real implementation, this would call an API
    // For now, we'll estimate based on coordinates
    
    // Use a basic algorithm to estimate Bortle scale
    // This is just a placeholder for demonstration purposes
    const distance = Math.sqrt(
      Math.pow(latitude - 40, 2) + Math.pow(longitude - 116, 2)
    );
    
    // Scale from 1-9 (1 = dark sky, 9 = city center)
    let bortleScale = Math.min(9, Math.max(1, Math.round(3 + distance * 0.5)));
    
    // Cache the result
    bortleCache.set(cacheKey, bortleScale);
    
    return bortleScale;
  } catch (error) {
    console.error("Error getting Bortle scale:", error);
    return 5; // Default to suburban sky
  }
}

/**
 * Clear the Bortle scale cache
 */
export function clearBortleScaleCache(): void {
  bortleCache.clear();
}
