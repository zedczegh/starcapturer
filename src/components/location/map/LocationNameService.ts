
import { findClosestKnownLocation } from "@/utils/locationUtils";
import { getLocationNameFromCoordinates as fetchLocationNameFromAPI } from "@/services/geocoding";
import type { Language } from "@/services/geocoding/types";

// Define CachedLocationData interface for type safety
export interface CachedLocationData {
  name?: string;
  formattedName?: string;
  bortleScale?: number;
  nameInEnglish?: string;
  nameInChinese?: string;
  timestamp?: number; // Add timestamp for cache freshness
}

export interface LocationCacheService {
  setCachedData: (key: string, data: CachedLocationData) => void;
  getCachedData: (key: string) => CachedLocationData | null;
}

/**
 * Format location name according to language-specific patterns
 * @param address The address object returned from API
 * @param language Current language 
 */
export function formatLocationAddress(address: any, language: Language): string {
  if (!address) return "";
  
  // For English: town, county, state, country, zip code
  // For Chinese: 区，市，省，国家，邮编
  let formattedParts = [];
  
  if (language === 'en') {
    // English format
    if (address.village || address.town || address.hamlet || address.suburb) {
      formattedParts.push(address.village || address.town || address.hamlet || address.suburb);
    }
    if (address.city) {
      formattedParts.push(address.city);
    }
    if (address.county) {
      formattedParts.push(address.county);
    }
    if (address.state) {
      formattedParts.push(address.state);
    }
    if (address.country) {
      formattedParts.push(address.country);
    }
    if (address.postcode) {
      formattedParts.push(address.postcode);
    }
  } else {
    // Chinese format
    if (address.suburb || address.village || address.hamlet) {
      formattedParts.push(address.suburb || address.village || address.hamlet);
    }
    if (address.town) {
      formattedParts.push(address.town);
    }
    if (address.city) {
      formattedParts.push(address.city);
    }
    if (address.county) {
      formattedParts.push(address.county);
    }
    if (address.state) {
      formattedParts.push(address.state);
    }
    if (address.country) {
      formattedParts.push(address.country);
    }
    if (address.postcode) {
      formattedParts.push(address.postcode);
    }
  }
  
  // Remove duplicates while preserving order
  const uniqueParts = [...new Set(formattedParts)];
  
  return uniqueParts.join(language === 'en' ? ', ' : '，');
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
    
    // If we have cached data with translated names
    if (cachedData && typeof cachedData === 'object') {
      // Return language-specific name if available
      if (language === 'en' && cachedData.nameInEnglish) {
        return cachedData.nameInEnglish;
      } 
      if (language === 'zh' && cachedData.nameInChinese) {
        return cachedData.nameInChinese;
      }
      
      // Fallback to general name if it doesn't include coordinates
      if (cachedData.name && !cachedData.name.includes("°")) {
        return cachedData.name;
      }
    }
    
    // Try external API for reverse geocoding first
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${language}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Format the address based on our desired pattern
        let locationName = "";
        
        if (data.address) {
          locationName = formatLocationAddress(data.address, language);
        }
        
        // If formatting didn't work or no structured address, fall back to display_name
        if (!locationName && data.display_name) {
          const parts = data.display_name.split(',');
          locationName = parts.slice(0, Math.min(4, parts.length)).join(language === 'en' ? ', ' : '，');
        }
        
        // Last fallback to name field
        if (!locationName && data.name) {
          locationName = data.name;
        }
        
        if (locationName && !locationName.includes("°")) {
          // Try to get the name in the other language too
          const otherLanguage = language === 'en' ? 'zh' : 'en';
          let otherLanguageName = null;
          
          try {
            const otherResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${otherLanguage}`
            );
            
            if (otherResponse.ok) {
              const otherData = await otherResponse.json();
              if (otherData.address) {
                otherLanguageName = formatLocationAddress(otherData.address, otherLanguage);
              }
              
              if (!otherLanguageName && otherData.display_name) {
                const parts = otherData.display_name.split(',');
                otherLanguageName = parts.slice(0, Math.min(4, parts.length)).join(otherLanguage === 'en' ? ', ' : '，');
              }
            }
          } catch (error) {
            console.error("Error getting other language name:", error);
          }
          
          // Cache both language versions
          const cacheData: CachedLocationData = {
            name: locationName,
            formattedName: locationName,
            timestamp: Date.now()
          };
          
          if (language === 'en') {
            cacheData.nameInEnglish = locationName;
            if (otherLanguageName) cacheData.nameInChinese = otherLanguageName;
          } else {
            cacheData.nameInChinese = locationName;
            if (otherLanguageName) cacheData.nameInEnglish = otherLanguageName;
          }
          
          cacheService.setCachedData(cacheKey, cacheData);
          return locationName;
        }
      }
    } catch (apiError) {
      console.error("Error getting location name from API:", apiError);
    }
    
    // Try from database as fallback
    const closestLocation = findClosestKnownLocation(lat, lng);
    
    // Use closest known location
    if (closestLocation.distance <= 20) {
      const locationName = closestLocation.name;
      // For locations from our database, we don't have translations yet
      // In a production app, we would store both language versions
      cacheService.setCachedData(cacheKey, {
        name: locationName,
        nameInEnglish: locationName,
        nameInChinese: locationName, // Ideally this would be translated
        bortleScale: closestLocation.bortleScale,
        timestamp: Date.now()
      });
      return locationName;
    }
    
    if (closestLocation.distance <= 100) {
      const englishText = `Near ${closestLocation.name}`;
      const chineseText = `${closestLocation.name}附近`;
      const distanceText = language === 'en' ? englishText : chineseText;
      
      cacheService.setCachedData(cacheKey, {
        name: distanceText,
        nameInEnglish: englishText,
        nameInChinese: chineseText,
        bortleScale: closestLocation.bortleScale,
        timestamp: Date.now()
      });
      return distanceText;
    }
    
    // Last resort
    const englishName = `Location at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
    const chineseName = `位置在 ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
    const formattedName = language === 'en' ? englishName : chineseName;
      
    cacheService.setCachedData(cacheKey, {
      name: formattedName,
      nameInEnglish: englishName,
      nameInChinese: chineseName,
      bortleScale: 4,
      timestamp: Date.now()
    });
    return formattedName;
  } catch (error) {
    console.error("Error getting location name for coordinates:", error);
    const englishName = `Location at ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
    const chineseName = `位置在 ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
    return language === 'en' ? englishName : chineseName;
  }
}

/**
 * Normalize longitude to the range [-180, 180]
 */
export function normalizeLongitude(lng: number): number {
  return ((lng + 180) % 360 + 360) % 360 - 180;
}
