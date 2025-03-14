
/**
 * Fetches light pollution data based on coordinates
 */
export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number } | null> {
  try {
    // Use our improved location database directly
    const { findClosestLocation } = await import('../../data/locationDatabase');
    
    // Get the closest location with accurate Bortle scale
    const locationInfo = findClosestLocation(latitude, longitude);
    console.log("Light pollution data for", latitude, longitude, ":", locationInfo);
    
    if (locationInfo && typeof locationInfo.bortleScale === 'number') {
      return { bortleScale: locationInfo.bortleScale };
    } else {
      console.log("No Bortle scale data found in primary database");
      throw new Error("No Bortle scale data found");
    }
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    
    try {
      // Try another approach with the known locations database
      const { findClosestKnownLocation } = await import('../../utils/locationUtils');
      const knownLocation = findClosestKnownLocation(latitude, longitude);
      
      if (knownLocation && typeof knownLocation.bortleScale === 'number' && knownLocation.distance < 150) {
        console.log("Using known location database for Bortle scale:", knownLocation.bortleScale);
        return { bortleScale: knownLocation.bortleScale };
      }
      
      // If we get here, we need the location-based estimation as last resort
      const { estimateBortleScaleByLocation } = await import('../../utils/locationUtils');
      const estimatedBortleScale = estimateBortleScaleByLocation("", latitude, longitude);
      
      // Only return estimated value if it's valid
      if (estimatedBortleScale >= 1 && estimatedBortleScale <= 9) {
        console.log("Using estimated Bortle scale:", estimatedBortleScale);
        return { bortleScale: estimatedBortleScale };
      }
      
      // If even estimation fails, return null to indicate unknown value
      console.log("Could not determine Bortle scale for this location");
      return null;
    } catch (secondError) {
      console.error("All light pollution data sources failed:", secondError);
      return null;
    }
  }
}
