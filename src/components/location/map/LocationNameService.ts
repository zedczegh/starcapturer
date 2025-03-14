
import { getLocationNameFromCoordinates } from "@/lib/api";
import { findClosestLocation } from "@/data/locationDatabase";
import type { Language } from "@/services/geocoding/types";

export type LocationCacheService = {
  setCachedData: (key: string, data: any) => void;
  getCachedData: (key: string) => any;
};

/**
 * Normalize longitude to be within -180 to 180 range
 */
export function normalizeLongitude(longitude: number): number {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

/**
 * Get a location name for given coordinates with fallback mechanisms
 */
export async function getLocationNameForCoordinates(
  latitude: number,
  longitude: number,
  language: Language = 'en',
  cacheService?: LocationCacheService
): Promise<string> {
  try {
    // Check cache first for faster response
    const cacheKey = `loc-name-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${language}`;
    if (cacheService) {
      const cachedName = cacheService.getCachedData(cacheKey);
      if (cachedName) {
        return cachedName;
      }
    }
    
    // Try to get location name from API
    try {
      const locationName = await getLocationNameFromCoordinates(latitude, longitude, language);
      
      // Cache successful result
      if (cacheService && locationName) {
        cacheService.setCachedData(cacheKey, locationName);
      }
      
      return locationName;
    } catch (apiError) {
      console.error("Error getting location name from API:", apiError);
      throw apiError;
    }
  } catch (error) {
    console.error("Error in getLocationNameForCoordinates:", error);
    
    // First fallback: Try database
    try {
      const fallbackCacheKey = `loc-name-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${language}`;
      const nearest = findClosestLocation(latitude, longitude);
      if (nearest && nearest.name) {
        const fallbackName = nearest.distance <= 20 
          ? nearest.name 
          : (language === 'en' ? `Near ${nearest.name}` : `${nearest.name}附近`);
        
        // Cache this result too
        if (cacheService) {
          cacheService.setCachedData(fallbackCacheKey, fallbackName);
        }
        
        return fallbackName;
      }
    } catch (dbError) {
      console.error("Database fallback failed:", dbError);
    }
    
    // Last resort: Use coordinates
    return language === 'en'
      ? `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
      : `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  }
}
