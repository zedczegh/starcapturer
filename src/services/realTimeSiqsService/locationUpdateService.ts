
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "../realTimeSiqs/siqsCalculator";

// In-memory cache for location data
const locationCache: Map<string, { data: SharedAstroSpot, timestamp: number }> = new Map();

/**
 * Clears the location cache
 */
export function clearLocationCache(): void {
  locationCache.clear();
  console.log("Location cache cleared");
}

/**
 * Updates a batch of locations with their real-time SIQS scores
 * Efficiently processes locations in parallel with rate limiting
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  viewMode: 'certified' | 'calculated'
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  // Prepare locations to be processed
  const locationsToProcess = locations.slice(0, 50); // Limit to prevent overloading
  
  // Process in batches of 5 to avoid rate limiting
  const batchSize = 5;
  const updatedLocations: SharedAstroSpot[] = [];
  
  for (let i = 0; i < locationsToProcess.length; i += batchSize) {
    const batch = locationsToProcess.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(async (location) => {
        if (!location.latitude || !location.longitude) return location;
        
        try {
          // Use existing bortleScale if available
          const bortleValue = location.bortleScale || 
                             (location.isDarkSkyReserve ? 1 : 
                              location.certification ? 2 : 5);
          
          // Calculate real-time SIQS
          const siqs = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            bortleValue
          );
          
          // Update the location with the new SIQS value
          return {
            ...location,
            realtimeSiqs: siqs.siqs,
            lastSiqsUpdate: new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error updating location ${location.name}:`, error);
          return location;
        }
      })
    );
    
    // Extract results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        updatedLocations.push(result.value);
      } else {
        updatedLocations.push(batch[index]);
      }
    });
    
    // Small delay between batches to prevent overloading
    if (i + batchSize < locationsToProcess.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // For any locations we didn't process, add them back unchanged
  if (locations.length > locationsToProcess.length) {
    updatedLocations.push(...locations.slice(50));
  }
  
  return updatedLocations;
}
