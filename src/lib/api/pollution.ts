
/**
 * Fetches light pollution data based on coordinates
 * Prioritizes our internal database over network requests or estimates
 */
export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number | null } | null> {
  try {
    // Validate coordinates before proceeding
    if (!isFinite(latitude) || !isFinite(longitude)) {
      console.log("Invalid coordinates for light pollution data:", latitude, longitude);
      return { bortleScale: null };
    }
    
    // First try to get accurate data from our location database
    const { findClosestLocation } = await import('../../data/locationDatabase');
    
    // Check primary database (high-accuracy data)
    const locationInfo = findClosestLocation(latitude, longitude);
    console.log("Primary database lookup for light pollution:", locationInfo);
    
    if (locationInfo && 
        typeof locationInfo.bortleScale === 'number' && 
        locationInfo.bortleScale >= 1 && 
        locationInfo.bortleScale <= 9 && 
        locationInfo.distance < 75) {
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
        knownLocation.bortleScale <= 9 && 
        knownLocation.distance < 50) {
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
    
    console.log("Could not determine Bortle scale for this location");
    return { bortleScale: null };
    
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    return { bortleScale: null };
  }
}
