
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { LocationCacheService } from "@/components/location/map/LocationNameService";
import { Language } from "@/services/geocoding/types";
import { identifyRemoteRegion, enhanceRemoteLocationName } from "@/services/geocoding/remoteRegionResolver";

/**
 * Optimized function to update location names with improved geocoding
 * Particularly helpful for remote regions like Tibet, Xinjiang, etc.
 * Added retry logic and better error handling for increased reliability
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
      
      // Use retry pattern for increased reliability
      let retryCount = 0;
      const maxRetries = 3;
      let lastError: any = null;
      
      while (retryCount < maxRetries) {
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
            console.log(`Successfully updated location name after ${retryCount} retries: ${currentName} -> ${newName}`);
            return newName;
          }
          break; // Exit retry loop if we get a response (even if unchanged)
        } catch (error) {
          lastError = error;
          retryCount++;
          console.warn(`Retry ${retryCount}/${maxRetries} for location name update failed:`, error);
          
          // Add exponential backoff for retries
          if (retryCount < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount - 1)));
          }
        }
      }
      
      // All retries failed, log and handle failure gracefully
      if (lastError) {
        console.error("All retries failed for remote region location name update:", lastError);
      }
      
      // If API fails after all retries, try to enhance the existing name
      if (currentName && !currentName.includes('°')) {
        return enhanceRemoteLocationName(latitude, longitude, currentName, language);
      }
      
      return currentName;
    }
    
    // For normal updates, only refresh if needed
    if (!currentName || 
        currentName.includes('°') || 
        currentName.includes('Unknown') || 
        currentName.includes('未知')) {
      
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
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
          break;
        } catch (error) {
          retryCount++;
          console.warn(`Retry ${retryCount}/${maxRetries} for location name update failed:`, error);
          
          // Add exponential backoff
          if (retryCount <= maxRetries) {
            await new Promise(r => setTimeout(r, 800 * Math.pow(1.5, retryCount - 1)));
          }
        }
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

/**
 * Utility function to determine if a location name is likely to be detailed enough
 * This helps avoid replacing detailed location names with less detailed ones
 */
export function isDetailedLocationName(name: string): boolean {
  if (!name) return false;
  
  // Check for typical patterns in detailed location names
  return (
    // Has street identifiers
    name.includes('Street') || name.includes('St.') || name.includes('Road') || 
    name.includes('Avenue') || name.includes('Ave.') || name.includes('Lane') ||
    // Has building numbers (likely detailed address)
    /^\d+\s+\w+/.test(name) ||
    // Has district information
    name.includes('District') || name.includes('Area') ||
    // Has multiple commas indicating hierarchical location info
    (name.split(',').length > 2)
  );
}
