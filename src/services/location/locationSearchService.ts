
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getCachedLocations } from './locationCacheService';
import { fetchLocationsFromApi } from './locationApiService';
import { calculateDistance } from '@/utils/geoUtils';

/**
 * Find locations within a specified radius of a center point
 */
export const findLocationsWithinRadius = async (
  latitude: number,
  longitude: number,
  radius: number
): Promise<SharedAstroSpot[]> => {
  // Try to get locations from cache first
  const cachedLocations = getCachedLocations(latitude, longitude, radius);
  if (cachedLocations && cachedLocations.length > 0) {
    console.log(`Retrieved ${cachedLocations.length} locations from cache`);
    return cachedLocations;
  }

  // If not in cache, fetch from API
  try {
    const locations = await fetchLocationsFromApi(latitude, longitude, radius);
    
    // Calculate distance for each location
    const locationsWithDistance = locations.map(location => {
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
    });
    
    return locationsWithDistance;
  } catch (error) {
    console.error('Error finding locations within radius:', error);
    return [];
  }
};
