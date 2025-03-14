
/**
 * Fetches light pollution data based on coordinates
 */
export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<{ bortleScale: number } | null> {
  try {
    // Import the local database lookup function
    const { findClosestKnownLocation } = await import('../../utils/locationUtils');
    
    // Get Bortle scale from our local database
    const closestLocation = findClosestKnownLocation(latitude, longitude);
    
    return { bortleScale: closestLocation.bortleScale };
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    // Use our improved Bortle scale estimation as fallback
    const { findClosestKnownLocation } = await import('../../utils/locationUtils');
    const estimatedBortleScale = findClosestKnownLocation(latitude, longitude).bortleScale;
    return { bortleScale: estimatedBortleScale };
  }
}
