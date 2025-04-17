
import { calculateSIQS } from '@/lib/calculateSIQS';
import { generateSiqsCacheKey, cacheSiqsResult, getCachedSiqsResult, clearSiqsCache } from './realTimeSiqs/siqsCache';
import { calculateRealTimeSiqs } from './realTimeSiqs/siqsCalculator';

// A simple cache to store location SIQS results
const locationCache: Record<string, any> = {};

/**
 * Calculate real-time SIQS score for a location
 * This version uses caching for better performance
 */
export async function calculateSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number,
  weatherData?: any
) {
  try {
    // Generate cache key
    const cacheKey = generateSiqsCacheKey(latitude, longitude, bortleScale, weatherData);
    
    // Check cache first
    const cachedResult = getCachedSiqsResult(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // If not in cache, calculate SIQS
    const result = await calculateSIQS({
      cloudCover: weatherData?.cloudCover || 0,
      bortleScale: bortleScale || 5,
      seeingConditions: 3, // Default to average
      windSpeed: weatherData?.windSpeed || 0,
      humidity: weatherData?.humidity || 0,
      moonPhase: 0.25, // Default if not provided
      aqi: weatherData?.aqi || 0
    });
    
    // Make sure result has both score and siqs properties
    if (result && typeof result.siqs === 'number' && typeof result.score === 'undefined') {
      result.score = result.siqs;
    } else if (result && typeof result.score === 'number' && typeof result.siqs === 'undefined') {
      result.siqs = result.score;
    }
    
    // Cache the result
    cacheSiqsResult(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error calculating SIQS:', error);
    return { siqs: 0, score: 0, isViable: false };
  }
}

// Batch calculation function for multiple locations
export async function batchCalculateSiqs(locations: any[], weatherData?: any) {
  if (!locations || !Array.isArray(locations)) {
    return [];
  }

  return Promise.all(locations.map(async (location) => {
    try {
      if (!location || !location.latitude || !location.longitude) {
        return location;
      }

      const siqsResult = await calculateSiqs(
        location.latitude,
        location.longitude,
        location.bortleScale || 5,
        location.weatherData || weatherData
      );

      return {
        ...location,
        siqsResult
      };
    } catch (error) {
      console.error('Error batch calculating SIQS:', error);
      return location;
    }
  }));
}

/**
 * Clear the SIQS calculation cache
 */
export function clearSiqsCalculationCache() {
  clearSiqsCache();
}

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

// Export the functions from realTimeSiqs/siqsCalculator for consistency
export { calculateRealTimeSiqs, clearSiqsCache };
