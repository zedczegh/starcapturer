
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "../realTimeSiqsService";
import { updateCertifiedLocationsWithSiqs } from "./certifiedLocationService";

// Cache for SIQS data to reduce API calls
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
  isViable: boolean;
}>();

// Cache duration - 30 minutes
const CACHE_DURATION = 30 * 60 * 1000; 

/**
 * Update locations with real-time SIQS data
 * @param locations Array of locations to update
 * @param userLocation User's current location
 * @param searchRadius Search radius in km
 * @param mode Processing mode: 'all', 'certified', or 'calculated'
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number = 100,
  mode: 'all' | 'certified' | 'calculated' = 'all'
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Updating ${locations.length} locations with real-time SIQS (mode: ${mode})`);
  
  // For certified mode, use specialized handler with better caching
  if (mode === 'certified') {
    return updateCertifiedLocationsWithSiqs(locations);
  }

  // Clone the locations to avoid mutating the original
  const updatedLocations = [...locations];
  
  // Batch process locations for better performance
  const batchSize = 5;
  
  for (let i = 0; i < updatedLocations.length; i += batchSize) {
    const batch = updatedLocations.slice(i, i + batchSize);
    const promises = batch.map(async (location) => {
      if (!location.latitude || !location.longitude) return location;
      
      // Special handling for certified locations
      if (location.isDarkSkyReserve || location.certification) {
        const withSiqs = await updateLocationWithSiqs(location, true); 
        return withSiqs;
      }
      
      // Regular location handling
      return await updateLocationWithSiqs(location, false);
    });
    
    // Wait for the batch to complete
    const results = await Promise.allSettled(promises);
    
    // Update locations
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        updatedLocations[i + index] = result.value;
      }
    });
  }
  
  return updatedLocations;
}

/**
 * Update a single location with SIQS data
 * @param location Location to update
 * @param isCertified Whether location is certified
 */
async function updateLocationWithSiqs(
  location: SharedAstroSpot, 
  isCertified: boolean
): Promise<SharedAstroSpot> {
  if (!location.latitude || !location.longitude) return location;

  const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
  
  // Check cache first
  const cachedData = siqsCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    return {
      ...location,
      siqs: cachedData.siqs,
      isViable: cachedData.isViable
    };
  }
  
  try {
    // Calculate real-time SIQS
    const result = await calculateRealTimeSiqs(
      location.latitude,
      location.longitude,
      location.bortleScale || (isCertified ? 3 : 4) // Default to better Bortle scale for certified
    );
    
    // Cache the result
    siqsCache.set(cacheKey, {
      siqs: result.siqs,
      isViable: result.isViable,
      timestamp: Date.now()
    });
    
    return {
      ...location,
      siqs: result.siqs,
      isViable: result.isViable,
      // Remove siqsFactors property as it's not in the SharedAstroSpot type
    };
  } catch (error) {
    console.error(`Error calculating SIQS for location:`, error);
    // Return original location if calculation fails
    return location;
  }
}

/**
 * Clear the SIQS cache
 */
export function clearSiqsCache(): void {
  const size = siqsCache.size;
  siqsCache.clear();
  console.log(`SIQS cache cleared (${size} entries removed)`);
}

/**
 * Clear the location cache
 * This is an alias for clearSiqsCache for backward compatibility
 */
export function clearLocationCache(): void {
  clearSiqsCache();
  console.log("Location cache cleared via clearLocationCache alias");
}

