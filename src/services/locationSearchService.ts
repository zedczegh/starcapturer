
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { getCertifiedLocationsNearby, getAllCertifiedLocations } from "./darkSkyLocationService";
import { getCachedLocationSearch, cacheLocationSearch } from "./locationCacheService";
import { findCalculatedLocations } from "./locationCalculationService";

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

// Re-export from calculation service
export { findCalculatedLocations } from './locationCalculationService';
