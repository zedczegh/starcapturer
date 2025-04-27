/**
 * Bortle scale service for managing light pollution data
 */

import { getTerrainCorrectedBortleScale } from "@/utils/terrainCorrection";

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
 * Enhanced Bortle scale data retrieval with additional context
 */
export async function getBortleScaleData(
  latitude: number,
  longitude: number,
  locationName: string,
  userProvidedBortleScale: number,
  displayOnly: boolean,
  getCachedData: (key: string, maxAge?: number) => any,
  setCachedData: (key: string, data: any) => void,
  language: string = 'en',
  setStatusMessage?: (message: string | null) => void
): Promise<number> {
  try {
    // Convert latitude/longitude to numbers if they are strings
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    
    // Try to get cached data first
    const cacheKey = `bortle-${lat.toFixed(4)}-${lng.toFixed(4)}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData && cachedData.bortleScale) {
      return cachedData.bortleScale;
    }
    
    // If user provided a value, use it (but still cache it)
    if (userProvidedBortleScale >= 1 && userProvidedBortleScale <= 9) {
      // Apply terrain correction if appropriate
      const corrected = await getTerrainCorrectedBortleScale(lat, lng, userProvidedBortleScale);
      
      // Store corrected value
      setCachedData(cacheKey, {
        bortleScale: corrected.correctedBortleScale,
        correction: corrected.correctionFactor,
        timestamp: new Date().toISOString()
      });
      
      return corrected.correctedBortleScale;
    }
    
    // Otherwise fetch the data
    const result = await getBortleScale(lat, lng);
    
    // Cache the result
    setCachedData(cacheKey, {
      bortleScale: result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    console.error("Error getting Bortle scale data:", error);
    // Default to suburban sky if data can't be retrieved
    return 5;
  }
}

/**
 * Clear the Bortle scale cache
 */
export function clearBortleScaleCache(): void {
  bortleCache.clear();
}

/**
 * Enhanced Bortle scale retrieval with advanced adjustments
 */
export async function getBortleScaleEnhanced(
  latitude: number,
  longitude: number,
  locationName: string = ""
): Promise<number> {
  // Get base Bortle scale
  const baseBortleScale = await getBortleScale(latitude, longitude);
  
  // Apply terrain-based corrections
  const { correctedBortleScale } = await getTerrainCorrectedBortleScale(
    latitude, 
    longitude, 
    baseBortleScale
  );
  
  // Apply location name-based adjustments if available
  let finalBortleScale = correctedBortleScale;
  
  if (locationName) {
    const lowerName = locationName.toLowerCase();
    
    // Check for keywords indicating dark sky sites
    if (
      lowerName.includes("observatory") || 
      lowerName.includes("dark sky") || 
      lowerName.includes("national park") ||
      lowerName.includes("wilderness")
    ) {
      // Reduce Bortle scale (darker skies)
      finalBortleScale = Math.max(1, finalBortleScale - 1);
    }
    
    // Check for keywords indicating urban areas
    if (
      lowerName.includes("city") ||
      lowerName.includes("downtown") ||
      lowerName.includes("metro")
    ) {
      // Increase Bortle scale (lighter skies)
      finalBortleScale = Math.min(9, finalBortleScale + 1);
    }
  }
  
  return finalBortleScale;
}
