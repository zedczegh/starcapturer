import { fetchForecastData, fetchWeatherData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { fetchClearSkyRate } from "@/lib/api/clearSkyRate";
import {
  hasCachedSiqs,
  getCachedSiqs,
  setSiqsCache
} from "./siqsCache";
import { detectWaterLocationAsync } from '@/utils/waterDetection/enhancedWaterDetector';

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
  
  const waterDetection = await detectWaterLocationAsync(latitude, longitude);
  if (waterDetection.isWater && waterDetection.confidence > 0.9) {
    console.log(`Location at ${latitude}, ${longitude} detected as water (${waterDetection.source}) with ${waterDetection.confidence} confidence`);
    return { siqs: 0, isViable: false };
  }
  
  if (hasCachedSiqs(latitude, longitude)) {
    const cachedData = getCachedSiqs(latitude, longitude);
    if (cachedData) {
      console.log(`Using cached SIQS data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, score: ${cachedData.siqs.toFixed(1)}`);
      return cachedData;
    }
  }
  
  console.log(`Calculating real-time SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  
  try {
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
    
    let finalBortleScale = bortleScale;
    if (!finalBortleScale || finalBortleScale <= 0 || finalBortleScale > 9) {
      const [pollutionData] = extraData;
      finalBortleScale = pollutionData?.bortleScale || 5;
    }
    
    const weatherDataWithClearSky = { 
      ...weatherData,
      clearSkyRate: clearSkyData?.annualRate
    };
    
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherDataWithClearSky,
      finalBortleScale,
      3,
      0.5,
      forecastData
    );
    
    let adjustedScore = siqsResult.score;
    
    if (waterDetection.confidence > 0.5 && waterDetection.confidence <= 0.9) {
      const waterProximityFactor = 1 - (waterDetection.confidence - 0.5);
      adjustedScore *= waterProximityFactor;
      console.log(`Adjusted SIQS for water proximity: ${adjustedScore.toFixed(2)} (factor: ${waterProximityFactor.toFixed(2)})`);
    }
    
    adjustedScore = Math.min(9.5, adjustedScore);
    adjustedScore = Math.max(0, adjustedScore);
    
    const finalScore = Math.round(adjustedScore * 10) / 10;
    
    const result = {
      siqs: finalScore,
      isViable: finalScore >= 2.0,
      factors: siqsResult.factors
    };
    
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
