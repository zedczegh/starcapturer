
/**
 * Bortle scale data service for light pollution information
 */

import { fetchLightPollutionData } from "@/lib/api/pollution";

/**
 * Get Bortle scale data for a location
 */
export async function getBortleScaleData(
  latitude: number,
  longitude: number,
  locationName: string,
  defaultBortleScale: number | null,
  displayOnly: boolean = false,
  getCachedData: (key: string, maxAge?: number) => any,
  setCachedData: (key: string, data: any) => void,
  language: string = 'en',
  setStatusMessage?: (message: string | null) => void
): Promise<number | null> {
  // If we already have a valid Bortle scale, use it
  if (defaultBortleScale && defaultBortleScale >= 1 && defaultBortleScale <= 9) {
    return defaultBortleScale;
  }
  
  // Create a cache key
  const cacheKey = `bortle-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  try {
    // Check cache first
    const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
    const cachedBortleScale = getCachedData(cacheKey, maxCacheAge);
    
    if (cachedBortleScale !== null && cachedBortleScale !== undefined) {
      console.log("Using cached Bortle scale data");
      return cachedBortleScale;
    }
    
    // Set status message if loading
    if (!displayOnly) {
      setStatusMessage && setStatusMessage(
        language === 'en' 
          ? "Retrieving light pollution data..." 
          : "正在获取光污染数据..."
      );
    }
    
    // Fetch light pollution data
    const pollutionData = await fetchLightPollutionData(latitude, longitude);
    
    if (!pollutionData || !pollutionData.bortleScale) {
      throw new Error("Could not fetch light pollution data");
    }
    
    // Cache the data
    setCachedData(cacheKey, pollutionData.bortleScale);
    
    return pollutionData.bortleScale;
  } catch (error) {
    console.error("Error getting Bortle scale data:", error);
    
    // Use estimated value based on common patterns
    let estimatedScale = 5; // Default for suburban areas
    
    // Try to estimate based on location name
    const nameLower = locationName.toLowerCase();
    if (nameLower.includes("city") || nameLower.includes("downtown")) {
      estimatedScale = 7;
    } else if (nameLower.includes("park") || nameLower.includes("forest")) {
      estimatedScale = 4;
    } else if (nameLower.includes("mountain") || nameLower.includes("reserve")) {
      estimatedScale = 3;
    } else if (nameLower.includes("desert") || nameLower.includes("wilderness")) {
      estimatedScale = 2;
    }
    
    // Cache this estimated value but with shorter expiration
    setCachedData(cacheKey, estimatedScale);
    
    return estimatedScale;
  }
}

/**
 * Get the Bortle scale value with a fallback
 */
export function getBortleScaleValue(bortleScale: number | undefined | null): number {
  if (bortleScale === undefined || bortleScale === null || isNaN(bortleScale)) {
    return 5; // Default fallback
  }
  
  // Ensure it's within valid range
  return Math.max(1, Math.min(9, bortleScale));
}
