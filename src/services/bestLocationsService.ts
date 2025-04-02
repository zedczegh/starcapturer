import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { findLocationsWithinRadius } from "./locationSearchService";
import { batchCalculateSiqs, clearSiqsCache } from "./realTimeSiqsService";

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
    
    const cacheKey = `${userLat.toFixed(2)}-${userLng.toFixed(2)}-${radius}-${certifiedOnly}`;
    
    const cachedData = locationCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_LIFETIME) {
      console.log(`Using cached locations for ${radius}km radius`);
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
      radius,
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
    
    console.log(`Found ${filteredPoints.length} potential photo points within ${radius}km radius`);
    
    const pointsWithDistance = filteredPoints.map(point => {
      if (typeof point.distance !== 'number') {
        const distance = calculateDistance(userLat, userLng, point.latitude, point.longitude);
        return { ...point, distance };
      }
      return point;
    });
    
    const sortedByDistance = [...pointsWithDistance].sort((a, b) => 
      (a.distance || 0) - (b.distance || 0)
    );
    
    const candidateLimit = Math.min(25, sortedByDistance.length);
    const candidateLocations = sortedByDistance.slice(0, candidateLimit);
    
    console.log(`Selected ${candidateLocations.length} candidate locations for SIQS calculation`);
    
    const locationsNeedingSIQS = [];
    const locationsWithSiqs = [];
    
    for (const location of candidateLocations) {
      const locKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
      const existingLocation = allDiscoveredLocations.get(locKey);
      
      if (existingLocation && 
          existingLocation.siqs !== undefined && 
          existingLocation.isViable !== undefined) {
        locationsWithSiqs.push({
          ...location,
          siqs: existingLocation.siqs,
          isViable: existingLocation.isViable,
          siqsFactors: existingLocation.siqsFactors
        });
      } else {
        locationsNeedingSIQS.push(location);
      }
    }
    
    console.log(`Reusing SIQS data for ${locationsWithSiqs.length} locations, calculating for ${locationsNeedingSIQS.length} new locations`);
    
    let newLocationsWithSiqs = [];
    if (locationsNeedingSIQS.length > 0) {
      newLocationsWithSiqs = await batchCalculateSiqs(locationsNeedingSIQS);
      
      newLocationsWithSiqs.forEach(location => {
        const locKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
        allDiscoveredLocations.set(locKey, location);
      });
    }
    
    const allLocationsWithSiqs = [...locationsWithSiqs, ...newLocationsWithSiqs];
    
    const viableLocations = allLocationsWithSiqs
      .filter(loc => loc.siqs > 3.0)
      .sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
    
    const resultLocations = viableLocations.length > 0 
      ? viableLocations 
      : allLocationsWithSiqs.sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
    
    locationCache.set(cacheKey, {
      locations: resultLocations,
      timestamp: Date.now()
    });
    
    if (viableLocations.length === 0) {
      console.log("No viable viewing locations found, returning best available");
      return allLocationsWithSiqs
        .sort((a, b) => (b.siqs || 0) - (a.siqs || 0))
        .slice(0, limit);
    }
    
    console.log(`Found ${viableLocations.length} viable viewing locations`);
    
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
    console.log(`Finding fallback locations within ${maxRange}km radius`);
    
    const cacheKey = `fallback-${userLat.toFixed(2)}-${userLng.toFixed(2)}-${maxRange}`;
    
    const cachedData = locationCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_LIFETIME) {
      console.log(`Using cached fallback locations`);
      return cachedData.locations;
    }
    
    const points = await findLocationsWithinRadius(
      userLat,
      userLng, 
      maxRange,
      false
    );
    
    if (!points || points.length === 0) {
      return [];
    }
    
    const sortedByDistance = [...points]
      .sort((a, b) => (b.distance || 0) - (a.distance || 0))
      .slice(0, 15);
    
    const locationsWithSiqs = await batchCalculateSiqs(sortedByDistance);
    
    const result = locationsWithSiqs
      .sort((a, b) => (b.siqs || 0) - (a.siqs || 0))
      .slice(0, 9);
    
    locationCache.set(cacheKey, {
      locations: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error("Error finding fallback locations:", error);
    return [];
  }
}

export function clearLocationCache(): void {
  const cacheSize = locationCache.size;
  locationCache.clear();
  console.log(`Location cache cleared (${cacheSize} entries removed)`);
}

export function getLocationCacheSize(): number {
  return locationCache.size;
}
