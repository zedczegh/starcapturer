
import { fetchForecastData, fetchWeatherData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { fetchClearSkyRate } from "@/lib/api/clearSkyRate";
import {
  hasCachedSiqs,
  getCachedSiqs,
  setSiqsCache
} from "./siqsCache";

// Extended WeatherData interface with clearSkyRate
interface WeatherDataWithClearSky extends Record<string, any> {
  cloudCover: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  weatherCondition?: string;
  aqi?: number;
  clearSkyRate?: number;
}

/**
 * Calculate real-time SIQS for a given location with enhanced accuracy
 * using state-of-the-art algorithms and multiple data sources
 */
export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number
): Promise<{ siqs: number; isViable: boolean; factors?: any[] }> {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    console.error("Invalid coordinates provided to calculateRealTimeSiqs");
    return { siqs: 0, isViable: false };
  }
  
  // Use shorter caching duration for greater accuracy
  const CACHE_DURATION_MINS = 30;
  
  // Check cache first with shorter duration for more frequent updates
  if (hasCachedSiqs(latitude, longitude, CACHE_DURATION_MINS)) {
    const cachedData = getCachedSiqs(latitude, longitude);
    if (cachedData) {
      console.log(`Using cached SIQS data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, score: ${cachedData.siqs.toFixed(1)}`);
      return cachedData;
    }
  }
  
  console.log(`Calculating real-time SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  
  try {
    // Parallel data fetching with all available data sources for efficiency
    const [weatherData, forecastData, clearSkyData, extraData] = await Promise.all([
      fetchWeatherData({ latitude, longitude }),
      fetchForecastData({ latitude, longitude, days: 2 }),
      fetchClearSkyRate(latitude, longitude),
      Promise.all([
        fetchLightPollutionData(latitude, longitude),
        fetchClearSkyRate(latitude, longitude)
      ]).catch(() => [null, null])
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
    }
    
    // Prepare comprehensive weather data with all available sources
    const weatherDataWithClearSky = { 
      ...weatherData,
      clearSkyRate: clearSkyData?.annualRate
    };
    
    // Enhanced SIQS calculation with machine learning-inspired weighting
    // that adjusts based on local conditions
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherDataWithClearSky,
      finalBortleScale,
      3, // Default seeing conditions
      getMoonPhaseEstimate(), // Get estimated moon phase
      forecastData
    );
    
    // Apply intelligent adjustments based on multiple factors
    let adjustedScore = applyIntelligentAdjustments(
      siqsResult.score,
      weatherDataWithClearSky,
      clearSkyData,
      finalBortleScale
    );
    
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
          clearSky: !!clearSkyData,
          lightPollution: !!extraData[0]
        }
      }
    });
    
    return result;
    
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return { siqs: 0, isViable: false };
  }
}

/**
 * Apply intelligent adjustments to SIQS score based on multiple factors
 */
function applyIntelligentAdjustments(
  baseScore: number,
  weatherData: WeatherDataWithClearSky,
  clearSkyData: any,
  bortleScale: number
): number {
  let score = baseScore;
  
  // Apply clear sky rate adjustment with diminishing returns curve
  if (clearSkyData && typeof clearSkyData.annualRate === 'number') {
    const clearSkyRate = clearSkyData.annualRate;
    // Non-linear adjustment that gives more benefit to very clear locations
    // but diminishing returns after 70%
    let clearSkyFactor = 1.0; // Default - no change
    
    if (clearSkyRate > 80) {
      clearSkyFactor = 1.25; // Exceptional
    } else if (clearSkyRate > 65) {
      clearSkyFactor = 1.15; // Excellent
    } else if (clearSkyRate > 50) {
      clearSkyFactor = 1.1; // Very good
    } else if (clearSkyRate < 30) {
      clearSkyFactor = 0.9; // Poor
    }
    
    score *= clearSkyFactor;
  }
  
  // Adjust for cloud cover with higher sensitivity
  if (typeof weatherData.cloudCover === 'number') {
    const cloudCover = weatherData.cloudCover;
    if (cloudCover < 5) {
      // Exceptional clear sky bonus
      score *= 1.1;
    } else if (cloudCover > 70) {
      // Heavy cloud penalty
      score *= 0.7;
    }
  }
  
  // Adjust for Bortle scale with non-linear impact
  // Dark sky locations get higher boost
  if (bortleScale <= 3) {
    score *= 1.15; // Significant boost for dark sky areas
  }
  
  // High humidity and precipitation penalty
  if (weatherData.humidity && weatherData.humidity > 85) {
    score *= 0.9;
  }
  
  if (weatherData.precipitation && weatherData.precipitation > 0) {
    score *= 0.7; // Active precipitation is a major limiting factor
  }
  
  return score;
}

/**
 * Estimate moon phase based on date if not provided
 * Returns a value between 0 and 1 (0 = new moon, 0.5 = full moon)
 */
function getMoonPhaseEstimate(): number {
  // Simple approximation based on current date
  // Lunar cycle is approximately 29.53 days
  const date = new Date();
  const lunarCycle = 29.53;
  
  // New Moon on Jan 1, 2021 as reference point
  const referenceDate = new Date(2021, 0, 13);
  
  // Days since reference
  const daysSinceReference = (date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Calculate phase based on lunar cycle
  const phase = (daysSinceReference % lunarCycle) / lunarCycle;
  
  return phase;
}
