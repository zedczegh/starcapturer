import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { findLocationsWithinRadius } from "./locationSearchService";
import { batchCalculateSiqs } from "./realTimeSiqs/batchProcessor";
import { clearSiqsCache } from "./realTimeSiqs/siqsCache";
import { isSiqsGreaterThan, getSiqsScore } from "@/utils/siqsHelpers";

const locationCache = new Map<string, {
  locations: SharedAstroSpot[];
  timestamp: number;
}>();

const CACHE_LIFETIME = 30 * 60 * 1000;

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
    
    // For certified locations, we don't use radius filtering
    const effectiveRadius = certifiedOnly ? 100000 : radius;
    
    const cacheKey = `${userLat.toFixed(2)}-${userLng.toFixed(2)}-${effectiveRadius}-${certifiedOnly}`;
    
    const cachedData = locationCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_LIFETIME) {
      console.log(`Using cached locations for ${effectiveRadius}km radius`);
      return cachedData.locations.slice(0, limit);
    }
    
    const allDiscoveredLocations = new Map<string, SharedAstroSpot>();
    
    for (const [key, value] of locationCache.entries()) {
      if ((Date.now() - value.timestamp) < CACHE_LIFETIME) {
        value.locations.forEach(location => {
          const locKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
          if (!allDiscoveredLocations.has(locKey)) {
            allDiscoveredLocations.set(locKey, location);
          }
        });
      }
    }
    
    console.log(`Reusing ${allDiscoveredLocations.size} previously discovered locations`);
    
    const points = await findLocationsWithinRadius(
      userLat, 
      userLng, 
      effectiveRadius,
      certifiedOnly
    );
    
    if (!points || points.length === 0) {
      console.log("No photo points found within radius");
      return [];
    }
    
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
    
    console.log(`Found ${filteredPoints.length} potential photo points within ${effectiveRadius}km radius`);
    
    const pointsWithDistance = filteredPoints.map(point => {
      if (typeof point.distance !== 'number') {
        const distance = calculateDistance(userLat, userLng, point.latitude, point.longitude);
        return { ...point, distance };
      }
      return point;
    });
    
    const sortedByDistance = pointsWithDistance.sort((a, b) => 
      (a.distance || Infinity) - (b.distance || Infinity)
    );
    
    // Limit the number of locations to process for performance
    const locationsToProcess = certifiedOnly 
      ? sortedByDistance // Process all certified locations
      : sortedByDistance.slice(0, limit * 3);
    
    // Calculate SIQS for each location
    const locationsWithSiqs = await batchCalculateSiqs(locationsToProcess);
    
    // Sort by SIQS (highest first) and limit to requested number
    const sortedLocations = locationsWithSiqs
      .filter(loc => isSiqsGreaterThan(loc.siqs, 0))
      .sort((a, b) => (getSiqsScore(b.siqs) || 0) - (getSiqsScore(a.siqs) || 0))
      .slice(0, limit);
    
    // Update cache
    locationCache.set(cacheKey, {
      locations: sortedLocations,
      timestamp: Date.now()
    });
    
    return sortedLocations;
  } catch (error) {
    console.error("Error finding best viewing locations:", error);
    return [];
  }
}

/**
 * Find the nearest dark sky reserves or parks
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param radius Search radius in km
 * @param limit Maximum number of locations to return
 * @returns Promise resolving to array of dark sky locations
 */
export async function findNearestDarkSkyLocations(
  userLat: number,
  userLng: number,
  radius: number,
  limit: number = 5
): Promise<SharedAstroSpot[]> {
  try {
    // Use the bestViewingLocations function with certifiedOnly=true
    return findBestViewingLocations(userLat, userLng, radius, limit, true);
  } catch (error) {
    console.error("Error finding nearest dark sky locations:", error);
    return [];
  }
}

/**
 * Clear the location cache for testing or debugging
 */
export function clearLocationCache(): void {
  locationCache.clear();
  console.log("Location cache cleared");
}
