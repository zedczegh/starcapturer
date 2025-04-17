
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "@/services/realTimeSiqs/siqsCalculator";
import { batchCalculateSiqs } from "@/services/realTimeSiqs/batchProcessor";
import { calculateDistance } from "@/utils/geoUtils";

/**
 * Find locations within a specific radius
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @returns Promise resolving to array of locations
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number
): Promise<SharedAstroSpot[]> {
  // Sample implementation - In a real app this would query a database
  const sampleLocations: SharedAstroSpot[] = [
    {
      id: "sample-1",
      name: "Clear Sky Point",
      latitude: latitude + 0.05,
      longitude: longitude + 0.05,
      siqs: { score: 7.5, isViable: true },
      certification: "Dark Sky Park",
      bortleScale: 3
    },
    {
      id: "sample-2",
      name: "Stargazer Hill",
      latitude: latitude - 0.08,
      longitude: longitude + 0.1,
      siqs: { score: 6.8, isViable: true },
      bortleScale: 4
    },
  ];
  
  // Calculate distance for each location
  const locationsWithDistance = sampleLocations.map(loc => ({
    ...loc,
    distance: calculateDistance(latitude, longitude, loc.latitude, loc.longitude)
  }));
  
  // Filter by radius
  return locationsWithDistance.filter(loc => 
    loc.distance !== undefined && loc.distance <= radius
  );
}

/**
 * Find calculated locations based on user position
 * @param latitude Center latitude
 * @param longitude Center longitude
 * @param radius Search radius in km
 * @param allowExpandRadius Allow expanding search radius if no results
 * @param maxResults Maximum number of results to return
 * @returns Promise resolving to array of calculated locations
 */
export async function findCalculatedLocations(
  latitude: number,
  longitude: number,
  radius: number,
  allowExpandRadius: boolean = false,
  maxResults: number = 10
): Promise<SharedAstroSpot[]> {
  // Generate some calculated locations in various directions
  const basePoints = [
    { lat: latitude + 0.1, lng: longitude + 0.1 },
    { lat: latitude - 0.15, lng: longitude + 0.05 },
    { lat: latitude + 0.05, lng: longitude - 0.2 },
    { lat: latitude - 0.1, lng: longitude - 0.1 },
  ];
  
  // Create sample locations
  const calculatedLocations: SharedAstroSpot[] = basePoints.map((point, index) => ({
    id: `calc-${index}`,
    name: `Calculated Point ${index + 1}`,
    latitude: point.lat,
    longitude: point.lng,
    bortleScale: 4,
    siqs: { score: 6.0 + Math.random() * 2, isViable: true },
    distance: calculateDistance(latitude, longitude, point.lat, point.lng)
  }));
  
  // Filter by distance and limit results
  return calculatedLocations
    .filter(loc => loc.distance !== undefined && loc.distance <= radius)
    .slice(0, maxResults);
}
