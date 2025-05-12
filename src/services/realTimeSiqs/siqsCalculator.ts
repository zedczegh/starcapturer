
import { fetchForecastData, fetchWeatherData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { fetchClearSkyRate } from "@/lib/api/clearSkyRate";
import {
  hasCachedSiqs,
  getCachedSiqs,
  setSiqsCache
} from "./siqsCache";
import { calculateMoonPhase } from "./moonPhaseCalculator";
import { applyIntelligentAdjustments } from "./siqsAdjustments";
import { WeatherDataWithClearSky, SiqsResult } from "./siqsTypes";
import { findClimateRegion, getClimateAdjustmentFactor } from "./climateRegions";
import { findClosestEnhancedLocation } from "./enhancedLocationData";
import { getTerrainCorrectedBortleScale } from "@/utils/terrainCorrection";
import { extractSingleHourCloudCover } from "@/utils/weather/hourlyCloudCoverExtractor";

// Enhanced memoization system with LRU cache for better memory management
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  private timeouts: Map<K, NodeJS.Timeout>;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.timeouts = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    // Refresh item position by removing and re-adding
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V, ttlMs?: number): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.delete(oldestKey);
    }

    // Clear any existing timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
      this.timeouts.delete(key);
    }

    // Add new value
    this.cache.set(key, value);

    // Set expiry if needed
    if (ttlMs) {
      const timeout = setTimeout(() => {
        this.delete(key);
      }, ttlMs);
      this.timeouts.set(key, timeout);
    }
  }

  delete(key: K): boolean {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key)!);
      this.timeouts.delete(key);
    }
    return this.cache.delete(key);
  }

  clear(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.cache.clear();
  }
}

// Replace simple Map with LRU Cache for better memory management
const memoizedResults = new LRUCache<string, {result: SiqsResult, timestamp: number}>(200);
const MEMO_EXPIRY = 5 * 60 * 1000; // 5 minutes

function improveCalculatedLocationSIQS(initialScore: number, location: any): number {
  if (initialScore < 0.5) {
    console.log(`Improving low SIQS score for calculated location: ${initialScore}`);
    
    const boostFactors = [
      location.isDarkSkyReserve ? 1.5 : 1,
      location.bortleScale ? (9 - location.bortleScale) * 0.5 : 0,
      location.type === 'remote' ? 1.2 : 1
    ];
    
    const boostFactor = Math.min(
      2, 
      1 + boostFactors.reduce((acc, factor) => acc * factor, 1) - boostFactors.length
    );
    
    const improvedScore = Math.min(9.5, initialScore * boostFactor);
    
    console.log(`Boosted SIQS from ${initialScore} to ${improvedScore}`);
    
    return improvedScore;
  }
  
  return initialScore;
}

/**
 * Validates and reconciles nighttime cloud data with current conditions
 * 
 * @param cloudCover Current cloud cover percentage 
 * @param nighttimeData Nighttime cloud cover data
 * @returns Validated cloud cover percentage
 */
function validateNighttimeCloudData(cloudCover: number, nighttimeData?: { 
  average: number | null; 
  timeRange: string; 
  sourceType?: 'forecast' | 'calculated' | 'historical' | 'optimized' 
}): number {
  if (!nighttimeData || nighttimeData.average === null) return cloudCover;
  
  // Default timeRange if missing
  const timeRange = nighttimeData.timeRange || "18:00-06:00";
  
  const difference = Math.abs(cloudCover - nighttimeData.average);
  if (difference > 20) {
    console.log(`Using nighttime cloud cover ${nighttimeData.average}% instead of current ${cloudCover}% (${timeRange})`);
    return nighttimeData.average;
  }
  
  // Weighted average favoring nighttime data
  return (nighttimeData.average * 0.7) + (cloudCover * 0.3);
}

/**
 * Request queue to limit concurrent SIQS calculations
 */
class SiqsRequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.running >= this.maxConcurrent) return;
    
    const task = this.queue.shift();
    if (!task) return;
    
    this.running++;
    task();
  }
}

// Create singleton queue instance
const siqsRequestQueue = new SiqsRequestQueue(3);

/**
 * Optimized real-time SIQS calculation with single-hour sampling option
 */
export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number,
  options: {
    useSingleHourSampling?: boolean;
    targetHour?: number;
    cacheDurationMins?: number;
    useForecasting?: boolean;
    forecastDay?: number;
    forecastData?: any;
  } = {}
): Promise<SiqsResult> {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    console.error("Invalid coordinates provided to calculateRealTimeSiqs");
    return { siqs: 0, isViable: false };
  }
  
  // Default options
  const {
    useSingleHourSampling = true,
    targetHour = 1, // Default to 1 AM for best astronomical viewing
    cacheDurationMins = 15,
    useForecasting = false,
    forecastDay = 0,
    forecastData = null
  } = options;
  
  // Generate a cache key with all relevant parameters
  const cacheKey = `siqs-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale.toFixed(1)}-${useSingleHourSampling}-${targetHour}-${useForecasting}-${forecastDay}`;
  
  // Check memory cache first (fastest)
  const memoizedResult = memoizedResults.get(cacheKey);
  if (memoizedResult && (Date.now() - memoizedResult.timestamp) < MEMO_EXPIRY) {
    console.log("Using in-memory cached SIQS result");
    return memoizedResult.result;
  }
  
  // Check persistent cache next
  if (hasCachedSiqs(latitude, longitude)) {
    const cachedData = getCachedSiqs(latitude, longitude);
    if (cachedData && 
        (Date.now() - new Date(cachedData.metadata?.calculatedAt || 0).getTime()) < cacheDurationMins * 60 * 1000) {
      // Ensure cached score is normalized to 0-10 scale
      if (cachedData.siqs > 10) {
        cachedData.siqs = cachedData.siqs / 10;
      }
      // Store in memory cache for even faster access next time
      memoizedResults.set(cacheKey, {
        result: cachedData,
        timestamp: Date.now()
      }, MEMO_EXPIRY);
      return cachedData;
    }
  }
  
  // Use the request queue to limit concurrent calculations
  return siqsRequestQueue.enqueue(async () => {
    try {
      // Use Promise.all for parallel API calls
      const [enhancedLocation, climateRegion, actualForecastData] = await Promise.all([
        findClosestEnhancedLocation(latitude, longitude),
        findClimateRegion(latitude, longitude),
        forecastData ? Promise.resolve(forecastData) : fetchForecastData({ latitude, longitude, days: 2 }).catch(() => null)
      ]);
      
      // Only fetch these if needed and after initial forecast check
      const [weatherData, clearSkyData, pollutionData] = await Promise.all([
        fetchWeatherData({ latitude, longitude }),
        fetchClearSkyRate(latitude, longitude).catch(() => null),
        fetchLightPollutionData(latitude, longitude).catch(() => null)
      ]);
      
      if (!weatherData) {
        return { siqs: 0, isViable: false };
      }
      
      let finalBortleScale = bortleScale;
      let terrainCorrectedScale = null;
      
      try {
        terrainCorrectedScale = await getTerrainCorrectedBortleScale(latitude, longitude);
        if (terrainCorrectedScale !== null) {
          finalBortleScale = terrainCorrectedScale;
        }
      } catch (e) {
        console.warn("Could not get terrain-corrected Bortle scale:", e);
      }
      
      // Prepare weather data with clear sky info
      const weatherDataWithClearSky: WeatherDataWithClearSky = {
        ...weatherData,
        clearSkyRate: clearSkyData?.annualRate || enhancedLocation?.clearSkyRate,
        latitude,
        longitude,
        _forecast: actualForecastData
      };
      
      // Apply single hour cloud cover sampling if enabled and forecast is available
      if (useSingleHourSampling && actualForecastData?.hourly) {
        const singleHourCloudCover = extractSingleHourCloudCover(actualForecastData, targetHour);
        
        if (singleHourCloudCover !== null) {
          weatherDataWithClearSky.cloudCover = singleHourCloudCover;
          weatherDataWithClearSky.nighttimeCloudData = {
            average: singleHourCloudCover,
            timeRange: `${targetHour}:00-${targetHour+1}:00`,
            sourceType: 'optimized'
          };
        }
      }
      // Use traditional nighttime cloud data if available
      else if (weatherData && 'nighttimeCloudData' in weatherData) {
        const nighttimeData = weatherData.nighttimeCloudData as { 
          average?: number | null; 
          timeRange?: string; 
          sourceType?: 'forecast' | 'calculated' | 'historical' | 'optimized'; 
        } | undefined;
        
        // Ensure we provide a default timeRange if it's missing
        const defaultTimeRange = "18:00-06:00";
        
        weatherDataWithClearSky.nighttimeCloudData = {
          average: nighttimeData?.average || 0,
          timeRange: nighttimeData?.timeRange || defaultTimeRange,
          sourceType: nighttimeData?.sourceType || 'calculated'
        };
      }
      
      // Validate and finalize cloud cover
      let finalCloudCover = weatherDataWithClearSky.cloudCover;
      if (weatherDataWithClearSky.nighttimeCloudData) {
        finalCloudCover = validateNighttimeCloudData(
          finalCloudCover,
          weatherDataWithClearSky.nighttimeCloudData as any
        );
      }
      
      const moonPhase = calculateMoonPhase();
      const seeingConditions = enhancedLocation?.averageVisibility === 'excellent' ? 2 : 3;
      
      // Calculate SIQS using the weather data with appropriate cloud cover
      const siqsResult = await calculateSIQSWithWeatherData(
        {
          ...weatherDataWithClearSky,
          cloudCover: finalCloudCover
        },
        finalBortleScale,
        seeingConditions,
        moonPhase,
        actualForecastData
      );
      
      // Apply adjustments to the raw score
      let adjustedScore = applyIntelligentAdjustments(
        siqsResult.score,
        weatherDataWithClearSky,
        clearSkyData,
        finalBortleScale
      );
      
      if (climateRegion) {
        const month = new Date().getMonth();
        const climateAdjustment = getClimateAdjustmentFactor(latitude, longitude, month);
        adjustedScore *= climateAdjustment;
      }
      
      // Ensure score is always normalized to 0-10 scale
      adjustedScore = Math.min(10, Math.max(0, adjustedScore));
      if (adjustedScore > 10) {
        adjustedScore = adjustedScore / 10;
      }
      const finalScore = Math.round(adjustedScore * 10) / 10;
      
      const result: SiqsResult = {
        siqs: finalScore,
        isViable: finalScore >= 3.0,
        weatherData: weatherDataWithClearSky,
        forecastData: actualForecastData,
        factors: siqsResult.factors.map(factor => ({
          ...factor,
          // Normalize any factor scores as well
          score: factor.score > 10 ? factor.score / 10 : factor.score
        })),
        metadata: {
          calculatedAt: new Date().toISOString(),
          sources: {
            weather: true,
            forecast: !!actualForecastData,
            clearSky: !!clearSkyData,
            lightPollution: !!pollutionData,
            terrainCorrected: !!terrainCorrectedScale,
            climate: !!climateRegion,
            singleHourSampling: useSingleHourSampling && actualForecastData?.hourly ? true : false
          }
        }
      };
      
      // Cache the result
      setSiqsCache(latitude, longitude, result);
      
      // Add to memory cache
      memoizedResults.set(cacheKey, {
        result,
        timestamp: Date.now()
      }, MEMO_EXPIRY);
      
      return result;
    } catch (error) {
      console.error("Error calculating real-time SIQS:", error);
      return { 
        siqs: 0,
        isViable: false,
        factors: [{
          name: 'Error',
          score: 0,
          description: 'Failed to calculate SIQS'
        }]
      };
    }
  });
}

/**
 * Batch calculate SIQS for multiple locations efficiently
 * 
 * @param locations Array of locations with coordinates and bortle scale
 * @param options Calculation options
 * @returns Promise resolving to array of SIQS results
 */
export async function batchCalculateSiqs(
  locations: Array<{ latitude: number; longitude: number; bortleScale?: number }>,
  options: {
    useSingleHourSampling?: boolean;
    targetHour?: number;
    cacheDurationMins?: number;
    prioritizeAccuracy?: boolean;
    concurrencyLimit?: number;
  } = {}
): Promise<Array<{ location: { latitude: number; longitude: number }, siqsResult: SiqsResult }>> {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  const {
    useSingleHourSampling = true,
    targetHour = 1,
    cacheDurationMins = 15,
    prioritizeAccuracy = false,
    concurrencyLimit = 3
  } = options;
  
  console.log(`Batch calculating SIQS for ${locations.length} locations`);
  
  try {
    const results = [];
    
    // Process in batches to control concurrency
    for (let i = 0; i < locations.length; i += concurrencyLimit) {
      const batch = locations.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(async location => {
        try {
          const siqsResult = await calculateRealTimeSiqs(
            location.latitude,
            location.longitude,
            location.bortleScale || 5,
            {
              useSingleHourSampling,
              targetHour,
              cacheDurationMins
            }
          );
          
          return {
            location,
            siqsResult
          };
        } catch (error) {
          console.error(`Error calculating SIQS for location (${location.latitude}, ${location.longitude}):`, error);
          return {
            location,
            siqsResult: { siqs: 0, isViable: false }
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  } catch (error) {
    console.error("Error in batch SIQS calculation:", error);
    return locations.map(location => ({
      location,
      siqsResult: { siqs: 0, isViable: false }
    }));
  }
}

// Export for backward compatibility
export const batchCalculateRealTimeSiqs = batchCalculateSiqs;

// Export additional utilities to help with forecast processing
export { validateNighttimeCloudData };
