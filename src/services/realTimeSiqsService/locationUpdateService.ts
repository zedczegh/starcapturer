
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "../realTimeSiqsService";
import { updateCertifiedLocationsWithSiqs } from "./certifiedLocationService";

// Cache for real-time SIQS data
const locationCache = new Map<string, {
  siqs: number;
  timestamp: number;
  isViable: boolean;
}>();

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Update locations with real-time SIQS data
 * With improved caching and parallel processing
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[],
  userLocation?: { latitude: number; longitude: number } | null,
  searchRadius?: number,
  activeView?: 'certified' | 'calculated',
  maxParallel: number = 3
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Updating ${locations.length} locations with real-time SIQS, view: ${activeView}`);
  
  // For certified view or if specifically handling certified locations in any view
  if (activeView === 'certified') {
    // Use the dedicated certified locations service for better handling
    return updateCertifiedLocationsWithSiqs(locations);
  }
  
  // Clone the locations to avoid mutating the original
  const updatedLocations = [...locations];
  
  // Separate certified and calculated locations for different handling
  const certifiedLocs = updatedLocations.filter(loc => 
    loc.isDarkSkyReserve || (loc.certification && loc.certification !== '')
  );
  
  const calculatedLocs = updatedLocations.filter(loc => 
    !(loc.isDarkSkyReserve || (loc.certification && loc.certification !== ''))
  );
  
  // Update certified locations first using the dedicated service
  const updatedCertifiedLocs = await updateCertifiedLocationsWithSiqs(certifiedLocs);
  
  // Handle calculated locations with regular approach
  // Batch process locations for better performance
  const batchSize = Math.min(maxParallel, 3);
  
  for (let i = 0; i < calculatedLocs.length; i += batchSize) {
    const batch = calculatedLocs.slice(i, i + batchSize);
    const promises = batch.map(async (location) => {
      const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
      
      // Check cache first
      const cachedData = locationCache.get(cacheKey);
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        console.log(`Using cached SIQS for ${location.name || 'location'}: ${cachedData.siqs}`);
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
          location.bortleScale || 4
        );
        
        // Cache the result
        locationCache.set(cacheKey, {
          siqs: result.siqs,
          isViable: result.isViable,
          timestamp: Date.now()
        });
        
        return {
          ...location,
          siqs: result.siqs,
          isViable: result.isViable
        };
      } catch (error) {
        console.error(`Error calculating SIQS for location:`, error);
        // Return original location if calculation fails
        return location;
      }
    });
    
    // Wait for the batch to complete
    const results = await Promise.all(promises);
    
    // Update locations
    results.forEach((result, index) => {
      calculatedLocs[i + index] = result;
    });
  }
  
  // Combine the updated certified and calculated locations
  return [...updatedCertifiedLocs, ...calculatedLocs];
}

/**
 * Clear the location cache
 */
export function clearLocationCache(): void {
  const size = locationCache.size;
  locationCache.clear();
  console.log(`Location cache cleared (${size} entries removed)`);
}
