
import { Language } from "@/services/geocoding/types";

export interface LocationCacheService {
  setCachedData: (key: string, data: any, ttl?: number) => Promise<void>;
  getCachedData: (key: string) => any;
}

/**
 * Optimized function to update location names with improved geocoding
 * Particularly helpful for remote regions like Tibet, Xinjiang, etc.
 */
export async function updateLocationName(
  latitude: number,
  longitude: number,
  currentName: string,
  language: Language,
  cacheService: LocationCacheService
): Promise<string> {
  try {
    // Skip processing invalid coordinates
    if (!isFinite(latitude) || !isFinite(longitude)) {
      return currentName || (language === 'en' ? 'Unknown Location' : '未知位置');
    }
    
    // Check if we're in a remote region that needs special handling
    const isRemoteRegion = identifyRemoteRegion(latitude, longitude);
    
    // If we're in a remote region and the current name doesn't look right,
    // prioritize getting an accurate regional name
    if (isRemoteRegion && 
        (!currentName || 
         currentName.includes('°') || 
         currentName.includes('Unknown') || 
         currentName.includes('未知'))) {
      
      try {
        const newName = await getLocationNameForCoordinates(
          latitude, 
          longitude, 
          language, 
          {
            setCachedData: cacheService.setCachedData,
            getCachedData: cacheService.getCachedData
          }
        );
        
        if (newName && newName !== currentName) {
          return newName;
        }
      } catch (error) {
        console.error("Error updating location name for remote region:", error);
        
        // If API fails, try to enhance the existing name
        if (currentName && !currentName.includes('°')) {
          return enhanceRemoteLocationName(latitude, longitude, currentName, language);
        }
        
        return currentName;
      }
    }
    
    // For normal updates, only refresh if needed
    if (!currentName || 
        currentName.includes('°') || 
        currentName.includes('Unknown') || 
        currentName.includes('未知')) {
      
      try {
        const newName = await getLocationNameForCoordinates(
          latitude, 
          longitude, 
          language, 
          {
            setCachedData: cacheService.setCachedData,
            getCachedData: cacheService.getCachedData
          }
        );
        
        if (newName) {
          return newName;
        }
      } catch (error) {
        console.error("Error updating location name:", error);
      }
    } else if (isRemoteRegion) {
      // Even for non-empty names, if in remote regions, ensure they have proper context
      return enhanceRemoteLocationName(latitude, longitude, currentName, language);
    }
    
    // Return existing name if we couldn't get a better one
    return currentName;
  } catch (error) {
    console.error("Error in updateLocationName utility:", error);
    return currentName;
  }
}

// Placeholder functions that would be implemented in the actual service
function identifyRemoteRegion(latitude: number, longitude: number): boolean {
  // Implementation would check if coordinates are in remote regions
  return false;
}

async function getLocationNameForCoordinates(
  latitude: number, 
  longitude: number, 
  language: Language, 
  cacheService: LocationCacheService
): Promise<string> {
  // Implementation would fetch location name
  return `Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
}

function enhanceRemoteLocationName(
  latitude: number, 
  longitude: number, 
  currentName: string, 
  language: Language
): string {
  // Implementation would enhance location name for remote regions
  return currentName;
}
