
/**
 * Enhanced service for updating location data with real-time SIQS values
 * This consolidated service handles both certified and calculated locations
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "../realTimeSiqs/siqsCalculator";
import { batchCalculateRealTimeSiqs, clearSiqsCache } from "../realTimeSiqs/realTimeSiqsService";
import { SiqsResult } from "../realTimeSiqs/siqsTypes";

/**
 * Update an array of locations with real-time SIQS data
 * This optimized version processes locations efficiently with smart batching
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) {
    return locations;
  }
  
  console.log(`Updating ${locations.length} locations with real-time SIQS data`);
  
  try {
    // Prepare locations for batch processing
    const locationBatches = createOptimalBatches(locations);
    const updatedLocations: SharedAstroSpot[] = [];
    
    // Process each batch
    for (const batch of locationBatches) {
      const batchLocations = await processBatch(batch);
      updatedLocations.push(...batchLocations);
    }
    
    console.log(`Successfully updated ${updatedLocations.length} locations with SIQS data`);
    return updatedLocations;
    
  } catch (error) {
    console.error("Error updating locations with real-time SIQS:", error);
    return locations; // Return original locations on failure
  }
}

/**
 * Create optimal batches of locations based on distance and expected data source overlap
 */
function createOptimalBatches(
  locations: SharedAstroSpot[]
): SharedAstroSpot[][] {
  // For simplicity, create batches of reasonable size
  const BATCH_SIZE = 5;
  const batches: SharedAstroSpot[][] = [];
  
  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    batches.push(locations.slice(i, i + BATCH_SIZE));
  }
  
  return batches;
}

/**
 * Process a batch of locations
 */
async function processBatch(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations.length) return [];
  
  // Prepare location data for batch processing
  const locationData = locations.map(loc => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
    bortleScale: loc.bortleScale || getBortleScaleEstimate(loc)
  }));
  
  // Calculate SIQS for all locations in batch
  const siqsResults = await batchCalculateRealTimeSiqs(locationData);
  
  // Update locations with SIQS results
  return locations.map((location, index) => {
    if (index < siqsResults.length) {
      const siqs = siqsResults[index];
      
      if (siqs && siqs.siqs > 0) {
        // Convert factors to the expected format with required description
        const factors = siqs.factors?.map(factor => ({
          name: factor.name,
          score: factor.score,
          description: factor.description || `${factor.name} factor` // Ensure description is always present
        }));
        
        return {
          ...location,
          siqs: siqs.siqs,
          siqsResult: {
            score: siqs.siqs,
            isViable: siqs.isViable,
            factors: factors || []
          }
        };
      }
    }
    
    // Return original location if no valid SIQS
    return location;
  });
}

/**
 * Estimate Bortle scale based on location properties if not available
 */
function getBortleScaleEstimate(location: SharedAstroSpot): number {
  if (location.bortleScale && location.bortleScale > 0 && location.bortleScale <= 9) {
    return location.bortleScale;
  }
  
  // Estimate based on certification
  if (location.isDarkSkyReserve) {
    return 3; // Dark sky reserves tend to be bortle 3 or better
  }
  
  if (location.certification) {
    return 4; // Certified locations tend to have good dark skies
  }
  
  // Default value
  return 5;
}

/**
 * Clear SIQS cache for a specific location or all locations
 */
export function clearLocationCache(
  latitude?: number,
  longitude?: number
): void {
  if (latitude !== undefined && longitude !== undefined) {
    console.log(`Clearing SIQS cache for location ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  } else {
    console.log("Clearing all SIQS cache entries");
  }
  
  clearSiqsCache();
}

/**
 * Update certified locations with specialized handling
 */
export async function updateCertifiedLocationsWithSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  // This is now a specialized wrapper around the main function
  // We could add certified-specific logic here if needed
  return updateLocationsWithRealTimeSiqs(locations);
}
