
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { LocationCacheService } from "@/components/location/map/LocationNameService";
import { Language } from "@/services/geocoding/types";
import { identifyRemoteRegion, enhanceRemoteLocationName } from "@/services/geocoding/remoteRegionResolver";
import { getEnhancedLocationDetails } from "@/services/geocoding/enhancedReverseGeocoding";

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
    
    // Always try to get the most detailed location name possible
    try {
      // Use enhanced location details to get the most detailed name
      const enhancedDetails = await getEnhancedLocationDetails(latitude, longitude, language);
      
      // If we got a detailed name that includes street-level or multiple components
      if (enhancedDetails.formattedName && 
          (enhancedDetails.streetName || 
           enhancedDetails.formattedName.includes(',') || 
           enhancedDetails.formattedName.includes('，'))) {
        // Cache this detailed name
        if (cacheService && cacheService.setCachedData) {
          const cacheKey = `location_name_${latitude.toFixed(4)}_${longitude.toFixed(4)}_${language}`;
          cacheService.setCachedData(cacheKey, { 
            name: enhancedDetails.formattedName, 
            timestamp: Date.now() 
          });
        }
        
        return enhancedDetails.formattedName;
      }
    } catch (error) {
      console.error("Error getting enhanced location details:", error);
      // Continue with other methods if enhanced details failed
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
