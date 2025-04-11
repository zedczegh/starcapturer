
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { filterLocationsByQualityAndDistance, sortLocationsByQualityAndDistance } from "@/utils/locationFilterUtils";
import { calculateDistance } from "@/utils/geoUtils";
import { findLocationsWithinRadius } from "./locationSearchService";

/**
 * Find best locations for stargazing within a radius
 */
export async function findBestLocations(
  latitude: number,
  longitude: number,
  radius: number = 100,
  limit: number = 10
): Promise<SharedAstroSpot[]> {
  try {
    // Get all locations within radius
    const allLocations = await findLocationsWithinRadius(
      latitude,
      longitude,
      radius,
      false, // Not only certified
      50 // Get more locations than we need for better filtering
    );
    
    // Filter by quality and distance
    const filteredLocations = filterLocationsByQualityAndDistance(
      allLocations,
      { latitude, longitude },
      radius,
      50 // Minimum quality threshold
    );
    
    // Sort locations by quality and distance
    const sortedLocations = sortLocationsByQualityAndDistance(filteredLocations);
    
    // Return top locations
    return sortedLocations.slice(0, limit);
  } catch (error) {
    console.error("Error finding best locations:", error);
    return [];
  }
}

/**
 * Find nearest certified location
 */
export async function findNearestCertifiedLocation(
  latitude: number,
  longitude: number,
  maxDistance: number = 1000
): Promise<SharedAstroSpot | null> {
  try {
    // Get certified locations within a large radius
    const certifiedLocations = await findLocationsWithinRadius(
      latitude,
      longitude,
      maxDistance,
      true, // Only certified
      50 // Limit
    );
    
    if (certifiedLocations.length === 0) {
      return null;
    }
    
    // Add/update distance property and sort
    const sortedLocations = certifiedLocations
      .map(location => {
        const distance = calculateDistance(
          latitude,
          longitude,
          location.latitude,
          location.longitude
        );
        return { ...location, distance };
      })
      .sort((a, b) => a.distance - b.distance);
    
    return sortedLocations[0];
  } catch (error) {
    console.error("Error finding nearest certified location:", error);
    return null;
  }
}
