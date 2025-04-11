
import { findClosestLocation } from "@/data/locationDatabase";

/**
 * Get the Bortle scale based on latitude, longitude, and location type
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @returns Bortle scale (1-9)
 */
export const getBortleScale = (latitude: number, longitude: number): number => {
  // First, try to get the Bortle scale for a specific city location
  const cityBortle = getCityBortleScale(latitude, longitude);
  
  // If the city Bortle scale is available, return it
  if (cityBortle) {
    return cityBortle;
  }
  
  // If the city Bortle scale is not available, return a default value
  return getDefaultBortleScale();
};

/**
 * Get the default Bortle scale
 * @returns Default Bortle scale (4)
 */
export const getDefaultBortleScale = (): number => {
  return 4; // Default to class 4 (rural sky)
};

/**
 * Get the Bortle scale for a specific city location
 */
export const getCityBortleScale = (latitude: number, longitude: number): number => {
  try {
    // Try to find the location in our database first
    const nearestLocation = findClosestLocation(latitude, longitude);
    
    // If location is found and is close enough (within 20km), use its Bortle scale
    if (nearestLocation && nearestLocation.distance < 20) {
      console.log(`Using specific city Bortle scale: ${nearestLocation.bortleScale}`);
      return nearestLocation.bortleScale;
    }
    
    // Default Bortle values for city centers based on population (fallback)
    // Beijing, Shanghai, etc. are class 8-9
    // Medium cities are class 6-7
    // Small cities and towns are class 4-5
    return 6;
  } catch (error) {
    console.error("Error getting city Bortle scale:", error);
    return 6; // Default to class 6 (bright suburban sky)
  }
};

// Export for compatibility with modules that reference getBortleScaleData
export const getBortleScaleData = getBortleScale;
