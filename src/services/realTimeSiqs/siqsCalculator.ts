
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

// Add a new utility function to validate and improve calculated location SIQS
function improveCalculatedLocationSIQS(initialScore: number, location: any): number {
  // If score is extremely low (close to 0), apply intelligent adjustments
  if (initialScore < 0.5) {
    console.log(`Improving low SIQS score for calculated location: ${initialScore}`);
    
    // Use location characteristics to boost score
    const boostFactors = [
      location.isDarkSkyReserve ? 1.5 : 1,
      location.bortleScale ? (9 - location.bortleScale) * 0.5 : 0,
      location.type === 'remote' ? 1.2 : 1,
      // Add more intelligent adjustments based on location metadata
    ];
    
    // Calculate a boost factor, ensuring it doesn't exceed 2
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
 * Calculate real-time SIQS for a given location with enhanced accuracy
 * using state-of-the-art algorithms and multiple data sources
 */
export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number
): Promise<SiqsResult> {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    console.error("Invalid coordinates provided to calculateRealTimeSiqs");
    return { siqs: 0, isViable: false };
  }
  
  // Use shorter caching duration for greater accuracy
  const CACHE_DURATION_MINS = 15;
  
  // Check cache first with shorter duration for more frequent updates
  if (hasCachedSiqs(latitude, longitude)) {
    const cachedData = getCachedSiqs(latitude, longitude);
    if (cachedData && 
        (Date.now() - new Date(cachedData.metadata?.calculatedAt || 0).getTime()) < CACHE_DURATION_MINS * 60 * 1000) {
      return cachedData;
    }
  }
  
  try {
    // Enhanced location data lookup with improved accuracy
    const enhancedLocation = await findClosestEnhancedLocation(latitude, longitude);
    const climateRegion = findClimateRegion(latitude, longitude);
    
    // Parallel data fetching for all environmental factors
    const [weatherData, forecastData, clearSkyData, pollutionData] = await Promise.all([
      fetchWeatherData({ latitude, longitude }),
      fetchForecastData({ latitude, longitude, days: 2 }),
      fetchClearSkyRate(latitude, longitude),
      fetchLightPollutionData(latitude, longitude)
    ]);
    
    if (!weatherData) {
      return { siqs: 0, isViable: false };
    }
    
    // Enhanced Bortle scale calculation with terrain correction
    let finalBortleScale = bortleScale;
    const terrainCorrectedScale = await getTerrainCorrectedBortleScale(latitude, longitude);
    if (terrainCorrectedScale !== null) {
      finalBortleScale = terrainCorrectedScale;
    }
    
    // Prepare comprehensive weather data
    const weatherDataWithClearSky = {
      ...weatherData,
      clearSkyRate: clearSkyData?.annualRate || enhancedLocation?.clearSkyRate,
      latitude,
      longitude,
      _forecast: forecastData
    };
    
    // Calculate SIQS with all available factors
    const moonPhase = calculateMoonPhase();
    const seeingConditions = enhancedLocation?.averageVisibility === 'excellent' ? 2 : 3;
    
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherDataWithClearSky,
      finalBortleScale,
      seeingConditions,
      moonPhase,
      forecastData
    );
    
    // Apply intelligent adjustments with improved accuracy
    let adjustedScore = applyIntelligentAdjustments(
      siqsResult.score,
      weatherDataWithClearSky,
      clearSkyData,
      finalBortleScale
    );
    
    // Apply climate and terrain adjustments
    if (climateRegion) {
      const month = new Date().getMonth();
      const climateAdjustment = getClimateAdjustmentFactor(latitude, longitude, month);
      adjustedScore *= climateAdjustment;
    }
    
    // Cap and round the final score
    adjustedScore = Math.min(9.5, Math.max(0, adjustedScore));
    const finalScore = Math.round(adjustedScore * 10) / 10;
    
    const result: SiqsResult = {
      siqs: finalScore,
      isViable: finalScore >= 3.0,
      factors: siqsResult.factors,
      metadata: {
        calculatedAt: new Date().toISOString(),
        sources: {
          weather: true,
          forecast: !!forecastData,
          clearSky: !!clearSkyData,
          lightPollution: !!pollutionData
        }
      }
    };
    
    // Store in cache with metadata
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

// Note: Removed the duplicate improveCalculatedLocationSIQS function that was at the end of the file
