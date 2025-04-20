import { fetchForecastData, fetchWeatherData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { fetchClearSkyRate } from "@/lib/api/clearSkyRate";
import { findClimateRegion, getClimateAdjustmentFactor } from "./climateRegions";
import { findClosestEnhancedLocation } from "./enhancedLocationData";
import { getTerrainCorrectedBortleScale } from "@/utils/terrainCorrection";
import { extractSingleHourCloudCover } from "@/utils/weather/hourlyCloudCoverExtractor";
import { SiqsResult, SiqsCalculationOptions, WeatherDataWithClearSky } from './siqsTypes';
import { 
  getMemoizedResult, 
  setMemoizedResult, 
  checkSpatialCache, 
  setSpatialCache,
  clearSiqsCaches 
} from './cache/siqsCache';
import { batchCalculateSiqs } from './batch/batchCalculator';

// Track pending calculations to prevent duplicate requests
const pendingCalculations = new Map<string, Promise<any>>();

export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number,
  options: SiqsCalculationOptions = {}
): Promise<SiqsResult> {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    console.error("Invalid coordinates provided to calculateRealTimeSiqs");
    return { siqs: 0, isViable: false };
  }
  
  const {
    useSingleHourSampling = true,
    targetHour = 1,
    cacheDurationMins = 15,
    skipApiCalls = false
  } = options;
  
  const cacheKey = `siqs-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale.toFixed(1)}`;
  
  // Check memory cache first
  const memoizedResult = getMemoizedResult(cacheKey);
  if (memoizedResult) return memoizedResult;
  
  // Check spatial cache
  const spatialResult = checkSpatialCache(latitude, longitude);
  if (spatialResult) {
    setMemoizedResult(cacheKey, spatialResult);
    return spatialResult;
  }
  
  if (skipApiCalls) {
    const defaultResult: SiqsResult = {
      siqs: 10 - bortleScale,
      isViable: 10 - bortleScale >= 3.0,
      metadata: {
        calculatedAt: new Date().toISOString(),
        sources: {
          weather: false,
          forecast: false,
          clearSky: false,
          lightPollution: false,
          terrainCorrected: false,
          climate: false,
          singleHourSampling: false
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
    
    const weatherDataWithClearSky: WeatherDataWithClearSky = {
      ...weatherData,
      clearSkyRate: clearSkyData?.annualRate || enhancedLocation?.clearSkyRate,
      latitude,
      longitude,
      _forecast: forecastData,
      nighttimeCloudData: weatherData.nighttimeCloudData || {
        average: weatherData.cloudCover,
        timeRange: 'default',
        sourceType: 'calculated'
      }
    };
    
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
    
    const moonPhase = 0; // Placeholder - this should be calculated elsewhere
    const seeingConditions = enhancedLocation?.averageVisibility === 'excellent' ? 2 : 3;
    
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherDataWithClearSky,
      finalBortleScale,
      seeingConditions,
      moonPhase,
      forecastData
    );
    
    let adjustedScore = siqsResult.score;
    
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
    
    setMemoizedResult(cacheKey, result);
    setSpatialCache(latitude, longitude, result);
    
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

export { batchCalculateSiqs, clearSiqsCaches };
