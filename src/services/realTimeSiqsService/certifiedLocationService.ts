
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Certified locations cache
const certifiedCache: Map<string, any> = new Map();
let lastCacheUpdate: Date | null = null;

/**
 * Update certified locations with real-time SIQS data
 * @param locations Array of certified locations
 * @returns Updated locations with SIQS scores
 */
export async function updateCertifiedLocationsWithSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  try {
    // Process certified locations in small batches to avoid rate limits
    const BATCH_SIZE = 3;
    const result: SharedAstroSpot[] = [];
    
    for (let i = 0; i < locations.length; i += BATCH_SIZE) {
      const batch = locations.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async location => {
        const cacheKey = `${location.latitude.toFixed(6)},${location.longitude.toFixed(6)}`;
        
        // Check cache first
        if (certifiedCache.has(cacheKey)) {
          const cached = certifiedCache.get(cacheKey);
          if (cached && cached.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
            return {
              ...location,
              siqs: cached.siqs,
              siqsResult: cached.result
            };
          }
        }
        
        // If no valid cache, calculate new SIQS
        if (!location.latitude || !location.longitude) {
          return location;
        }
        
        try {
          // Certified locations typically have better Bortle scale values
          const bortleScale = location.bortleScale || 
                             (location.isDarkSkyReserve ? 2 : 4);
          
          const result = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            bortleScale
          );
          
          // Cache the result
          certifiedCache.set(cacheKey, {
            siqs: result.siqs,
            result,
            timestamp: Date.now()
          });
          
          return {
            ...location,
            siqs: result.siqs,
            siqsResult: result
          };
        } catch (error) {
          console.error(`Error calculating SIQS for certified location ${location.name}:`, error);
          return location;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      result.push(...batchResults);
      
      // Add delay between batches to avoid API rate limits
      if (i + BATCH_SIZE < locations.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    lastCacheUpdate = new Date();
    return result;
  } catch (error) {
    console.error("Error updating certified locations with SIQS:", error);
    return locations;
  }
}

/**
 * Clear certified locations cache
 */
export function clearCertifiedLocationCache(): void {
  certifiedCache.clear();
  console.log("Certified location cache cleared");
}

/**
 * Get cache statistics
 */
export function getCertifiedCacheStats(): {
  size: number;
  lastUpdated: Date | null;
} {
  return {
    size: certifiedCache.size,
    lastUpdated: lastCacheUpdate
  };
}
