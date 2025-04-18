import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "./siqsCalculator";
import { clearSiqsCache } from "./siqsCache";
import { fetchForecastData } from '@/lib/api';
import { calculateTonightCloudCover } from '@/utils/nighttimeSIQS';

/**
 * Update locations with simplified real-time SIQS data based only on nighttime cloud cover
 * Filter to only include locations with high-quality SIQS scores (>= 5.0)
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: SharedAstroSpot[]
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return locations;
  
  console.log(`Updating ${locations.length} locations with real-time cloud cover-based SIQS`);
  
  try {
    // Process in batches to prevent overwhelming the API
    const batchSize = 3; // Reduced from 5 to 3 to limit API calls
    const updatedLocations: SharedAstroSpot[] = [];
    
    // Filter out certified locations - process those first and always keep them
    const certifiedLocations = locations.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    // Process remaining locations - these will be filtered by quality
    const calculatedLocations = locations.filter(loc => 
      !loc.isDarkSkyReserve && !loc.certification
    );
    
    // Process certified locations first - we keep all of these regardless of SIQS
    for (const location of certifiedLocations) {
      try {
        // Calculate SIQS for certified locations
        const siqsResult = await calculateRealTimeSiqs(
          location.latitude,
          location.longitude,
          location.bortleScale || 3 // Assume better Bortle scale for certified locations
        );
        
        updatedLocations.push({
          ...location,
          siqs: siqsResult.score,
          siqsResult: siqsResult
        });
      } catch (error) {
        console.error(`Error calculating SIQS for certified location ${location.id || location.name}:`, error);
        updatedLocations.push(location);
      }
    }
    
    // Now process calculated locations in batches - only keep high quality ones
    for (let i = 0; i < calculatedLocations.length; i += batchSize) {
      const batch = calculatedLocations.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (location) => {
        try {
          // Calculate SIQS for this location based only on cloud cover
          const siqsResult = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            location.bortleScale || 4
          );
          
          // Only include locations with high-quality SIQS score (>= 5.0)
          if (siqsResult.score >= 5.0) {
            return {
              ...location,
              siqs: siqsResult.score,
              siqsResult: siqsResult
            };
          } else {
            // Skip low quality locations
            console.log(`Filtering out low quality location (SIQS: ${siqsResult.score.toFixed(1)})`);
            return null;
          }
        } catch (error) {
          console.error(`Error calculating SIQS for location ${location.id || location.name}:`, error);
          return null; // Skip on error
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      updatedLocations.push(...batchResults.filter(loc => loc !== null) as SharedAstroSpot[]);
      
      // Add larger delay between batches to reduce API load
      if (i + batchSize < calculatedLocations.length) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Increased from 300ms to 500ms
      }
    }
    
    console.log(`Successfully updated ${updatedLocations.length} locations with cloud cover-based SIQS data`);
    return updatedLocations;
    
  } catch (error) {
    console.error("Error updating locations with real-time SIQS:", error);
    return locations;
  }
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
    
    // Clear from session storage too
    try {
      const cacheKey = `siqs_${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
      sessionStorage.removeItem(cacheKey);
    } catch (e) {
      // Ignore storage errors
    }
  } else {
    console.log("Clearing all SIQS cache entries");
    
    // Clear all SIQS cache from session storage
    try {
      const keys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('siqs_')) {
          keys.push(key);
        }
      }
      
      keys.forEach(key => sessionStorage.removeItem(key));
      console.log(`Cleared ${keys.length} SIQS entries from session storage`);
    } catch (e) {
      // Ignore storage errors
    }
  }
  
  clearSiqsCache();
}

/**
 * Calculate SIQS directly from cloud cover - provides immediate feedback
 * @param cloudCover Cloud cover percentage (0-100)
 */
export function calculateSiqsFromCloudCover(cloudCover: number): number {
  // 0% cloud cover = 10 points, 100% cloud cover = 0 points
  return Math.min(10, Math.max(0, 10 - (cloudCover / 10)));
}
