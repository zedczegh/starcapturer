
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { getCertifiedLocationsNearby, getAllCertifiedLocations } from "./darkSkyLocationService";
import { getCachedLocationSearch, cacheLocationSearch } from "./locationCacheService";

// Maximum number of calculated locations to return
const MAX_CALCULATED_LOCATIONS = 200;

/**
 * Find certified and calculated locations within a specified radius
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param onlyCertified Return only certified dark sky locations
 * @returns Array of locations within the radius, sorted by distance
 */
export const findLocationsWithinRadius = async (
  latitude: number,
  longitude: number,
  radius: number,
  onlyCertified: boolean = false
): Promise<SharedAstroSpot[]> => {
  // First try to get from cache
  const cachedResults = getCachedLocationSearch(latitude, longitude, radius);
  if (cachedResults) {
    return onlyCertified 
      ? cachedResults.filter(loc => loc.isDarkSkyReserve || loc.certification)
      : cachedResults;
  }
  
  // Get certified dark sky locations
  const certifiedLocations = getCertifiedLocationsNearby(latitude, longitude, radius);
  
  // If only certified locations are requested, return them immediately
  if (onlyCertified) {
    return certifiedLocations;
  }
  
  // Get additional calculated locations
  const calculatedLocations = await findCalculatedLocations(latitude, longitude, radius, false);
  
  // Combine certified and calculated locations, ensuring no duplicates
  const allLocations = [...certifiedLocations];
  
  // Create a set of certified location IDs for fast lookups
  const certifiedIds = new Set(certifiedLocations.map(loc => loc.id));
  
  // Add calculated locations that aren't duplicates
  calculatedLocations.forEach(calcLoc => {
    if (!certifiedIds.has(calcLoc.id)) {
      allLocations.push(calcLoc);
    }
  });
  
  // Sort locations by distance
  allLocations.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  
  // Cache the results for future use
  cacheLocationSearch(latitude, longitude, radius, allLocations);
  
  return allLocations;
};

/**
 * Find algorithmically calculated locations near a point
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param expandSearch Whether to expand search if no results are found
 * @returns Array of calculated locations
 */
export const findCalculatedLocations = async (
  latitude: number,
  longitude: number,
  radius: number,
  expandSearch: boolean = true
): Promise<SharedAstroSpot[]> => {
  try {
    // Get calculation points from database
    const { getCalculationPoints } = await import('@/data/calculationPoints');
    const points = await getCalculationPoints();
    
    if (!points || points.length === 0) {
      console.error("No calculation points found");
      return [];
    }
    
    // Calculate distance for each point and filter by radius
    const locationsWithDistance = points.map(point => {
      const distance = calculateDistance(
        latitude,
        longitude,
        point.latitude,
        point.longitude
      );
      
      return {
        ...point,
        distance,
        timestamp: point.timestamp || new Date().toISOString()
      };
    }).filter(point => point.distance <= radius);
    
    // Sort by distance and limit to maximum locations
    locationsWithDistance.sort((a, b) => a.distance - b.distance);
    
    // If no results and expandSearch is true, try with a larger radius
    if (locationsWithDistance.length === 0 && expandSearch) {
      const expandedRadius = Math.min(radius * 1.5, 5000);
      return findCalculatedLocations(latitude, longitude, expandedRadius, false);
    }
    
    return locationsWithDistance.slice(0, MAX_CALCULATED_LOCATIONS);
  } catch (error) {
    console.error("Error finding calculated locations:", error);
    return [];
  }
};

/**
 * Get all known locations within a radius for filtering
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Object with certified and calculated locations
 */
export const getAllLocationsWithinRadius = async (
  latitude: number,
  longitude: number,
  radius: number
): Promise<{
  certified: SharedAstroSpot[];
  calculated: SharedAstroSpot[];
}> => {
  // Get all certified locations
  const allCertified = getAllCertifiedLocations();
  
  // Filter by radius and add distance
  const certifiedWithDistance = allCertified.map(loc => {
    const distance = calculateDistance(
      latitude,
      longitude,
      loc.latitude,
      loc.longitude
    );
    
    return {
      ...loc,
      distance
    };
  }).filter(loc => loc.distance <= radius);
  
  // Get calculated locations
  const calculatedLocations = await findCalculatedLocations(
    latitude,
    longitude,
    radius,
    false
  );
  
  // Filter out any calculated locations that match certified ones
  const certifiedCoords = new Set(
    certifiedWithDistance.map(loc => `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`)
  );
  
  const uniqueCalculated = calculatedLocations.filter(loc => {
    const coordKey = `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`;
    return !certifiedCoords.has(coordKey);
  });
  
  console.log(`Processing ${certifiedWithDistance.length + uniqueCalculated.length} locations for certified/calculated separation with radius: ${radius}km`);
  console.log(`Found ${certifiedWithDistance.length} certified and ${uniqueCalculated.length} calculated locations with radius: ${radius}km`);
  
  return {
    certified: certifiedWithDistance,
    calculated: uniqueCalculated
  };
};
