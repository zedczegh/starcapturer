
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';

// Cache for processed locations
const locationCache = new Map<string, { timestamp: number; siqs: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Update a batch of locations with real-time SIQS scores
 * @param locations Array of locations to update
 * @returns Updated locations with SIQS scores
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || !locations.length) return [];
  
  const updatedLocations = [...locations];
  const now = Date.now();
  
  // Batch locations into groups to process
  const needsUpdate: SharedAstroSpot[] = [];
  
  // First pass - check cache and mark those needing updates
  updatedLocations.forEach(location => {
    if (!location.latitude || !location.longitude) return;
    
    const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    const cached = locationCache.get(cacheKey);
    
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      // Use cached SIQS
      location.siqsScore = cached.siqs;
      console.log(`Using cached SIQS for ${location.name || 'unnamed'}: ${cached.siqs}`);
    } else {
      // Mark for update
      needsUpdate.push(location);
    }
  });
  
  // Process those needing updates in batches
  if (needsUpdate.length > 0) {
    console.log(`Updating SIQS for ${needsUpdate.length} locations`);
    
    // Process in batches of 5 to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < needsUpdate.length; i += BATCH_SIZE) {
      const batch = needsUpdate.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (location) => {
        try {
          const bortleScale = location.bortleScale || 5;
          const result = await calculateRealTimeSiqs(
            location.latitude!, 
            location.longitude!, 
            bortleScale
          );
          
          location.siqsScore = result.siqs;
          
          // Update cache
          const cacheKey = `${location.latitude!.toFixed(4)}-${location.longitude!.toFixed(4)}`;
          locationCache.set(cacheKey, {
            timestamp: now,
            siqs: result.siqs
          });
          
        } catch (error) {
          console.error(`Error updating SIQS for location ${location.name || 'unnamed'}:`, error);
        }
      }));
      
      // Add a small delay between batches to be nice to APIs
      if (i + BATCH_SIZE < needsUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  return updatedLocations;
}

/**
 * Clear the location cache
 */
export function clearLocationCache(): void {
  locationCache.clear();
  console.log("Cleared location cache");
}
