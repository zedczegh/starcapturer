
/**
 * Real-time SIQS calculation service
 * Optimized for performance and reliability
 */

import { fetchForecastDataForToday } from "@/lib/api/daily-forecast";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Cache for SIQS calculations to prevent redundant API calls
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
}>();

// Cache lifetime: 30 minutes
const CACHE_LIFETIME = 30 * 60 * 1000;

// Maximum wait time for SIQS calculation before timing out (5 seconds)
const SIQS_CALCULATION_TIMEOUT = 5000;

/**
 * Clear the SIQS cache
 */
export function clearSiqsCache(): void {
  siqsCache.clear();
  console.log("SIQS cache cleared");
}

/**
 * Generate a cache key for SIQS calculations
 */
function generateSiqsCacheKey(latitude: number, longitude: number, bortleScale?: number): string {
  return `siqs-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale || 'auto'}`;
}

/**
 * Timeout wrapper for promises
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let resolved = false;
    
    // Set timeout
    const timer = setTimeout(() => {
      if (!resolved) {
        console.warn(`Operation timed out after ${ms}ms`);
        resolved = true;
        resolve(fallbackValue);
      }
    }, ms);
    
    // Try to resolve with the actual promise
    promise.then((result) => {
      if (!resolved) {
        clearTimeout(timer);
        resolved = true;
        resolve(result);
      }
    }).catch((error) => {
      console.error("Error in timed operation:", error);
      if (!resolved) {
        clearTimeout(timer);
        resolved = true;
        resolve(fallbackValue);
      }
    });
  });
}

/**
 * Calculate real-time SIQS for a location
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale?: number
): Promise<{ siqs: number; timestamp: number; fromCache: boolean }> {
  // Generate cache key
  const cacheKey = generateSiqsCacheKey(latitude, longitude, bortleScale);
  
  // Check cache first
  const cachedData = siqsCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_LIFETIME) {
    return { 
      ...cachedData, 
      fromCache: true 
    };
  }
  
  try {
    console.log(`Calculating real-time SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    // Fetch today's forecast data with timeout protection
    const forecastPromise = fetchForecastDataForToday({
      latitude,
      longitude
    });
    
    // Use timeout to prevent long-running operations
    const forecast = await withTimeout(
      forecastPromise,
      SIQS_CALCULATION_TIMEOUT,
      null
    );
    
    // Default SIQS if no forecast or calculation times out
    let siqs = 0;
    
    if (forecast) {
      // We have forecast data, calculate SIQS using the actual Bortle scale or a reasonable default
      siqs = calculateDirectSiqsScore(
        bortleScale || 4, // Use provided Bortle scale or default to 4
        forecast.current?.cloudCover || 0,
        forecast.current?.moonPhase || 0,
        forecast.current?.humidity || 60
      );
    } else {
      // No forecast data, use fallback calculation
      siqs = calculateFallbackSiqs(bortleScale);
    }
    
    // Cache the result
    const result = {
      siqs,
      timestamp: Date.now(),
      fromCache: false
    };
    
    siqsCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    
    // Return a fallback value based on Bortle scale
    const fallbackSiqs = calculateFallbackSiqs(bortleScale);
    return {
      siqs: fallbackSiqs,
      timestamp: Date.now(),
      fromCache: false
    };
  }
}

/**
 * Direct calculation of SIQS score from parameters
 * Avoids async complexity for better performance
 */
function calculateDirectSiqsScore(
  bortleScale: number,
  cloudCover: number,
  moonPhase: number,
  humidity: number,
): number {
  // Start with a perfect score of 10
  let score = 10;
  
  // Penalize for light pollution (1-9 Bortle scale)
  // Higher Bortle = higher light pollution = lower score
  const bortlePenalty = Math.min(7, (bortleScale - 1) * 0.8);
  score -= bortlePenalty;
  
  // Penalize for cloud cover (0-100%)
  const cloudPenalty = cloudCover * 0.08;
  score -= cloudPenalty;
  
  // Penalize for moon phase (0-1, where 1 is full moon)
  const moonPenalty = moonPhase * 2;
  score -= moonPenalty;
  
  // Slight penalty for very high humidity
  if (humidity > 80) {
    score -= (humidity - 80) * 0.05;
  }
  
  // Ensure score is within 0-10 range
  return Math.max(0, Math.min(10, score));
}

/**
 * Calculate a fallback SIQS score based just on Bortle scale
 */
function calculateFallbackSiqs(bortleScale?: number, cloudCover?: number): number {
  if (cloudCover && cloudCover > 60) {
    return 0; // Heavy cloud cover means poor viewing conditions
  }
  
  // If we have a Bortle scale, estimate SIQS based on that
  if (bortleScale) {
    // Invert the Bortle scale (1-9) to get approximate SIQS (9-1)
    // Then scale to SIQS range (0-10)
    const invertedValue = 10 - bortleScale;
    // Apply cloud penalty if available
    const cloudPenalty = cloudCover ? (cloudCover / 100) * 3 : 0;
    return Math.max(0, Math.min(10, invertedValue + 1 - cloudPenalty));
  }
  
  // No Bortle scale or cloud cover data, return a moderate default
  return 5;
}

/**
 * Batch calculate SIQS for multiple locations
 */
export async function batchCalculateSiqs(
  locations: SharedAstroSpot[],
  maxParallel: number = 5
): Promise<SharedAstroSpot[]> {
  // Create a copy to avoid mutating the original
  const locationsCopy = [...locations];
  
  // Process in batches to avoid overwhelming the system
  const processBatch = async (batch: SharedAstroSpot[]): Promise<SharedAstroSpot[]> => {
    // Create an array of SIQS calculation promises
    const promises = batch.map(async (location) => {
      try {
        const result = await calculateRealTimeSiqs(
          location.latitude,
          location.longitude,
          location.bortleScale
        );
        
        // Return new object with updated SIQS
        return {
          ...location,
          siqs: result.siqs
        };
      } catch (error) {
        console.error(`Error calculating SIQS for location ${location.id}:`, error);
        // Return original location if calculation fails
        return location;
      }
    });
    
    // Wait for all promises to resolve
    return Promise.all(promises);
  };
  
  const results: SharedAstroSpot[] = [];
  
  // Process locations in batches of maxParallel
  for (let i = 0; i < locationsCopy.length; i += maxParallel) {
    const batch = locationsCopy.slice(i, i + maxParallel);
    const processedBatch = await processBatch(batch);
    results.push(...processedBatch);
  }
  
  return results;
}
