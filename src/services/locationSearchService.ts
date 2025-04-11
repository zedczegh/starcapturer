
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { getDarkSkyAstroSpots } from "./darkSkyLocationService";
import { calculateDistance } from "@/utils/geoUtils";
import { isWaterLocation } from "@/utils/locationValidator";
import { getIDADarkSkyLocations } from "./idaLocationService";

/**
 * Find locations within a specified radius
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Promise of SharedAstroSpot array
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number
): Promise<SharedAstroSpot[]> {
  try {
    // Get dark sky locations from the database
    const darkSkySpots = getDarkSkyAstroSpots(latitude, longitude, radius);
    
    // Filter out water locations for better results
    const filteredLocations = darkSkySpots.filter(spot => {
      if (spot.isDarkSkyReserve || spot.certification) {
        return true; // Always include certified locations
      }
      
      return !isWaterLocation(spot.latitude, spot.longitude);
    });
    
    return filteredLocations;
  } catch (error) {
    console.error("Error finding locations within radius:", error);
    return [];
  }
}

/**
 * Find IDA certified locations within a specified radius
 * Maximum radius should be very large to capture all global certified locations
 */
export async function findCertifiedLocations(
  latitude: number,
  longitude: number,
  radius: number = 10000, // Default to global search
  limit: number = 100
): Promise<SharedAstroSpot[]> {
  try {
    // Get IDA dark sky locations globally
    const idaLocations = getIDADarkSkyLocations();
    
    // Calculate distance for each location and filter by radius
    const locationsWithDistance = idaLocations
      .map(location => {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          location.latitude, 
          location.longitude
        );
        
        return {
          ...location,
          distance
        };
      })
      .filter(location => location.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
    
    console.log(`Found ${locationsWithDistance.length} certified locations within ${radius}km radius`);
    return locationsWithDistance;
  } catch (error) {
    console.error("Error finding certified locations:", error);
    return [];
  }
}

/**
 * Sort locations by quality score and distance
 */
export function sortLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  if (!locations || locations.length === 0) return [];
  
  return [...locations].sort((a, b) => {
    // First prioritize certified locations
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // Then sort by SIQS score
    if (a.siqs !== undefined && b.siqs !== undefined) {
      if (a.siqs !== b.siqs) {
        return b.siqs - a.siqs; // Higher score first
      }
    }
    
    // Finally sort by distance
    const aDistance = a.distance || Number.MAX_VALUE;
    const bDistance = b.distance || Number.MAX_VALUE;
    return aDistance - bDistance;
  });
}
