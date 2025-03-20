
import { findClosestCity, interpolateBortleScale } from "@/utils/lightPollutionData";
import { getCityBortleScale, isInChina, getChineseRegion } from "@/utils/chinaBortleData";

/**
 * Fetches light pollution data based on coordinates
 * Prioritizes our internal database over network requests or estimates
 * With improved handling for all Chinese regions
 */
export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number | null } | null> {
  try {
    // Validate coordinates before proceeding
    if (!isFinite(latitude) || !isFinite(longitude)) {
      console.log("Invalid coordinates for light pollution data:", latitude, longitude);
      return { bortleScale: 4 }; // Return default value instead of null
    }
    
    // First check for specific Chinese cities using our comprehensive database
    const specificCityBortle = getCityBortleScale(latitude, longitude);
    if (specificCityBortle !== null) {
      console.log("Using specific city Bortle scale:", specificCityBortle);
      return { bortleScale: specificCityBortle };
    }
    
    // Try to get data from our enhanced light pollution database
    try {
      const closestCity = findClosestCity(latitude, longitude);
      console.log("Using enhanced database for Bortle scale:", closestCity);
      
      // Check if we're in China to adjust distance thresholds
      const inChina = isInChina(latitude, longitude);
      let distanceThreshold = inChina ? 120 : 100;
      
      // Adjust thresholds for different regions in China
      if (inChina) {
        const region = getChineseRegion(latitude, longitude);
        
        if (region === 'Tibet' || region === 'Xinjiang' || region === 'Qinghai' || region === 'Gansu') {
          distanceThreshold = 150; // Extended influence for cities in remote western regions
        } else if (region === 'Inner Mongolia' || region === 'Heilongjiang' || region === 'Jilin') {
          distanceThreshold = 140; // Extended influence for northern regions
        }
        
        // If city is found in these regions
        if (closestCity.type === 'urban' && closestCity.distance < distanceThreshold) {
          // Apply distance correction - urban centers in remote areas cast light pollution further
          const adjustedBortle = Math.max(
            1,
            closestCity.bortleScale - (closestCity.distance / distanceThreshold) * 5
          );
          return { bortleScale: adjustedBortle };
        }
      }
      
      if (closestCity.distance < distanceThreshold) {
        return { bortleScale: closestCity.bortleScale };
      }
      
      // If no close city, use interpolation for better accuracy
      const interpolatedScale = interpolateBortleScale(latitude, longitude);
      console.log("Using interpolated Bortle scale:", interpolatedScale);
      return { bortleScale: interpolatedScale };
    } catch (error) {
      console.error("Error using enhanced light pollution database:", error);
      // Fall back to legacy database if enhanced database fails
    }
    
    // Fall back to our legacy location database
    const { findClosestLocation } = await import('../../data/locationDatabase');
    
    // Check primary database (high-accuracy data)
    const locationInfo = findClosestLocation(latitude, longitude);
    console.log("Primary database lookup for light pollution:", locationInfo);
    
    if (locationInfo && 
        typeof locationInfo.bortleScale === 'number' && 
        locationInfo.bortleScale >= 1 && 
        locationInfo.bortleScale <= 9) {
      console.log("Using primary database for Bortle scale:", locationInfo.bortleScale);
      return { bortleScale: locationInfo.bortleScale };
    }
    
    // Fallback to known locations utility
    const { findClosestKnownLocation } = await import('../../utils/locationUtils');
    
    // Check known locations database (supplementary data)
    const knownLocation = findClosestKnownLocation(latitude, longitude);
    
    // If we have a reliable known location that's close enough
    if (knownLocation && 
        typeof knownLocation.bortleScale === 'number' && 
        knownLocation.bortleScale >= 1 && 
        knownLocation.bortleScale <= 9) {
      console.log("Using known location database for Bortle scale:", knownLocation.bortleScale);
      return { bortleScale: knownLocation.bortleScale };
    }
    
    // Last resort - try to estimate based on location name if we have one
    if (knownLocation && knownLocation.name) {
      const { estimateBortleScaleByLocation } = await import('../../utils/locationUtils');
      const estimatedScale = estimateBortleScaleByLocation(knownLocation.name, latitude, longitude);
      
      if (estimatedScale >= 1 && estimatedScale <= 9) {
        console.log("Using estimated Bortle scale:", estimatedScale);
        return { bortleScale: estimatedScale };
      }
    }
    
    // If everything fails, return a default value based on general geographic patterns
    const defaultScale = estimateDefaultBortleScale(latitude, longitude);
    console.log("Using default Bortle scale:", defaultScale);
    return { bortleScale: defaultScale };
    
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    return { bortleScale: 4 }; // Return default value instead of null
  }
}

/**
 * Provides a reasonable default Bortle scale estimate based on general geographic patterns
 * when we don't have specific location data
 * Updated to account for light pollution in Chinese cities
 */
function estimateDefaultBortleScale(latitude: number, longitude: number): number {
  // China is a special case due to its vast geography and varying levels of development
  if (isInChina(latitude, longitude)) {
    const region = getChineseRegion(latitude, longitude);
    
    // Different regions have different general Bortle scales
    switch (region) {
      case 'Tibet':
        return 3; // Tibet is generally dark except cities
      case 'Xinjiang':
        return 4; // Xinjiang is generally dark except cities
      case 'Qinghai':
        return 3.5; // Qinghai is generally dark except cities
      case 'Gansu':
        return 4.5; // Gansu has more development
      case 'Inner Mongolia':
        return 4; // Inner Mongolia is generally dark except cities
      case 'Heilongjiang':
      case 'Jilin':
      case 'Liaoning':
        return 5; // Northeast China has moderate development
      default:
        // Eastern China generally has high light pollution
        if (longitude > 105) {
          return 6.5;
        }
        // Central China has moderate light pollution
        else if (longitude > 95) {
          return 5.5;
        }
        // Western China is generally darker
        else {
          return 4;
        }
    }
  }
  
  // Major urban centers around the world
  if ((latitude > 35 && latitude < 45 && longitude > -125 && longitude < -65) || // North America
      (latitude > 45 && latitude < 60 && longitude > -10 && longitude < 30) ||   // Europe
      (latitude > 30 && latitude < 45 && longitude > 125 && longitude < 145)) {  // Japan/Korea
    return 6; // Moderate-high light pollution
  }
  
  // Remote areas
  if ((latitude > 60 || latitude < -50) ||                          // Far north/south
      (longitude > -170 && longitude < -140 && latitude < 30) ||    // Pacific
      (longitude > 85 && longitude < 110 && latitude > 30 && latitude < 50 && 
       !(latitude > 35 && latitude < 45 && longitude > 100 && longitude < 105))) { // Central Asia except cities
    return 3; // Low light pollution
  }
  
  // Default middle value
  return 4;
}
