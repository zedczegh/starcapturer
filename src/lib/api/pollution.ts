
/**
 * Fetches light pollution data based on coordinates
 * Prioritizes our internal database over network requests or estimates
 */
export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number | null } | null> {
  try {
    // First try to get accurate data from our expanded location database
    const { findClosestLocation } = await import('../../data/locationDatabase');
    
    // Get the closest location with accurate Bortle scale
    const locationInfo = findClosestLocation(latitude, longitude);
    console.log("Light pollution data for", latitude, longitude, ":", locationInfo);
    
    if (locationInfo && typeof locationInfo.bortleScale === 'number') {
      // Only return the value if it's valid (1-9)
      if (locationInfo.bortleScale >= 1 && locationInfo.bortleScale <= 9) {
        return { bortleScale: locationInfo.bortleScale };
      }
    }

    console.log("No reliable Bortle scale data found in primary database");
    
    // Try another approach with our known locations database
    const { findClosestKnownLocation } = await import('../../utils/locationUtils');
    const knownLocation = findClosestKnownLocation(latitude, longitude);
    
    if (knownLocation && 
        typeof knownLocation.bortleScale === 'number' && 
        knownLocation.bortleScale >= 1 && 
        knownLocation.bortleScale <= 9 && 
        knownLocation.distance < 100) {
      console.log("Using known location database for Bortle scale:", knownLocation.bortleScale);
      return { bortleScale: knownLocation.bortleScale };
    }
    
    // If we get here, we need to be clear that we don't have reliable data
    console.log("Could not determine Bortle scale for this location");
    return { bortleScale: null };
    
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    return { bortleScale: null };
  }
}
