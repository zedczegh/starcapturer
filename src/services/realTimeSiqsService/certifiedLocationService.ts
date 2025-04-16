
import { clearSiqsCache } from '../realTimeSiqs/siqsCache';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';

// Cache for certified location data
const certifiedLocationSiqsCache = new Map<string, number>();

/**
 * Update a collection of certified locations with real-time SIQS data
 */
export async function updateCertifiedLocationsWithSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  const updatedLocations = [...locations];
  
  // Process certified locations with priority
  for (const location of updatedLocations) {
    if (!location.latitude || !location.longitude || !location.certification) continue;
    
    // Use cached value if available
    const cacheKey = `cert-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    if (certifiedLocationSiqsCache.has(cacheKey)) {
      location.siqs = certifiedLocationSiqsCache.get(cacheKey);
      continue;
    }
    
    try {
      // For certified locations, we can use their known Bortle scale
      const bortleScale = location.bortleScale || 3; // Most certified locations have good skies
      
      const result = await calculateRealTimeSiqs(
        location.latitude,
        location.longitude,
        bortleScale
      );
      
      location.siqs = result.siqs;
      location.isViable = result.isViable;
      
      // Cache the result
      certifiedLocationSiqsCache.set(cacheKey, result.siqs);
    } catch (error) {
      console.error(`Failed to update SIQS for certified location ${location.name}:`, error);
    }
  }
  
  return updatedLocations;
}

/**
 * Clear the certified location cache
 */
export function clearCertifiedLocationCache(): void {
  certifiedLocationSiqsCache.clear();
  console.log("Certified location cache cleared");
}
