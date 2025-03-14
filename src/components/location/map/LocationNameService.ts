
import { findClosestKnownLocation } from "@/utils/locationUtils";
import { getLocationNameFromCoordinates } from "@/services/geocoding";
import type { Language } from "@/services/geocoding/types";

// Define CachedLocationData interface for type safety
export interface CachedLocationData {
  name?: string;
  formattedName?: string;
  bortleScale?: number;
}

export interface LocationCacheService {
  setCachedData: (key: string, data: CachedLocationData) => void;
  getCachedData: (key: string) => CachedLocationData | null;
}

/**
 * Get a proper location name from coordinates using multiple sources
 * @param lat Latitude
 * @param lng Longitude
 * @param language Current language
 * @param cacheService Cache service for storing and retrieving location data
 * @returns Promise resolving to a location name string
 */
export async function getLocationNameForCoordinates(
  lat: number, 
  lng: number, 
  language: Language, 
  cacheService: LocationCacheService
): Promise<string> {
  try {
    // Check cache first
    const cacheKey = `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`;
    const cachedData = cacheService.getCachedData(cacheKey);
    
    if (cachedData && typeof cachedData === 'object' && cachedData.name && !cachedData.name.includes("°")) {
      return cachedData.name;
    }
    
    // Try external API for reverse geocoding first
    try {
      const locationName = await getLocationNameFromCoordinates(lat, lng, language);
      if (locationName && !locationName.includes("°")) {
        // Cache this data
        cacheService.setCachedData(cacheKey, {
          name: locationName,
          formattedName: locationName
        });
        
        return locationName;
      }
    } catch (apiError) {
      console.error("Error getting location name from API:", apiError);
    }
    
    // Try from database as fallback
    const closestLocation = findClosestKnownLocation(lat, lng);
    
    // Use closest known location
    if (closestLocation.distance <= 20) {
      const locationName = closestLocation.name;
      cacheService.setCachedData(cacheKey, {
        name: locationName,
        bortleScale: closestLocation.bortleScale
      });
      return locationName;
    }
    
    if (closestLocation.distance <= 100) {
      const distanceText = language === 'en' ? 
        `Near ${closestLocation.name}` : 
        `${closestLocation.name}附近`;
      cacheService.setCachedData(cacheKey, {
        name: distanceText,
        bortleScale: closestLocation.bortleScale
      });
      return distanceText;
    }
    
    // Last resort
    const formattedName = language === 'en' ? 
      `Location at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°` : 
      `位置在 ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
      
    cacheService.setCachedData(cacheKey, {
      name: formattedName,
      bortleScale: 4
    });
    return formattedName;
  } catch (error) {
    console.error("Error getting location name for coordinates:", error);
    return language === 'en' ? 
      `Location at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°` : 
      `位置在 ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  }
}

/**
 * Normalize longitude to the range [-180, 180]
 */
export function normalizeLongitude(lng: number): number {
  return ((lng + 180) % 360 + 360) % 360 - 180;
}
