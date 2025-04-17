
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';

// Cache for certified locations
const certifiedLocationCache = new Map<string, { timestamp: number; siqs: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour for certified locations

/**
 * Update certified locations with SIQS scores
 * @param locations Array of certified locations to update
 * @returns Updated locations with SIQS scores
 */
export async function updateCertifiedLocationsWithSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || !locations.length) return [];
  
  const certifiedLocations = locations.filter(loc => 
    loc.isDarkSkyReserve || loc.certification
  );
  
  if (certifiedLocations.length === 0) return locations;
  
  console.log(`Updating SIQS for ${certifiedLocations.length} certified locations`);
  
  const now = Date.now();
  
  // First, apply cached values where available
  certifiedLocations.forEach(location => {
    if (!location.latitude || !location.longitude) return;
    
    const cacheKey = `certified-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    const cached = certifiedLocationCache.get(cacheKey);
    
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      // Use cached SIQS
      location.siqsScore = cached.siqs;
    }
  });
  
  // For certified locations, we use real-time calculation with lower Bortle scale
  // as certified locations are typically in darker areas
  const needUpdate = certifiedLocations.filter(loc => 
    loc.latitude && loc.longitude && loc.siqsScore === undefined
  );
  
  if (needUpdate.length > 0) {
    // Update in batches of 3
    const BATCH_SIZE = 3;
    
    for (let i = 0; i < needUpdate.length; i += BATCH_SIZE) {
      const batch = needUpdate.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (location) => {
        try {
          // Use better Bortle scale for certified locations
          const bortleScale = location.isDarkSkyReserve ? 2 : 
                             (location.bortleScale || 3);
          
          const result = await calculateRealTimeSiqs(
            location.latitude!, 
            location.longitude!, 
            bortleScale
          );
          
          location.siqsScore = result.siqs;
          
          // Cache the result
          const cacheKey = `certified-${location.latitude!.toFixed(4)}-${location.longitude!.toFixed(4)}`;
          certifiedLocationCache.set(cacheKey, {
            timestamp: now,
            siqs: result.siqs
          });
          
        } catch (error) {
          console.error(`Error updating SIQS for certified location ${location.name || 'unnamed'}:`, error);
        }
      }));
      
      // Add a small delay between batches
      if (i + BATCH_SIZE < needUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  return locations;
}

/**
 * Clear the certified location cache
 */
export function clearCertifiedLocationCache(): void {
  certifiedLocationCache.clear();
  console.log("Cleared certified location cache");
}
