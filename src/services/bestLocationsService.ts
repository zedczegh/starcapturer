
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { findLocationsWithinRadius } from "./locationSearchService";
import { batchCalculateSiqs, clearSiqsCache } from "./realTimeSiqsService";

/**
 * Find the best viewing locations based on SIQS score
 * Intelligently selects locations with best viewing conditions
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param radius Search radius in km
 * @param limit Maximum number of locations to return
 * @param certifiedOnly Whether to return only certified locations
 * @returns Promise resolving to array of locations with SIQS
 */
export async function findBestViewingLocations(
  userLat: number,
  userLng: number,
  radius: number,
  limit: number = 9,
  certifiedOnly: boolean = false
): Promise<SharedAstroSpot[]> {
  try {
    console.log(`Finding best viewing locations within ${radius}km radius, certified only: ${certifiedOnly}`);
    
    // Get recommended points within the specified radius
    const points = await findLocationsWithinRadius(
      userLat, 
      userLng, 
      radius,
      certifiedOnly
    );
    
    if (!points || points.length === 0) {
      console.log("No photo points found within radius");
      return [];
    }
    
    // If certifiedOnly is true, filter out non-certified locations
    let filteredPoints = points;
    if (certifiedOnly) {
      filteredPoints = points.filter(point => 
        point.isDarkSkyReserve || 
        (point.certification && point.certification.length > 0)
      );
      
      if (filteredPoints.length === 0) {
        console.log("No certified locations found within radius");
        return [];
      }
    }
    
    console.log(`Found ${filteredPoints.length} potential photo points within ${radius}km radius`);
    
    // Calculate distances for each point if not already present
    const pointsWithDistance = filteredPoints.map(point => {
      if (typeof point.distance !== 'number') {
        const distance = calculateDistance(userLat, userLng, point.latitude, point.longitude);
        return { ...point, distance };
      }
      return point;
    });
    
    // Sort by distance to find the closest locations
    const sortedByDistance = [...pointsWithDistance].sort((a, b) => 
      (a.distance || 0) - (b.distance || 0)
    );
    
    // Take up to 20 closest locations for SIQS calculation
    const candidateLimit = Math.min(20, sortedByDistance.length);
    const candidateLocations = sortedByDistance.slice(0, candidateLimit);
    
    console.log(`Selected ${candidateLocations.length} candidate locations for SIQS calculation`);
    
    // Calculate SIQS for these locations
    const locationsWithSiqs = await batchCalculateSiqs(candidateLocations);
    
    // Filter for locations with decent viewing conditions 
    const viableLocations = locationsWithSiqs
      .filter(loc => loc.siqs > 3.0) // Lower threshold to show more options
      .sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
    
    if (viableLocations.length === 0) {
      console.log("No viable viewing locations found, returning best available");
      // If no viable locations, return best available sorted by SIQS
      return locationsWithSiqs
        .sort((a, b) => (b.siqs || 0) - (a.siqs || 0))
        .slice(0, limit);
    }
    
    console.log(`Found ${viableLocations.length} viable viewing locations`);
    
    // Return the top locations based on SIQS
    return viableLocations.slice(0, limit);
  } catch (error) {
    console.error("Error finding best viewing locations:", error);
    return [];
  }
}

/**
 * Get a list of locations with good SIQS scores within maximum range
 * This is used as a fallback when no good locations are found nearby
 */
export async function getFallbackLocations(
  userLat: number,
  userLng: number,
  maxRange: number = 10000
): Promise<SharedAstroSpot[]> {
  try {
    // Try to find at least some locations with decent conditions
    console.log(`Finding fallback locations within ${maxRange}km radius`);
    
    // Get more locations within the max range
    const points = await findLocationsWithinRadius(
      userLat,
      userLng, 
      maxRange,
      false
    );
    
    if (!points || points.length === 0) {
      return [];
    }
    
    // Process a sample of the furthest locations to find good spots
    const sortedByDistance = [...points]
      .sort((a, b) => (b.distance || 0) - (a.distance || 0))
      .slice(0, 15); // Take 15 furthest locations
    
    // Calculate SIQS for these locations
    const locationsWithSiqs = await batchCalculateSiqs(sortedByDistance);
    
    // Return best SIQS scores regardless of threshold
    return locationsWithSiqs
      .sort((a, b) => (b.siqs || 0) - (a.siqs || 0))
      .slice(0, 9);
  } catch (error) {
    console.error("Error finding fallback locations:", error);
    return [];
  }
}
