
import { calculateSiqs } from '../realTimeSiqsService';
import { calculateRealTimeSiqs } from '../realTimeSiqs/realTimeSiqsService';
import { haversineDistance } from '@/utils/geoUtils';

// A simple cache to store location SIQS results
const locationCache: Record<string, any> = {};

/**
 * Update locations with real-time SIQS scores
 */
export async function updateLocationsWithRealTimeSiqs(locations: any[], weatherData?: any) {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return [];
  }

  return Promise.all(locations.map(async (location) => {
    try {
      // Skip invalid locations
      if (!location || !location.latitude || !location.longitude) {
        return location;
      }

      // Create a cache key
      const cacheKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
      
      // Check if we have a recent cache entry (within 10 minutes)
      const cachedResult = locationCache[cacheKey];
      if (cachedResult && (Date.now() - cachedResult.timestamp) < 10 * 60 * 1000) {
        return {
          ...location,
          siqsResult: cachedResult.siqsResult
        };
      }
      
      // Calculate SIQS for this location
      const siqsResult = await calculateSiqs(
        location.latitude,
        location.longitude,
        location.bortleScale || 5,
        location.weatherData || weatherData
      );
      
      // Cache the result
      locationCache[cacheKey] = {
        siqsResult,
        timestamp: Date.now()
      };
      
      // Return updated location
      return {
        ...location,
        siqsResult
      };
    } catch (error) {
      console.error('Error updating location with SIQS:', error);
      return location;
    }
  }));
}

/**
 * Clear the location cache
 */
export function clearLocationCache() {
  Object.keys(locationCache).forEach(key => {
    delete locationCache[key];
  });
  console.log('Location cache cleared');
}
