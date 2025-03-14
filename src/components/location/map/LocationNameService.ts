
import { findClosestKnownLocation } from "@/utils/locationUtils";
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
      const locationName = await fetchLocationNameFromAPI(lat, lng, language);
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
 * Fetch location name from an external API
 */
async function fetchLocationNameFromAPI(lat: number, lng: number, language: Language): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${language}`
  );
  
  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with status: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Format the address based on available data
  let locationName = '';
  
  if (data.name) {
    locationName = data.name;
  } else if (data.address) {
    const address = data.address;
    
    if (address.city || address.town || address.village) {
      locationName = address.city || address.town || address.village;
    } else if (address.county) {
      locationName = address.county;
    } else if (address.state) {
      locationName = address.state;
    } else if (address.country) {
      locationName = 
        language === 'en' ? 
          `Location in ${address.country}` : 
          `${address.country}中的位置`;
    }
  }
  
  if (!locationName) {
    throw new Error('No location name found in response');
  }
  
  return locationName;
}

/**
 * Normalize longitude to the range [-180, 180]
 */
export function normalizeLongitude(lng: number): number {
  return ((lng + 180) % 360 + 360) % 360 - 180;
}
