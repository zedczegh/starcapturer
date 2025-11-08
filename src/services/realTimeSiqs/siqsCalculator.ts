
import { fetchForecastData, fetchWeatherData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { fetchClearSkyRate } from "@/lib/api/clearSkyRate";
import { logSiqsCalculation } from "@/services/siqs/siqsLogger";
import { supabase } from "@/integrations/supabase/client";
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
 * Optimized real-time SIQS calculation with single-hour sampling option and enhanced caching
 */
export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number,
  options: {
    useSingleHourSampling?: boolean;
    targetHour?: number;
    cacheDurationMins?: number;
    priority?: 'high' | 'medium' | 'low';
  } = {}
): Promise<SiqsResult> {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    console.error("Invalid coordinates provided to calculateRealTimeSiqs");
    return { siqs: 0, isViable: false };
  }
  
  // Default options with performance optimizations
  const {
    useSingleHourSampling = true,
    targetHour = 1, // Default to 1 AM for best astronomical viewing
    cacheDurationMins = 15,
    priority = 'medium'
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
      // Ensure cached score is normalized to 0-10 scale
      if (cachedData.siqs > 10) {
        cachedData.siqs = cachedData.siqs / 10;
      }
      // Store in memory cache for even faster access next time
      memoizedResults.set(cacheKey, {
        result: cachedData,
        timestamp: Date.now()
      });
      return cachedData;
    }
  }
  
  try {
    // Optimized parallel API calls with priority-based execution
    const [enhancedLocation, climateRegion] = await Promise.all([
      findClosestEnhancedLocation(latitude, longitude),
      findClimateRegion(latitude, longitude)
    ]);
    
    // Fetch critical data first
    const weatherData = await fetchWeatherData({ latitude, longitude });
    if (!weatherData) {
      return { siqs: 0, isViable: false };
    }
    
    // Fetch optional data in parallel (these can fail without breaking the calculation)
    const [forecastData, clearSkyData, pollutionData] = await Promise.all([
      fetchForecastData({ latitude, longitude, days: 2 }).catch(() => null),
      fetchClearSkyRate(latitude, longitude).catch(() => null),
      fetchLightPollutionData(latitude, longitude).catch(() => null)
    ]);
    
    // Weather data is already validated above
    
    let finalBortleScale = bortleScale;
    let terrainCorrectedScale = null;
    
    try {
      // Get location name for terrain correction
      const locationName = enhancedLocation?.name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      terrainCorrectedScale = await getTerrainCorrectedBortleScale(latitude, longitude, locationName);
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
      forecastData,
      factors: siqsResult.factors.map(factor => ({
        ...factor,
        // Normalize any factor scores as well
        score: factor.score > 10 ? factor.score / 10 : factor.score
      })),
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
    
    // Log to database for analytics (async, don't wait)
    logSiqsCalculation({
      latitude,
      longitude,
      locationName: enhancedLocation?.name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      siqsScore: finalScore,
      astroNightCloudCover: weatherDataWithClearSky.nighttimeCloudData?.average || null,
      additionalMetadata: {
        bortleScale: finalBortleScale,
        terrainCorrected: !!terrainCorrectedScale,
        singleHourSampling: useSingleHourSampling && forecastData?.hourly ? true : false
      },
      userId: (await supabase.auth.getUser()).data.user?.id,
      source: 'search'
    }).catch(err => console.warn('Failed to log SIQS calculation:', err));
    
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
