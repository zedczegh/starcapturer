import { calculateRealTimeSiqs } from './siqsCalculator';
import { detectAndFixAnomalies, assessDataReliability } from './siqsAnomalyDetector';
import { clearSiqsCache, cleanupExpiredCache, clearLocationSiqsCache } from './siqsCache';
import { SiqsResult, SiqsCalculationOptions, WeatherDataWithClearSky } from './siqsTypes';
import { fetchWeatherData } from '@/lib/api';

// Export functions from siqsCache for external use
export { clearSiqsCache, clearLocationSiqsCache, cleanupExpiredCache };

/**
 * Enhanced real-time SIQS calculation with built-in anomaly detection
 * and reliability assessment
 * 
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param bortleScale Bortle scale of the location
 * @param options Calculation options
 */
export async function calculateEnhancedRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number,
  options: SiqsCalculationOptions = {}
): Promise<SiqsResult> {
  console.log(`Calculating enhanced SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  
  try {
    // Perform base calculation
    const siqsResult = await calculateRealTimeSiqs(
      latitude, 
      longitude, 
      bortleScale
    );
    
    if (options.anomalyDetection !== false) {
      // Get fresh weather data for anomaly detection
      const weatherData = await fetchWeatherData({ latitude, longitude });
      
      if (weatherData && siqsResult.siqs > 0) {
        // Add required properties to match WeatherDataWithClearSky
        const weatherDataWithCoords: WeatherDataWithClearSky = {
          ...weatherData,
          latitude,
          longitude
        };
        
        // Detect and fix anomalies
        const correctedResult = detectAndFixAnomalies(
          siqsResult,
          weatherDataWithCoords,
          { latitude, longitude }
        );
        
        // Assess data reliability
        const reliability = assessDataReliability(
          weatherDataWithCoords,
          null // We don't have forecast data here
        );
        
        // Add reliability metadata
        if (options.includeMetadata !== false) {
          return {
            ...correctedResult,
            metadata: {
              ...correctedResult.metadata,
              calculatedAt: new Date().toISOString(), // Ensure calculatedAt is present
              sources: correctedResult.metadata?.sources || {
                weather: true,
                forecast: false,
                clearSky: false,
                lightPollution: false
              },
              reliability: {
                score: reliability.confidenceScore,
                issues: reliability.issues
              }
            }
          };
        }
        
        return correctedResult;
      }
    }
    
    return siqsResult;
  } catch (error) {
    console.error("Error calculating enhanced SIQS:", error);
    return { siqs: 0, isViable: false };
  }
}

/**
 * Clean up SIQS cache periodically
 */
export function initializeSiqsCacheCleanup() {
  // Clean expired entries every 30 minutes
  const CLEANUP_INTERVAL = 30 * 60 * 1000;
  
  setInterval(() => {
    const expiredCount = cleanupExpiredCache();
    if (expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired SIQS cache entries`);
    }
  }, CLEANUP_INTERVAL);
  
  console.log("SIQS cache cleanup initialized");
}

// Auto-initialize cache cleanup
initializeSiqsCacheCleanup();

/**
 * Calculate real-time SIQS for multiple locations in parallel
 * with intelligent, adaptive batch processing to avoid rate limits
 */
export async function batchCalculateRealTimeSiqs(
  locations: Array<{ latitude: number; longitude: number; bortleScale?: number }>,
  initialConcurrency: number = 3
): Promise<SiqsResult[]> {
  if (!locations || !locations.length) {
    return [];
  }

  let concurrency = initialConcurrency;
  const minConcurrency = 1;
  const maxConcurrency = 8;
  const results: SiqsResult[] = new Array(locations.length);
  let current = 0;
  let inFlight = 0;
  let lastError = 0;
  let adaptDelay = 0;
  let lastBatchDuration = 0;
  let batchesCount = 0;

  const startTimes: number[] = [];

  function nextIdx() {
    while (current < locations.length && typeof results[current] !== "undefined") {
      current++;
    }
    return current < locations.length ? current++ : null;
  }

  return new Promise((resolve) => {
    const tryNext = async () => {
      const idx = nextIdx();
      if (idx === null) {
        if (inFlight === 0) {
          resolve(results);
        }
        return;
      }
      const loc = locations[idx];
      inFlight++;
      startTimes[idx] = Date.now();
      try {
        const result = await calculateRealTimeSiqs(
          loc.latitude,
          loc.longitude,
          loc.bortleScale || 5
        );
        lastBatchDuration = Date.now() - startTimes[idx];
        results[idx] = result;
        // If recent batch was fast and there were no errors, accelerate
        if (lastError === 0 && lastBatchDuration < 700) {
          concurrency = Math.min(maxConcurrency, concurrency + 1);
        }
      } catch (err) {
        lastError++;
        results[idx] = { siqs: 0, isViable: false };
        // Slow down on errors
        concurrency = Math.max(minConcurrency, concurrency - 1);
      } finally {
        inFlight--;
        setTimeout(() => {
          // Adaptive delay: if average batch was slow or had errors, wait a bit
          const delay = lastError > 0 || lastBatchDuration > 1100 ? 400 : 80;
          batchesCount++;
          adaptDelay = delay;
          // Try to saturate up to concurrency slots
          while (inFlight < concurrency) {
            tryNext();
          }
        }, adaptDelay);
      }
    };

    // Start up to initial concurrency workers
    while (inFlight < concurrency && current < locations.length) {
      tryNext();
    }
  });
}
