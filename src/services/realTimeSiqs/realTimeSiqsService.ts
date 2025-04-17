
import { calculateRealTimeSiqs } from './siqsCalculator';
import { detectAndFixAnomalies, assessDataReliability } from './siqsAnomalyDetector';
import { clearSiqsCache, cleanupExpiredCache, clearLocationSiqsCache } from './siqsCache';
import { SiqsResult, SiqsCalculationOptions, WeatherDataWithClearSky } from './siqsTypes';
import { fetchWeatherData } from '@/lib/api';

// Export functions from siqsCache for external use
export { clearSiqsCache, clearLocationSiqsCache };

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
 * with intelligent batch processing to avoid rate limits
 */
export async function batchCalculateRealTimeSiqs(
  locations: Array<{ latitude: number; longitude: number; bortleScale?: number }>,
  concurrency: number = 3
): Promise<SiqsResult[]> {
  if (!locations || !locations.length) {
    return [];
  }
  
  console.log(`Batch calculating SIQS for ${locations.length} locations with concurrency ${concurrency}`);
  
  const results: SiqsResult[] = [];
  
  // Process in batches to prevent overwhelming APIs
  for (let i = 0; i < locations.length; i += concurrency) {
    const batch = locations.slice(i, i + concurrency);
    
    const batchPromises = batch.map(loc => 
      calculateRealTimeSiqs(
        loc.latitude, 
        loc.longitude, 
        loc.bortleScale || 5
      ).catch(err => {
        console.error(`Error calculating SIQS for location ${loc.latitude},${loc.longitude}:`, err);
        return { siqs: 0, isViable: false };
      })
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Pause between batches if we have more to process
    if (i + concurrency < locations.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Batch calculate SIQS scores for multiple locations
 */
export async function batchCalculateSiqs(locations: any[]): Promise<any[]> {
  if (!locations || locations.length === 0) return [];
  
  try {
    const results = await Promise.all(
      locations.map(async (location) => {
        if (!location.latitude || !location.longitude) {
          return location;
        }
        
        const bortleScale = location.bortleScale || 
                          (location.isDarkSkyReserve ? 2 : 5);
        
        try {
          const result = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            bortleScale
          );
          
          return {
            ...location,
            siqs: result.siqs,
            siqsResult: result
          };
        } catch (error) {
          console.error(`Error calculating SIQS for ${location.name}:`, error);
          return location;
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error("Error in batch SIQS calculation:", error);
    return locations;
  }
}
