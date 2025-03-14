
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
      throw new Error("No Bortle scale data found");
    }
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    
    // Fall back to our database in case of any error
    const { findClosestLocation } = await import('../../data/locationDatabase');
    const locationInfo = findClosestLocation(latitude, longitude);
    
    if (locationInfo && typeof locationInfo.bortleScale === 'number') {
      return { bortleScale: locationInfo.bortleScale };
    }
    
    // If all else fails, use the location-based estimation
    const { estimateBortleScaleByLocation } = await import('../../utils/locationUtils');
    const estimatedBortleScale = estimateBortleScaleByLocation("", latitude, longitude);
    return { bortleScale: estimatedBortleScale };
  }
}
