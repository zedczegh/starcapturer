
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
    // Parallel data fetching with all available data sources
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
    
    // Enhanced Bortle scale handling
    let finalBortleScale = bortleScale;
    if (!finalBortleScale || finalBortleScale <= 0 || finalBortleScale > 9) {
      const [pollutionData] = extraData;
      finalBortleScale = pollutionData?.bortleScale || 5;
    }
    
    // Prepare comprehensive weather data
    const weatherDataWithClearSky = { 
      ...weatherData,
      clearSkyRate: clearSkyData?.annualRate
    };
    
    // Calculate SIQS with nighttime optimization
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherDataWithClearSky,
      finalBortleScale,
      3, // Default seeing conditions
      0.5, // Default moon phase
      forecastData
    );
    
    // Apply stability adjustments
    let adjustedScore = siqsResult.score;
    
    // Adjust for clear sky rate if available
    if (clearSkyData && typeof clearSkyData.annualRate === 'number') {
      const clearSkyFactor = Math.min(1.2, (clearSkyData.annualRate / 100) + 0.2);
      adjustedScore *= clearSkyFactor;
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
