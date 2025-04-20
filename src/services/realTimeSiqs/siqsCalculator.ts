
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

// Performance optimization: Reduce duplicate calculations with memoization
const memoizedResults = new Map<string, {result: SiqsResult, timestamp: number}>();
const MEMO_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Spatial memoization to reduce API calls for nearby locations
const spatialCache = new Map<string, {result: SiqsResult, timestamp: number}>();
const SPATIAL_PRECISION = 0.05; // About 5km spatial precision 
const SPATIAL_EXPIRY = 30 * 60 * 1000; // 30 minutes

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

function validateNighttimeCloudData(cloudCover: number, nighttimeData?: { average: number; timeRange: string; sourceType?: string }) {
  if (!nighttimeData) return cloudCover;
  
  const difference = Math.abs(cloudCover - nighttimeData.average);
  if (difference > 20) {
    console.log(`Using nighttime cloud cover ${nighttimeData.average}% instead of current ${cloudCover}%`);
    return nighttimeData.average;
  }
  
  return (nighttimeData.average * 0.7) + (cloudCover * 0.3);
}

/**
 * Checks if two locations are close enough to share weather/siqs data
 * This helps reduce API calls for nearby locations
 */
function areLocationsNearby(lat1: number, lon1: number, lat2: number, lon2: number, thresholdKm: number = 5): boolean {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance <= thresholdKm;
}

/**
 * Get the spatial cache key for a location, rounded to reduce precision
 * This allows reusing data for nearby locations
 */
function getSpatialCacheKey(latitude: number, longitude: number): string {
  const roundedLat = Math.round(latitude / SPATIAL_PRECISION) * SPATIAL_PRECISION;
  const roundedLng = Math.round(longitude / SPATIAL_PRECISION) * SPATIAL_PRECISION;
  return `spatial-${roundedLat.toFixed(4)}-${roundedLng.toFixed(4)}`;
}

/**
 * Check if there's a valid result in the spatial cache for a location
 */
function checkSpatialCache(latitude: number, longitude: number): SiqsResult | null {
  const spatialKey = getSpatialCacheKey(latitude, longitude);
  const cachedData = spatialCache.get(spatialKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp) < SPATIAL_EXPIRY) {
    return cachedData.result;
  }
  
  // Also check nearby keys
  for (const [key, data] of spatialCache.entries()) {
    if ((Date.now() - data.timestamp) < SPATIAL_EXPIRY) {
      const [, latStr, lngStr] = key.split('-');
      const cachedLat = parseFloat(latStr);
      const cachedLng = parseFloat(lngStr);
      
      if (areLocationsNearby(latitude, longitude, cachedLat, cachedLng)) {
        console.log(`Using nearby spatial cache (${cachedLat}, ${cachedLng}) for (${latitude}, ${longitude})`);
        return data.result;
      }
    }
  }
  
  return null;
}

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
    skipApiCalls?: boolean;
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
    skipApiCalls = false
  } = options;
  
  // Generate a cache key
  const cacheKey = `siqs-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale.toFixed(1)}`;
  
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
      // Store in memory cache for even faster access next time
      memoizedResults.set(cacheKey, {
        result: cachedData,
        timestamp: Date.now()
      });
      return cachedData;
    }
  }
  
  // Check spatial cache for nearby locations
  const spatialResult = checkSpatialCache(latitude, longitude);
  if (spatialResult) {
    // Store in memory cache for this exact location too
    memoizedResults.set(cacheKey, {
      result: spatialResult,
      timestamp: Date.now()
    });
    return spatialResult;
  }
  
  // If we're in skipApiCalls mode, return a reasonable default
  if (skipApiCalls) {
    const defaultResult: SiqsResult = {
      siqs: 10 - bortleScale, // Simple estimate based on Bortle scale
      isViable: 10 - bortleScale >= 3.0,
      metadata: {
        calculatedAt: new Date().toISOString(),
        sources: {
          estimated: true
        }
      }
    };
    
    return defaultResult;
  }
  
  try {
    // Use Promise.all for parallel API calls
    const [enhancedLocation, climateRegion, forecastData] = await Promise.all([
      findClosestEnhancedLocation(latitude, longitude),
      findClimateRegion(latitude, longitude),
      fetchForecastData({ latitude, longitude, days: 2 }).catch(() => null)
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
      _forecast: forecastData
    };
    
    // Apply single hour cloud cover sampling if enabled and forecast is available
    if (useSingleHourSampling && forecastData?.hourly) {
      const singleHourCloudCover = extractSingleHourCloudCover(forecastData, targetHour);
      
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
        average?: number; 
        timeRange?: string; 
        sourceType?: string; 
      } | undefined;
      
      weatherDataWithClearSky.nighttimeCloudData = {
        average: nighttimeData?.average || 0,
        timeRange: nighttimeData?.timeRange || "18:00-06:00",
        sourceType: (nighttimeData?.sourceType as "forecast" | "calculated" | "historical") || 'calculated'
      };
    }
    
    // Validate and finalize cloud cover
    let finalCloudCover = weatherDataWithClearSky.cloudCover;
    if (weatherDataWithClearSky.nighttimeCloudData) {
      finalCloudCover = validateNighttimeCloudData(
        finalCloudCover,
        weatherDataWithClearSky.nighttimeCloudData
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
      forecastData
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
    
    adjustedScore = Math.min(9.5, Math.max(0, adjustedScore));
    const finalScore = Math.round(adjustedScore * 10) / 10;
    
    const result: SiqsResult = {
      siqs: finalScore,
      isViable: finalScore >= 3.0,
      weatherData: weatherDataWithClearSky,
      forecastData,
      factors: siqsResult.factors,
      metadata: {
        calculatedAt: new Date().toISOString(),
        sources: {
          weather: true,
          forecast: !!forecastData,
          clearSky: !!clearSkyData,
          lightPollution: !!pollutionData,
          terrainCorrected: !!terrainCorrectedScale,
          climate: !!climateRegion,
          singleHourSampling: useSingleHourSampling && forecastData?.hourly ? true : false
        }
      }
    };
    
    // Cache the result
    setSiqsCache(latitude, longitude, result);
    
    // Add to memory cache
    memoizedResults.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    // Add to spatial cache for nearby reuse
    const spatialKey = getSpatialCacheKey(latitude, longitude);
    spatialCache.set(spatialKey, {
      result,
      timestamp: Date.now()
    });
    
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
}

/**
 * Batch calculate SIQS for multiple locations
 * Much more efficient than calling calculateRealTimeSiqs multiple times
 */
export async function batchCalculateSiqs(
  locations: Array<{latitude: number, longitude: number, bortleScale: number}>,
  options: {
    useSingleHourSampling?: boolean;
    targetHour?: number;
    maxConcurrent?: number;
  } = {}
): Promise<{[key: string]: SiqsResult}> {
  const { maxConcurrent = 3 } = options;
  const results: {[key: string]: SiqsResult} = {};
  
  if (locations.length === 0) return results;
  
  // Group nearby locations to reduce API calls
  const locationGroups = groupNearbyLocations(locations);
  console.log(`Grouped ${locations.length} locations into ${locationGroups.length} batches for SIQS calculation`);
  
  // Process groups in batches to limit concurrent API calls
  for (let i = 0; i < locationGroups.length; i += maxConcurrent) {
    const batch = locationGroups.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(async (group) => {
      // Calculate SIQS for the representative location
      const representative = group.locations[0];
      const representativeSiqs = await calculateRealTimeSiqs(
        representative.latitude,
        representative.longitude,
        representative.bortleScale,
        options
      );
      
      // Apply the result to all locations in the group with small adjustments
      group.locations.forEach(location => {
        const locationKey = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
        
        // Apply minor variations to prevent all locations in group from having identical scores
        // but maintain consistency since they're close to each other
        const variation = location === representative ? 0 : (Math.random() * 0.4 - 0.2);
        
        results[locationKey] = {
          ...representativeSiqs,
          siqs: Math.max(0, Math.min(10, representativeSiqs.siqs + variation))
        };
      });
    });
    
    // Wait for this batch to complete before starting the next
    await Promise.all(batchPromises);
  }
  
  return results;
}

/**
 * Group nearby locations to reduce API calls
 * Locations within 5km of each other will share weather/SIQS data
 */
function groupNearbyLocations(
  locations: Array<{latitude: number, longitude: number, bortleScale: number}>,
  proximityThresholdKm: number = 5
): Array<{
  representative: {latitude: number, longitude: number, bortleScale: number},
  locations: Array<{latitude: number, longitude: number, bortleScale: number}>
}> {
  const groups: Array<{
    representative: {latitude: number, longitude: number, bortleScale: number},
    locations: Array<{latitude: number, longitude: number, bortleScale: number}>
  }> = [];
  
  const unprocessed = [...locations];
  
  while (unprocessed.length > 0) {
    const representative = unprocessed.shift()!;
    const group = {
      representative,
      locations: [representative]
    };
    
    // Find all locations close to this representative
    let i = 0;
    while (i < unprocessed.length) {
      const location = unprocessed[i];
      
      if (areLocationsNearby(
        representative.latitude,
        representative.longitude,
        location.latitude,
        location.longitude,
        proximityThresholdKm
      )) {
        group.locations.push(location);
        unprocessed.splice(i, 1);
      } else {
        i++;
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

/**
 * Clear all SIQs caches
 */
export function clearSiqsCaches(): void {
  memoizedResults.clear();
  spatialCache.clear();
  console.log("All SIQS caches cleared");
}
