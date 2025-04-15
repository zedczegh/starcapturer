
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "../realTimeSiqsService";

/**
 * Update a single location with SIQS data
 * @param location Location to update
 * @param isCertified Whether location is certified
 * @returns Updated location with SIQS data
 */
export async function updateLocationWithSiqs(
  location: SharedAstroSpot,
  isCertified: boolean = false
): Promise<SharedAstroSpot> {
  if (!location.latitude || !location.longitude) return location;
  
  try {
    const result = await calculateRealTimeSiqs(location.latitude, location.longitude);
    return {
      ...location,
      siqs: result
    };
  } catch (error) {
    console.error(`Failed to update SIQS for ${location.name || 'unnamed location'}:`, error);
    return location;
  }
}

/**
 * Update certified locations with SIQS data
 * @param locations Array of certified locations
 * @returns Updated locations with SIQS data
 */
export async function updateCertifiedLocationsWithSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  // Process in batches for better performance
  const result = [...locations];
  const batchSize = 5;
  
  for (let i = 0; i < result.length; i += batchSize) {
    const batch = result.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (location, index) => {
        if (!location.latitude || !location.longitude) return;
        
        try {
          const updatedLocation = await updateLocationWithSiqs(location, true);
          result[i + index] = updatedLocation;
        } catch (error) {
          console.error(`Error updating certified location SIQS:`, error);
        }
      })
    );
  }
  
  return result;
}
