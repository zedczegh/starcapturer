
import { fetchForecastData, fetchWeatherData } from "@/lib/api";
import { calculateSIQSWithWeatherData, extractSingleHourCloudCover } from "@/hooks/siqs/siqsCalculationUtils";
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
  
  // Default options
  const {
    useSingleHourSampling = true,
    targetHour = 1, // Default to 1 AM for best astronomical viewing
    cacheDurationMins = 15
  } = options;
  
  // Check cache first before proceeding
  if (hasCachedSiqs(latitude, longitude)) {
    const cachedData = getCachedSiqs(latitude, longitude);
    if (cachedData && 
        (Date.now() - new Date(cachedData.metadata?.calculatedAt || 0).getTime()) < cacheDurationMins * 60 * 1000) {
      return cachedData;
    }
  }
  
  try {
    const enhancedLocation = await findClosestEnhancedLocation(latitude, longitude);
    const climateRegion = findClimateRegion(latitude, longitude);
    
    const [weatherData, forecastData, clearSkyData, pollutionData] = await Promise.all([
      fetchWeatherData({ latitude, longitude }),
      fetchForecastData({ latitude, longitude, days: 2 }),
      fetchClearSkyRate(latitude, longitude),
      fetchLightPollutionData(latitude, longitude)
    ]);
    
    if (!weatherData) {
      return { siqs: 0, isViable: false };
    }
    
    let finalBortleScale = bortleScale;
    const terrainCorrectedScale = await getTerrainCorrectedBortleScale(latitude, longitude);
    if (terrainCorrectedScale !== null) {
      finalBortleScale = terrainCorrectedScale;
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
        console.log(`Using ${targetHour}AM cloud cover for SIQS: ${singleHourCloudCover.toFixed(1)}%`);
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
