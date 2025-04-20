import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "../realTimeSiqsService";

// Cache for certified location SIQS data with longer expiry
const certifiedLocationCache = new Map<string, {
  siqs: number;
  timestamp: number;
  isViable: boolean;
}>();

// Longer cache duration for certified locations since they change less often
const CERTIFIED_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes in milliseconds

/**
 * Update certified locations with real-time SIQS data
 * Uses dedicated caching for certified locations
 */
export async function updateCertifiedLocationsWithSiqs(
  locations: SharedAstroSpot[],
  maxParallel: number = 2
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Updating ${locations.length} certified locations with real-time SIQS`);
  
  // Filter only certified locations
  const certifiedLocations = locations.filter(loc => 
    loc.isDarkSkyReserve || (loc.certification && loc.certification !== '')
  );
  
  // Keep non-certified locations untouched
  const nonCertifiedLocations = locations.filter(loc => 
    !(loc.isDarkSkyReserve || (loc.certification && loc.certification !== ''))
  );
  
  if (certifiedLocations.length === 0) {
    return locations;
  }
  
  // Clone the locations to avoid mutating the original
  const updatedCertifiedLocations = [...certifiedLocations];
  
  // Batch process locations for better performance
  const batchSize = Math.min(maxParallel, 2); // Lower parallelism for certified locations
  
  for (let i = 0; i < updatedCertifiedLocations.length; i += batchSize) {
    const batch = updatedCertifiedLocations.slice(i, i + batchSize);
    const promises = batch.map(async (location) => {
      if (!location.latitude || !location.longitude) return location;
      
      const cacheKey = `cert-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
      
      // Check cache first with longer expiry for certified locations
      const cachedData = certifiedLocationCache.get(cacheKey);
      if (cachedData && (Date.now() - cachedData.timestamp) < CERTIFIED_CACHE_DURATION) {
        console.log(`Using cached SIQS for certified location ${location.name || 'unnamed'}: ${cachedData.siqs}`);
        return {
          ...location,
          siqs: cachedData.siqs,
          isViable: cachedData.isViable
        };
      }
      
      try {
        // Calculate real-time SIQS with priority for certified locations
        const result = await calculateRealTimeSiqs(
          location.latitude,
          location.longitude,
          location.bortleScale || 3 // Most dark sky sites have better Bortle scale
        );
        
        // Cache the result with longer expiry
        certifiedLocationCache.set(cacheKey, {
          siqs: result.siqs,
          isViable: result.isViable,
          timestamp: Date.now()
        });
        
        return {
          ...location,
          siqs: result.siqs,
          isViable: result.isViable,
          siqsFactors: result.factors
        };
      } catch (error) {
        console.error(`Error calculating SIQS for certified location:`, error);
        // Return original location if calculation fails
        return location;
      }
    });
    
    // Wait for the batch to complete
    const results = await Promise.allSettled(promises);
    
    // Update locations
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        updatedCertifiedLocations[i + index] = result.value;
      }
    });
  }
  
  // Combine updated certified locations with untouched non-certified locations
  return [...updatedCertifiedLocations, ...nonCertifiedLocations];
}

/**
 * Clear the certified location cache
 */
export function clearCertifiedLocationCache(): void {
  const size = certifiedLocationCache.size;
  certifiedLocationCache.clear();
  console.log(`Certified location cache cleared (${size} entries removed)`);
}
