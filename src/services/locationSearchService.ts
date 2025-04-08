
import { SharedAstroSpot, getRecommendedPhotoPoints } from "@/lib/api/astroSpots";

/**
 * Service for searching and managing astronomy locations
 */
export async function findLocationsNear(
  latitude: number, 
  longitude: number,
  radius: number = 100
): Promise<SharedAstroSpot[]> {
  try {
    return await getRecommendedPhotoPoints(latitude, longitude, radius);
  } catch (error) {
    console.error("Error finding locations:", error);
    return [];
  }
}

/**
 * Find certified dark sky locations globally
 */
export async function findCertifiedLocations(): Promise<SharedAstroSpot[]> {
  // This would call the real API in production
  return [];
}

/**
 * Search locations by name
 */
export async function searchLocationsByName(name: string): Promise<SharedAstroSpot[]> {
  // This would search the database in production
  return [];
}
