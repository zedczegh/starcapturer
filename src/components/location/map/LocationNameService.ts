import { getLocationNameFromCoordinates } from "@/lib/api";
import { findClosestLocation } from "@/data/locationDatabase";
import type { Language } from "@/services/geocoding/types";
import { enhanceRemoteLocationName, identifyRemoteRegion } from "@/services/geocoding/remoteRegionResolver";
import { formatLocationName, getRegionalName } from "@/utils/locationNameFormatter";

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
 * Enhanced to better handle remote regions and provide more useful names
 */
export async function getLocationNameForCoordinates(
  latitude: number,
  longitude: number,
  language: Language = 'en',
  cacheService?: LocationCacheService
): Promise<string> {
  try {
    // Validate coordinates
    if (!isFinite(latitude) || !isFinite(longitude)) {
      return language === 'en'
        ? `Unknown Location`
        : `未知位置`;
    }
    
    // Normalize coordinates
    const normalizedLng = normalizeLongitude(longitude);
    
    // Check cache first for faster response
    const cacheKey = `loc-name-${latitude.toFixed(4)}-${normalizedLng.toFixed(4)}-${language}`;
    if (cacheService) {
      const cachedName = cacheService.getCachedData(cacheKey);
      if (cachedName) {
        return cachedName;
      }
    }
    
    // Check if we're in a remote region that needs special handling
    const isRemoteRegion = identifyRemoteRegion(latitude, normalizedLng);
    
    // Try to get location name from API
    try {
      const locationName = await getLocationNameFromCoordinates(latitude, normalizedLng, language);
      
      // For remote regions, enhance the name if needed
      let finalName = locationName;
      
      // If we get coordinates back or "Location at", try to improve the result
      if (finalName.includes("°") || finalName.includes("Location at") || finalName.includes("位置在") || 
          finalName.includes("Remote area") || finalName.includes("偏远地区")) {
        
        // For remote regions, use directional naming (like "Northwest Yunnan")
        const regionalName = getRegionalName(latitude, longitude, language);
        
        // If we got a valid regional name, use it
        if (regionalName !== (language === 'en' ? 'Remote area' : '偏远地区')) {
          finalName = regionalName;
        } 
        // Otherwise fallback to other methods
        else if (isRemoteRegion) {
          finalName = enhanceRemoteLocationName(latitude, normalizedLng, null, language);
        } else {
          // Try database fallback
          const nearest = findClosestLocation(latitude, longitude);
          if (nearest && nearest.name) {
            finalName = nearest.distance <= 50 
              ? (language === 'en' ? `Near ${nearest.name}` : `靠近${nearest.name}`)
              : (language === 'en' ? `Region of ${nearest.name}` : `${nearest.name}地区`);
          } else {
            finalName = language === 'en' ? 'Remote area' : '偏远地区';
          }
        }
      }
      
      // Format the final name
      const formattedName = formatLocationName(finalName, language);
      
      // Cache successful result
      if (cacheService && formattedName) {
        cacheService.setCachedData(cacheKey, formattedName);
      }
      
      return formattedName;
    } catch (apiError) {
      console.error("Error getting location name from API:", apiError);
      // Continue to fallbacks
    }
  } catch (error) {
    console.error("Error in getLocationNameForCoordinates:", error);
    
    // Use directional naming for remote regions
    const regionalName = getRegionalName(latitude, longitude, language);
    
    // If we got a valid regional name, use it and cache it
    if (regionalName !== (language === 'en' ? 'Remote area' : '偏远地区')) {
      // Cache this result too
      if (cacheService) {
        const fallbackCacheKey = `loc-name-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${language}`;
        cacheService.setCachedData(fallbackCacheKey, regionalName);
      }
      
      return regionalName;
    }
    
    // Special handling for remote regions
    const isRemoteRegion = identifyRemoteRegion(latitude, longitude);
    if (isRemoteRegion) {
      const enhancedName = enhanceRemoteLocationName(latitude, longitude, null, language);
      
      // Cache this result too
      if (cacheService && enhancedName) {
        const fallbackCacheKey = `loc-name-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${language}`;
        cacheService.setCachedData(fallbackCacheKey, enhancedName);
      }
      
      return enhancedName;
    }
    
    // First fallback: Try database
    try {
      const fallbackCacheKey = `loc-name-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${language}`;
      const nearest = findClosestLocation(latitude, longitude);
      if (nearest && nearest.name) {
        const fallbackName = nearest.distance <= 20 
          ? nearest.name 
          : (language === 'en' ? `Near ${nearest.name}` : `靠近${nearest.name}`);
        
        // Cache this result too
        if (cacheService) {
          cacheService.setCachedData(fallbackCacheKey, fallbackName);
        }
        
        return fallbackName;
      }
    } catch (dbError) {
      console.error("Database fallback failed:", dbError);
    }
    
    // Last resort: More descriptive fallback
    return language === 'en'
      ? `Remote area`
      : `偏远地区`;
  }
}
