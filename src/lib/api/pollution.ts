
import { findClosestCity, interpolateBortleScale } from "@/utils/lightPollutionData";

/**
 * Fetches light pollution data based on coordinates
 * Prioritizes our internal database over network requests or estimates
 * With improved weighting for urban centers in remote regions
 */
export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number | null } | null> {
  try {
    // Validate coordinates before proceeding
    if (!isFinite(latitude) || !isFinite(longitude)) {
      console.log("Invalid coordinates for light pollution data:", latitude, longitude);
      return { bortleScale: 4 }; // Return default value instead of null
    }
    
    // Try to get data from our enhanced light pollution database
    try {
      const closestCity = findClosestCity(latitude, longitude);
      console.log("Using enhanced database for Bortle scale:", closestCity);
      
      // Adjust distance threshold for different regions
      let distanceThreshold = 100;
      
      // Adjust thresholds for special regions where cities should have more influence
      // Tibet, Xinjiang, Inner Mongolia, Northeast China
      if (
        (latitude > 27 && latitude < 35 && longitude > 80 && longitude < 95) || // Tibet
        (latitude > 35 && latitude < 48 && longitude > 75 && longitude < 95) || // Xinjiang
        (latitude > 38 && latitude < 46 && longitude > 105 && longitude < 125) || // Inner Mongolia
        (latitude > 40 && latitude < 50 && longitude > 120 && longitude < 135) // Northeast
      ) {
        distanceThreshold = 150; // Extended influence for cities in remote regions
        
        // If city is found that is labeled as urban in these regions
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
 * Updated to account for light pollution in major cities in remote regions
 */
function estimateDefaultBortleScale(latitude: number, longitude: number): number {
  // Special handling for Tibet (higher values for populated areas)
  if (latitude > 27 && latitude < 33 && longitude > 85 && longitude < 95) {
    // Lhasa and surrounding region
    if (latitude > 29 && latitude < 30 && longitude > 90 && longitude < 92) {
      return 6.5; // Lhasa city area
    }
    // Shigatse region
    if (latitude > 29 && latitude < 30 && longitude > 88 && longitude < 89) {
      return 6.0; // Shigatse city area
    }
    return 3; // Other parts of Tibet
  }
  
  // Special handling for Xinjiang
  if (latitude > 35 && latitude < 48 && longitude > 75 && longitude < 95) {
    // Urumqi region
    if (latitude > 43 && latitude < 44 && longitude > 87 && longitude < 88) {
      return 7.5; // Urumqi city area
    }
    // Kashgar region
    if (latitude > 39 && latitude < 40 && longitude > 75 && longitude < 76) {
      return 7.0; // Kashgar city area
    }
    return 4; // Other parts of Xinjiang
  }
  
  // Inner Mongolia
  if (latitude > 38 && latitude < 46 && longitude > 105 && longitude < 125) {
    // Hohhot region
    if (latitude > 40 && latitude < 41 && longitude > 111 && longitude < 112) {
      return 7.0; // Hohhot city area
    }
    // Baotou region
    if (latitude > 40 && latitude < 41 && longitude > 109 && longitude < 110) {
      return 7.0; // Baotou city area
    }
    return 4; // Other parts of Inner Mongolia
  }
  
  // Northeast China
  if (latitude > 40 && latitude < 50 && longitude > 120 && longitude < 135) {
    // Harbin region
    if (latitude > 45 && latitude < 46 && longitude > 126 && longitude < 127) {
      return 7.5; // Harbin city area
    }
    // Changchun region
    if (latitude > 43 && latitude < 44 && longitude > 125 && longitude < 126) {
      return 7.3; // Changchun city area
    }
    return 4.5; // Other parts of Northeast China
  }
  
  // China's eastern seaboard generally has high light pollution
  if (longitude > 108 && longitude < 130 && latitude > 20 && latitude < 40) {
    return 7; // High light pollution for eastern China
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
       !(latitude > 35 && latitude < 45 && longitude > 100 && longitude < 105))) { // Western China except cities
    return 3; // Low light pollution
  }
  
  // Default middle value
  return 4;
}
