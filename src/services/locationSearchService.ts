
/**
 * Service for location search
 */
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/lib/api/utils';

/**
 * Find locations within a specified radius
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number,
  includeAll: boolean = false,
  limit: number = 20,
  page: number = 1
): Promise<SharedAstroSpot[]> {
  // Mock implementation that would be replaced with actual API call
  // This is just a placeholder until a real implementation is available
  const mockLocations: SharedAstroSpot[] = [
    {
      id: "loc1",
      name: "Dark Sky Preserve",
      chineseName: "暗空保护区",
      latitude: latitude + 0.1,
      longitude: longitude + 0.1,
      bortleScale: 2,
      siqs: 7.5,
      distance: calculateDistance(latitude, longitude, latitude + 0.1, longitude + 0.1),
      timestamp: new Date().toISOString(),
      certification: "IDA Gold",
      isDarkSkyReserve: true
    },
    {
      id: "loc2",
      name: "Mountain Observatory",
      chineseName: "山区天文台",
      latitude: latitude - 0.2,
      longitude: longitude - 0.15,
      bortleScale: 3,
      siqs: 6.8,
      distance: calculateDistance(latitude, longitude, latitude - 0.2, longitude - 0.15),
      timestamp: new Date().toISOString(),
      certification: "",
      isDarkSkyReserve: false
    }
  ];
  
  return mockLocations;
}

/**
 * Find calculated locations with better sky quality
 */
export async function findCalculatedLocations(
  latitude: number,
  longitude: number,
  radius: number,
  allowExpand: boolean = true,
  maxResults: number = 10
): Promise<SharedAstroSpot[]> {
  // Mock implementation
  const mockLocations: SharedAstroSpot[] = [
    {
      id: "calc1",
      name: "Calculated Dark Spot",
      chineseName: "计算暗点",
      latitude: latitude + 0.3,
      longitude: longitude + 0.25,
      bortleScale: 3,
      siqs: 6.2,
      distance: calculateDistance(latitude, longitude, latitude + 0.3, longitude + 0.25),
      timestamp: new Date().toISOString(),
      calculatedLocation: true
    }
  ];
  
  return mockLocations;
}

/**
 * Sort locations by quality
 */
export function sortLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    // Sort by SIQS score first
    if ((b.siqs || 0) !== (a.siqs || 0)) {
      return (b.siqs || 0) - (a.siqs || 0);
    }
    
    // Then by distance if SIQS is the same
    return (a.distance || 0) - (b.distance || 0);
  });
}

/**
 * Fetch calculated locations
 */
export const fetchCalculatedLocations = async (
  latitude: number,
  longitude: number,
  searchRadius: number
): Promise<SharedAstroSpot[]> => {
  // Mock implementation
  return findCalculatedLocations(latitude, longitude, searchRadius);
};
