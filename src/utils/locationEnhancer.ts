import { Location } from "@/services/geocoding/types";
import { getLocationInfo, findClosestLocation } from "@/utils/locationDatabase";

/**
 * Enhances a location with Bortle scale information
 * @param location The location to enhance
 * @param t Translation function
 * @returns Enhanced location with Bortle scale information where available
 */
export const enhanceLocationWithBortleScale = (
  location: Location, 
  t: (en: string, zh: string) => string
): Location => {
  try {
    // Try to get more detailed location info from our internal database
    const locationInfo = getLocationInfo(location.latitude, location.longitude);
    
    if (locationInfo) {
      return {
        ...location,
        bortleScale: locationInfo.bortleScale,
        placeDetails: location.placeDetails || 
          (locationInfo.bortleScale ? 
            t(`Bortle Scale: ${locationInfo.bortleScale}`, `波尔特等级: ${locationInfo.bortleScale}`) : 
            undefined)
      };
    }
    
    // If no specific location info, try to find the closest known location
    const closestLocation = findClosestLocation(location.latitude, location.longitude);
    if (closestLocation) {
      return {
        ...location,
        bortleScale: closestLocation.bortleScale,
        placeDetails: location.placeDetails || 
          (closestLocation.bortleScale ? 
            t(`Bortle Scale: ${closestLocation.bortleScale}`, `波尔特等级: ${closestLocation.bortleScale}`) : 
            undefined)
      };
    }
  } catch (error) {
    console.error("Error enhancing location with bortle info:", error);
  }
  
  return location;
};

/**
 * Creates a location object for the current position
 * @param latitude Current latitude
 * @param longitude Current longitude
 * @param t Translation function
 * @returns Enhanced location object with available data
 */
export const createCurrentPositionLocation = (
  latitude: number,
  longitude: number,
  t: (en: string, zh: string) => string
): Location => {
  try {
    // Get enhanced location info for current position
    const locationInfo = getLocationInfo(latitude, longitude);
    
    // Create location object with enhanced data if available
    return {
      name: locationInfo ? locationInfo.name : t("Current Location", "当前位置"),
      latitude,
      longitude,
      bortleScale: locationInfo ? locationInfo.bortleScale : undefined
    };
  } catch (error) {
    console.error("Error getting location info:", error);
    
    // Fallback to basic location
    return {
      name: t("Current Location", "当前位置"),
      latitude,
      longitude
    };
  }
};

/**
 * Enhances a selected location with additional data before passing to a handler
 * @param location The selected location
 * @returns Enhanced location with additional data where available
 */
export const enhanceSelectedLocation = (location: Location): Location => {
  try {
    // Try to enhance the selected location with additional data
    const locationInfo = getLocationInfo(location.latitude, location.longitude);
    
    // Merge additional data if available
    if (locationInfo) {
      return {
        ...location,
        bortleScale: locationInfo.bortleScale,
        formattedName: locationInfo.formattedName
      };
    }
  } catch (error) {
    console.error("Error enhancing selected location:", error);
  }
  
  // Otherwise return the location as is
  return location;
};
