
import { haversineDistance } from "@/utils/geoUtils";

/**
 * Calculate distances between user location and a list of points
 * @param userLocation User's current position
 * @param locations List of locations to calculate distance to
 * @returns Locations with distances added
 */
export function calculateDistancesToUser(
  userLocation: { latitude: number; longitude: number } | null,
  locations: any[]
) {
  if (!userLocation || !Array.isArray(locations)) {
    return locations;
  }

  return locations.map((location) => {
    if (!location || !location.latitude || !location.longitude) {
      return location;
    }

    try {
      const distance = haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );

      return {
        ...location,
        distance
      };
    } catch (error) {
      console.error("Error calculating distance:", error);
      return location;
    }
  });
}

/**
 * Sort locations by SIQS score
 */
export const sortBySIQS = (locations: any[]) => {
  if (!Array.isArray(locations)) return [];

  return [...locations].sort((a, b) => {
    // Get SIQS score from result object or direct property
    const scoreA = a.siqsResult?.score || a.siqsResult?.siqs || a.siqs || 0;
    const scoreB = b.siqsResult?.score || b.siqsResult?.siqs || b.siqs || 0;
    
    // Higher scores first
    return scoreB - scoreA;
  });
};

/**
 * Sort locations by distance
 */
export const sortByDistance = (locations: any[]) => {
  if (!Array.isArray(locations)) return [];

  return [...locations].sort((a, b) => {
    const distA = typeof a.distance === "number" ? a.distance : Infinity;
    const distB = typeof b.distance === "number" ? b.distance : Infinity;
    return distA - distB;
  });
};

/**
 * Filter locations to only include those within a certain distance
 */
export const filterByDistance = (locations: any[], maxDistance: number) => {
  if (!Array.isArray(locations) || !maxDistance) return locations;

  return locations.filter((loc) => {
    return typeof loc.distance === "number" && loc.distance <= maxDistance;
  });
};

/**
 * Filter locations by minimum SIQS score
 */
export const filterByMinimumSIQS = (locations: any[], minScore: number) => {
  if (!Array.isArray(locations) || !minScore) return locations;

  return locations.filter((loc) => {
    const score = loc.siqsResult?.score || loc.siqsResult?.siqs || loc.siqs || 0;
    return score >= minScore;
  });
};

/**
 * Filter locations by their certification status
 */
export const filterByCertification = (locations: any[], showCertifiedOnly: boolean) => {
  if (!Array.isArray(locations) || !showCertifiedOnly) return locations;

  return locations.filter((loc) => {
    return loc.certification || loc.isDarkSkyReserve;
  });
};
