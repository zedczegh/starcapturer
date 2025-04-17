
import { calculateRealTimeSiqs } from './realTimeSiqs/siqsCalculator';
import { SiqsResult } from './realTimeSiqs/siqsTypes';

// Cache for SIQS calculations
const siqsCache: Record<string, {result: SiqsResult, timestamp: number}> = {};

/**
 * Calculate SIQS score with caching
 */
export async function calculateSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number,
  weatherData?: any,
  options: any = {}
): Promise<SiqsResult> {
  try {
    // Generate cache key
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale}-${JSON.stringify(weatherData || {})}`;
    
    // Check cache (valid for 10 minutes)
    const cachedResult = siqsCache[cacheKey];
    if (cachedResult && (Date.now() - cachedResult.timestamp) < 10 * 60 * 1000) {
      return cachedResult.result;
    }
    
    // Calculate new result - export calculateRealTimeSiqs from the siqsCalculator module
    const result = await calculateRealTimeSiqs(
      latitude,
      longitude,
      bortleScale
    );
    
    // Cache the result
    siqsCache[cacheKey] = {
      result,
      timestamp: Date.now()
    };
    
    return result;
  } catch (error) {
    console.error("Error calculating SIQS:", error);
    return {
      siqs: 0,
      isViable: false
    };
  }
}

/**
 * Batch calculate SIQS for multiple locations
 */
export async function batchCalculateSiqs(
  locations: Array<{latitude: number, longitude: number, bortleScale?: number, weatherData?: any}>,
  defaultWeatherData?: any
): Promise<SiqsResult[]> {
  try {
    return await Promise.all(
      locations.map(loc => 
        calculateSiqs(
          loc.latitude,
          loc.longitude,
          loc.bortleScale || 5,
          loc.weatherData || defaultWeatherData
        )
      )
    );
  } catch (error) {
    console.error("Error batch calculating SIQS:", error);
    return locations.map(() => ({
      siqs: 0,
      isViable: false
    }));
  }
}

/**
 * Clear SIQS calculation cache
 */
export function clearSiqsCache(): void {
  Object.keys(siqsCache).forEach(key => {
    delete siqsCache[key];
  });
  console.log("SIQS cache cleared");
}

// Re-export calculateRealTimeSiqs for direct use
export { calculateRealTimeSiqs };

