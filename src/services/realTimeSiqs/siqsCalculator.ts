
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
  const CACHE_DURATION_MINS = 30;
  
  // Check cache first with shorter duration for more frequent updates
  if (hasCachedSiqs(latitude, longitude)) {
    const cachedData = getCachedSiqs(latitude, longitude);
    if (cachedData) {
      console.log(`Using cached SIQS data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, score: ${cachedData.siqs.toFixed(1)}`);
      return cachedData;
    }
  }
  
  console.log(`Calculating real-time SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  
  try {
    // Check if this is a known enhanced location with special data
    const enhancedLocation = findClosestEnhancedLocation(latitude, longitude);
    if (enhancedLocation) {
      console.log(`Found enhanced location data for ${enhancedLocation.name}`);
    }
    
    // Check for specific climate region data
    const climateRegion = findClimateRegion(latitude, longitude);
    if (climateRegion) {
      console.log(`Location is in climate region: ${climateRegion.name}`);
    }
    
    // Parallel data fetching with all available data sources for efficiency
    const [weatherData, forecastData, clearSkyData, extraData] = await Promise.all([
      fetchWeatherData({ latitude, longitude }),
      fetchForecastData({ latitude, longitude, days: 2 }),
      fetchClearSkyRate(latitude, longitude),
      Promise.all([
        fetchLightPollutionData(latitude, longitude)
      ]).catch(() => [null])
    ]);
    
    if (!weatherData) {
      return { siqs: 0, isViable: false };
    }
    
    // Enhanced Bortle scale handling with more sophisticated logic
    let finalBortleScale = bortleScale;
    if (!finalBortleScale || finalBortleScale <= 0 || finalBortleScale > 9) {
      const [pollutionData] = extraData;
      // Use light pollution data or default to medium value
      finalBortleScale = pollutionData?.bortleScale || 5;
      
      // Use enhanced location data if available
      if (enhancedLocation && enhancedLocation.bortleScale) {
        finalBortleScale = enhancedLocation.bortleScale;
        console.log(`Using enhanced location Bortle scale: ${finalBortleScale}`);
      }
    }
    
    // Prepare comprehensive weather data with all available sources and coordinates
    const weatherDataWithClearSky: WeatherDataWithClearSky = { 
      ...weatherData,
      clearSkyRate: clearSkyData?.annualRate || enhancedLocation?.clearSkyRate,
      latitude,
      longitude,
      _forecast: forecastData
    };
    
    // Get current moon phase
    const moonPhase = calculateMoonPhase();
    
    // Default seeing conditions (1-5 scale, lower is better)
    // Use enhanced data if available
    const seeingConditions = enhancedLocation && enhancedLocation.averageVisibility === 'excellent' ? 2 : 3;
    
    // Enhanced SIQS calculation with machine learning-inspired weighting
    // that adjusts based on local conditions
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherDataWithClearSky,
      finalBortleScale,
      seeingConditions,
      moonPhase,
      forecastData
    );
    
    // Apply intelligent adjustments based on multiple factors
    let adjustedScore = applyIntelligentAdjustments(
      siqsResult.score,
      weatherDataWithClearSky,
      clearSkyData || (enhancedLocation ? { 
        annualRate: enhancedLocation.clearSkyRate,
        isDarkSkyReserve: enhancedLocation.isDarkSkyReserve
      } : null),
      finalBortleScale
    );
    
    // Apply climate region adjustments if available
    if (climateRegion) {
      const month = new Date().getMonth();
      const climateAdjustment = getClimateAdjustmentFactor(latitude, longitude, month);
      if (climateAdjustment !== 1.0) {
        console.log(`Applying climate region adjustment: ${climateAdjustment.toFixed(2)}`);
        adjustedScore *= climateAdjustment;
      }
    }
    
    // Cap the score at realistic values
    adjustedScore = Math.min(9.5, adjustedScore); // Never allow perfect 10
    adjustedScore = Math.max(0, adjustedScore); // Never allow negative
    
    // Round to 1 decimal for consistency
    const finalScore = Math.round(adjustedScore * 10) / 10;
    
    const result = {
      siqs: finalScore,
      isViable: finalScore >= 2.0,
      factors: siqsResult.factors
    };
    
    // Store in cache with metadata
    setSiqsCache(latitude, longitude, {
      ...result,
      metadata: {
        calculatedAt: new Date().toISOString(),
        sources: {
          weather: true,
          forecast: !!forecastData,
          clearSky: !!clearSkyData || !!enhancedLocation,
          lightPollution: !!extraData[0] || !!enhancedLocation
        }
      }
    });
    
    return result;
    
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return { siqs: 0, isViable: false };
  }
}
