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
import { getHistoricalPattern } from "@/utils/historicalPatterns";

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

/**
 * Validate and adjust nighttime cloud data using historical patterns
 */
function validateNighttimeCloudData(
  cloudCover: number, 
  nighttimeData?: { average: number; timeRange: string; sourceType?: string },
  latitude?: number,
  longitude?: number
): number {
  if (!nighttimeData) return cloudCover;
  
  let adjustedCloudCover = cloudCover;
  
  // If forecast data and current data differ significantly, use a weighted average
  const difference = Math.abs(cloudCover - nighttimeData.average);
  if (difference > 20) {
    console.log(`Using nighttime cloud cover ${nighttimeData.average}% instead of current ${cloudCover}%`);
    adjustedCloudCover = nighttimeData.average;
  } else {
    // Weighted average giving more weight to nighttime data
    adjustedCloudCover = (nighttimeData.average * 0.7) + (cloudCover * 0.3);
  }
  
  // Apply historical pattern adjustment if location data is available
  if (latitude && longitude) {
    const historicalPattern = getHistoricalPattern(latitude, longitude);
    
    if (historicalPattern && historicalPattern.cloudCoverAdjustment) {
      const month = new Date().getMonth();
      const adjustment = historicalPattern.cloudCoverAdjustment[month] || 1.0;
      
      adjustedCloudCover *= adjustment;
      console.log(`Applied historical cloud cover adjustment: ${adjustment.toFixed(2)}`);
    }
  }
  
  return Math.min(100, Math.max(0, adjustedCloudCover));
}

/**
 * Optimized real-time SIQS calculation with enhanced historical data integration
 */
export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number,
  options: {
    useSingleHourSampling?: boolean;
    targetHour?: number;
    cacheDurationMins?: number;
    useHistoricalData?: boolean;
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
    useHistoricalData = true // Enable historical data by default
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
    
    // Get historical pattern if enabled
    const historicalPattern = useHistoricalData ? 
      getHistoricalPattern(latitude, longitude) : null;
    
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
      clearSkyRate: clearSkyData?.annualRate || 
                    enhancedLocation?.clearSkyRate || 
                    (historicalPattern?.annualClearNightCount ? 
                      (historicalPattern.annualClearNightCount / 365) * 100 : undefined),
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
    
    // Validate and finalize cloud cover with historical data
    let finalCloudCover = weatherDataWithClearSky.cloudCover;
    if (weatherDataWithClearSky.nighttimeCloudData) {
      finalCloudCover = validateNighttimeCloudData(
        finalCloudCover,
        weatherDataWithClearSky.nighttimeCloudData,
        useHistoricalData ? latitude : undefined,
        useHistoricalData ? longitude : undefined
      );
    }
    
    const moonPhase = calculateMoonPhase();
    
    // Use seeing conditions from historical data if available
    const seeingConditions = historicalPattern?.regionType === 'plateau' || 
                             historicalPattern?.regionType === 'mountains' ? 2 :
                             enhancedLocation?.averageVisibility === 'excellent' ? 2 : 3;
    
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
    
    // Apply climate region adjustment
    if (climateRegion) {
      const month = new Date().getMonth();
      const climateAdjustment = getClimateAdjustmentFactor(latitude, longitude, month);
      adjustedScore *= climateAdjustment;
    }
    
    // Apply historical pattern adjustments if available
    if (useHistoricalData && historicalPattern) {
      const month = new Date().getMonth();
      
      // Adjust for historical clear days ratio if available
      if (historicalPattern.clearDaysRatio && historicalPattern.clearDaysRatio[month]) {
        const clearDaysAdjustment = historicalPattern.clearDaysRatio[month];
        adjustedScore *= clearDaysAdjustment;
        console.log(`Applied historical clear days adjustment: ${clearDaysAdjustment.toFixed(2)}`);
      }
      
      // If it's an exceptional location, boost score slightly
      if (historicalPattern.isExceptionalLocation) {
        adjustedScore *= 1.1;
        console.log("Applied exceptional location boost");
      }
      
      // If using actual observatory data, consider it high quality
      if (historicalPattern.observatoryData) {
        adjustedScore *= 1.05;
        console.log("Applied observatory data quality boost");
      }
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
          historicalData: useHistoricalData && !!historicalPattern,
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
