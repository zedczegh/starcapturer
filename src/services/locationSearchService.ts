/**
 * Location search service
 * Provides methods to find locations based on coordinates, distance, and other criteria
 * Optimized for performance with caching and batched calculations
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { getDarkSkyAstroSpots } from "./darkSkyLocationService";
import { batchCalculateSiqs, prefetchSiqsData } from "./realTimeSiqsService";
import { getRecommendedPhotoPoints } from "@/lib/api/astroSpots";
import { 
  createLocationCacheKey, 
  getCachedLocations, 
  cacheLocations,
  isPendingRadiusSearch,
  setPendingRadiusSearch
} from "./locationCacheService";

// Configuration for search performance
const CACHE_ENABLED = true;
const BATCH_SIZE = 20;
const DEBOUNCE_TIME = 300; // ms

// Maintain a debounce timer
let debounceTimer: NodeJS.Timeout | null = null;

/**
 * Find locations within specified radius with debouncing to improve performance
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param certifiedOnly Whether to return only certified locations
 * @returns Promise resolving to array of locations
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number,
  certifiedOnly = false
): Promise<SharedAstroSpot[]> {
  // Clear existing debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // Return a promise that resolves after debounce time
  return new Promise((resolve) => {
    debounceTimer = setTimeout(async () => {
      try {
        // Check if another search is in progress
        if (isPendingRadiusSearch()) {
          console.log("A radius search is already in progress, skipping");
          resolve([]);
          return;
        }
        
        // Create cache key
        const cacheKey = createLocationCacheKey(
          latitude, 
          longitude, 
          radius, 
          { certifiedOnly }
        );
        
        // Check cache first if enabled
        if (CACHE_ENABLED) {
          const cachedResults = getCachedLocations(cacheKey);
          if (cachedResults && cachedResults.length > 0) {
            console.log(`Using ${cachedResults.length} cached locations for radius ${radius}km`);
            
            // Do a background refresh of SIQS data without blocking the UI
            setTimeout(() => {
              prefetchSiqsData(cachedResults);
            }, 100);
            
            resolve(cachedResults);
            return;
          }
        }
        
        console.log(`Searching for locations within ${radius}km`);
        setPendingRadiusSearch(true);
        
        try {
          // First get dark sky locations from our database
          const darkSkyLocations = getDarkSkyAstroSpots(
            latitude, 
            longitude, 
            radius
          );
          
          // If certifiedOnly is true, return only dark sky locations
          if (certifiedOnly) {
            // Cache results
            if (CACHE_ENABLED) {
              cacheLocations(cacheKey, darkSkyLocations);
            }
            resolve(darkSkyLocations);
            return;
          }
          
          // Otherwise, combine with calculated locations from API
          const recommendedLocations = await getRecommendedPhotoPoints(
            latitude,
            longitude,
            radius,
            false,
            Math.max(30 - darkSkyLocations.length, 10) // Get fewer recommended locations if we already have dark sky ones
          );
          
          // Combine both sets, removing duplicates by ID
          const combinedLocations = [...darkSkyLocations];
          
          // Add non-duplicate recommended locations
          const existingIds = new Set(darkSkyLocations.map(loc => loc.id));
          
          for (const loc of recommendedLocations) {
            if (!existingIds.has(loc.id)) {
              combinedLocations.push(loc);
              existingIds.add(loc.id);
            }
          }
          
          // Calculate SIQS for all locations (or use cached values)
          // Use batched processing to avoid overwhelming the UI
          let locationsWithSiqs: SharedAstroSpot[] = [];
          
          // Process in smaller batches for smoother UI
          for (let i = 0; i < combinedLocations.length; i += BATCH_SIZE) {
            const batch = combinedLocations.slice(i, i + BATCH_SIZE);
            const batchWithSiqs = await batchCalculateSiqs(batch);
            locationsWithSiqs = [...locationsWithSiqs, ...batchWithSiqs];
          }
          
          // Cache results
          if (CACHE_ENABLED) {
            cacheLocations(cacheKey, locationsWithSiqs);
          }
          
          resolve(locationsWithSiqs);
        } catch (error) {
          console.error("Error finding locations within radius:", error);
          resolve([]);
        } finally {
          setPendingRadiusSearch(false);
        }
      } catch (error) {
        console.error("Error in debounced location search:", error);
        resolve([]);
      }
    }, DEBOUNCE_TIME);
  });
}

/**
 * Find calculated locations (not official dark sky sites)
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param allowExpandRadius Whether to allow expanding the search radius
 * @returns Promise resolving to array of calculated locations
 */
export async function findCalculatedLocations(
  latitude: number,
  longitude: number,
  radius: number,
  allowExpandRadius = false
): Promise<SharedAstroSpot[]> {
  const cacheKey = createLocationCacheKey(
    latitude, 
    longitude, 
    radius, 
    { type: 'calculated' }
  );
  
  // Check cache first
  if (CACHE_ENABLED) {
    const cachedResults = getCachedLocations(cacheKey);
    if (cachedResults && cachedResults.length > 0) {
      console.log(`Using ${cachedResults.length} cached calculated locations`);
      return cachedResults;
    }
  }
  
  console.log(`Finding calculated locations within ${radius}km`);
  
  try {
    // Get recommended spots from the API
    let recommendedLocations = await getRecommendedPhotoPoints(
      latitude,
      longitude,
      radius,
      false,
      50
    );
    
    // If no results and expand radius is allowed, try with a larger radius
    if (recommendedLocations.length === 0 && allowExpandRadius) {
      const expandedRadius = radius * 2;
      console.log(`No locations found, expanding radius to ${expandedRadius}km`);
      
      recommendedLocations = await getRecommendedPhotoPoints(
        latitude,
        longitude,
        expandedRadius,
        false,
        50
      );
    }
    
    // Calculate SIQS for all locations
    const locationsWithSiqs = await batchCalculateSiqs(recommendedLocations);
    
    // Cache results
    if (CACHE_ENABLED) {
      cacheLocations(cacheKey, locationsWithSiqs);
    }
    
    return locationsWithSiqs;
  } catch (error) {
    console.error("Error finding calculated locations:", error);
    return [];
  }
}

/**
 * Find nearby certified dark sky locations
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Promise resolving to array of certified locations
 */
export async function findCertifiedDarkSkyLocations(
  latitude: number,
  longitude: number,
  radius: number
): Promise<SharedAstroSpot[]> {
  return findLocationsWithinRadius(latitude, longitude, radius, true);
}
