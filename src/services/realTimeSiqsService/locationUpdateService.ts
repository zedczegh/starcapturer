
import { calculateRealTimeSiqs, batchCalculateSiqs } from '../realTimeSiqsService';
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation } from '@/utils/locationValidator';

// Cache for real-time SIQS data to reduce API calls
const locationCache = new Map<string, {
  siqs: number;
  timestamp: number;
  isViable: boolean;
}>();

// Cache duration settings
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Update locations with real-time SIQS data
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  viewType: 'certified' | 'calculated' = 'calculated'
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Updating ${locations.length} locations with real-time SIQS for view: ${viewType}`);
  
  // Early return if there are too many locations to avoid overwhelming browser
  if (locations.length > 50) {
    console.warn(`Too many locations (${locations.length}) for real-time SIQS update. Limiting to first 50`);
    // Use the first 50 locations or return as-is if in production
    return locations;
  }
  
  // Clone the locations to avoid mutating the original
  const updatedLocations = [...locations];
  
  // Set max parallel requests based on view type
  const maxParallel = viewType === 'certified' ? 3 : 5;
  
  try {
    // Filter out water locations for calculated spots
    const locationsToUpdate = viewType === 'calculated'
      ? updatedLocations.filter(loc => !isWaterLocation(loc.latitude, loc.longitude))
      : updatedLocations;
    
    // Batch process locations for better performance
    for (let i = 0; i < locationsToUpdate.length; i += maxParallel) {
      const batch = locationsToUpdate.slice(i, i + maxParallel);
      
      const batchData = batch.map(location => ({
        id: location.id || '',
        name: location.name || '',
        timestamp: location.timestamp || '',
        latitude: location.latitude,
        longitude: location.longitude,
        bortleScale: location.bortleScale || 4
      }));
      
      const batchResults = await batchCalculateSiqs(batchData);
      
      // Update locations with SIQS results
      for (let j = 0; j < batch.length; j++) {
        const result = batchResults[j];
        if (result && typeof result.siqs === 'number') {
          batch[j].siqs = result.siqs;
          batch[j].isViable = result.isViable;
          
          // Cache this result
          try {
            const cacheKey = `${batch[j].latitude.toFixed(4)}-${batch[j].longitude.toFixed(4)}`;
            locationCache.set(cacheKey, {
              siqs: result.siqs,
              isViable: result.isViable,
              timestamp: Date.now()
            });
          } catch (cacheError) {
            console.warn("Failed to cache location result:", cacheError);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error updating locations with real-time SIQS:`, error);
  }
  
  return updatedLocations;
}

/**
 * Clear the location cache
 */
export function clearLocationCache(): void {
  const size = locationCache.size;
  locationCache.clear();
  console.log(`Location cache cleared (${size} entries removed)`);
}
