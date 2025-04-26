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
import { clearSkyDataCollector } from '@/services/clearSky/clearSkyDataCollector';

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
  } = {}
): Promise<SiqsResult> {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    console.error("Invalid coordinates provided to calculateRealTimeSiqs");
    return { siqs: 0, isViable: false };
  }
  
  const {
    useSingleHourSampling = true,
    targetHour = 1, // Default to 1 AM for best astronomical viewing
    cacheDurationMins = 15
  } = options;
  
  const cacheKey = `siqs-${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale.toFixed(1)}`;
  
  const memoizedResult = memoizedResults.get(cacheKey);
  if (memoizedResult && (Date.now() - memoizedResult.timestamp) < MEMO_EXPIRY) {
    console.log("Using in-memory cached SIQS result");
    return memoizedResult.result;
  }
  
  if (hasCachedSiqs(latitude, longitude)) {
    const cachedData = getCachedSiqs(latitude, longitude);
    if (cachedData && 
        (Date.now() - new Date(cachedData.metadata?.calculatedAt || 0).getTime()) < cacheDurationMins * 60 * 1000) {
      if (cachedData.siqs > 10) {
        cachedData.siqs = cachedData.siqs / 10;
      }
      memoizedResults.set(cacheKey, {
        result: cachedData,
        timestamp: Date.now()
      });
      return cachedData;
    }
  }
  
  try {
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
      _forecast: forecastData
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
    } else if (weatherData && 'nighttimeCloudData' in weatherData) {
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
    
    let finalCloudCover = weatherDataWithClearSky.cloudCover;
    if (weatherDataWithClearSky.nighttimeCloudData) {
      finalCloudCover = validateNighttimeCloudData(
        finalCloudCover,
        weatherDataWithClearSky.nighttimeCloudData
      );
    }
    
    const moonPhase = calculateMoonPhase();
    const seeingConditions = enhancedLocation?.averageVisibility === 'excellent' ? 2 : 3;
    
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
    
    let hasObservationData = false;
    try {
      const localData = clearSkyDataCollector.calculateClearSkyRate(latitude, longitude, 20);
      
      if (localData && localData.confidence > 0.6) {
        if (!weatherDataWithClearSky.clearSkyRate) {
          weatherDataWithClearSky.clearSkyRate = localData.rate;
          console.log(`Using local observation data for clear sky rate: ${localData.rate}%`);
        } else {
          weatherDataWithClearSky.clearSkyRate = 
            Math.round(weatherDataWithClearSky.clearSkyRate * 0.7 + localData.rate * 0.3);
          console.log(`Blended clear sky rate with observations: ${weatherDataWithClearSky.clearSkyRate}%`);
        }
        
        const observations = clearSkyDataCollector.getObservationsForLocation(latitude, longitude, 5);
        const recentObservations = observations.filter(
          obs => new Date(obs.timestamp).getTime() > Date.now() - 12 * 60 * 60 * 1000
        );
        
        if (recentObservations.length > 0) {
          const avgCloudCover = recentObservations.reduce(
            (sum, obs) => sum + obs.cloudCover, 0
          ) / recentObservations.length;
          
          if (weatherDataWithClearSky.cloudCover !== undefined) {
            weatherDataWithClearSky.cloudCover = 
              Math.round(weatherDataWithClearSky.cloudCover * 0.6 + avgCloudCover * 0.4);
          }
          
          hasObservationData = true;
        }
      }
    } catch (error) {
      console.warn("Error incorporating local observation data:", error);
    }
    
    if (result.metadata) {
      result.metadata.sources = {
        ...result.metadata.sources,
        observations: hasObservationData
      };
    }
    
    if (weatherDataWithClearSky.cloudCover !== undefined) {
      try {
        clearSkyDataCollector.recordStationData(
          latitude, 
          longitude,
          weatherDataWithClearSky.cloudCover,
          weatherDataWithClearSky.visibility || 100
        );
      } catch (error) {
        console.warn("Error recording weather observation:", error);
      }
    }
    
    setSiqsCache(latitude, longitude, result);
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
