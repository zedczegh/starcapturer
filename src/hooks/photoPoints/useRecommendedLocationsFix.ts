
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { updateLocationsWithRealTimeSiqs } from "@/services/realTimeSiqsService/locationUpdateService";

/**
 * Fix for loadMoreCalculatedLocations function that has wrong parameter count
 * This wrapper ensures we call it with the right number of parameters
 */
export const fixLoadMoreCalculatedLocations = (
  loadMoreCalculatedLocations: Function, 
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number
) => {
  return async () => {
    if (!userLocation) return [];
    
    try {
      // Call the original function with correct parameter count (3)
      const result = await loadMoreCalculatedLocations(
        userLocation.latitude, 
        userLocation.longitude, 
        searchRadius
      );
      
      return result;
    } catch (error) {
      console.error("Error in loadMoreCalculatedLocations:", error);
      return [];
    }
  };
};

/**
 * Update location data with real-time SIQS values
 */
export const updateWithRealTimeSiqs = async (
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  type: 'certified' | 'calculated'
): Promise<SharedAstroSpot[]> => {
  if (!userLocation || !locations?.length) return locations;
  
  return updateLocationsWithRealTimeSiqs(
    locations,
    userLocation,
    searchRadius,
    type
  );
};
