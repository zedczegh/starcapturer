
// Core SIQS calculation functions
import { fetchForecastData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchWeatherData } from "@/lib/api/weather";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { fetchClearSkyRate } from "@/lib/api/clearSkyRate";
import { 
  generateCacheKey,
  getCacheEntry,
  getCacheDuration,
  setCacheEntry
} from './siqsCache';
import { SiqsResult, WeatherDataWithClearSky } from './types';

/**
 * Calculate real-time SIQS for a given location
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @param bortleScale Bortle scale of the location (light pollution)
 * @returns Promise resolving to SIQS score and viability
 */
export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number
): Promise<SiqsResult> {
  // Validate inputs
  if (!isFinite(latitude) || !isFinite(longitude)) {
    console.error("Invalid coordinates provided to calculateRealTimeSiqs");
    return { siqs: 0, isViable: false };
  }
  
  // Generate cache key
  const cacheKey = generateCacheKey(latitude, longitude);
  
  // Check cache first with improved cache key strategy
  const cachedData = getCacheEntry(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < getCacheDuration()) {
    console.log(`Using cached SIQS data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, score: ${cachedData.siqs.toFixed(1)}`);
    return {
      siqs: cachedData.siqs,
      isViable: cachedData.isViable,
      factors: cachedData.factors
    };
  }
  
  console.log(`Calculating real-time SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  
  try {
    // Parallel data fetching for improved performance
    const [weatherData, forecastData, clearSkyData] = await Promise.all([
      fetchWeatherData({ latitude, longitude }),
      fetchForecastData({ latitude, longitude, days: 2 }),
      fetchClearSkyRate(latitude, longitude)
    ]);
    
    // Default values if API calls fail
    if (!weatherData) {
      return { siqs: 0, isViable: false };
    }
    
    // For light pollution, use provided Bortle scale or fetch it
    let finalBortleScale = bortleScale;
    if (!finalBortleScale || finalBortleScale <= 0 || finalBortleScale > 9) {
      try {
        const pollutionData = await fetchLightPollutionData(latitude, longitude);
        finalBortleScale = pollutionData?.bortleScale || 5;
      } catch (err) {
        console.error("Error fetching light pollution data:", err);
        finalBortleScale = 5; // Default fallback
      }
    }
    
    // Prepare weather data with clear sky rate
    const weatherDataWithClearSky: WeatherDataWithClearSky = { ...weatherData };
    
    // Add clear sky rate to weather data if available
    if (clearSkyData && typeof clearSkyData.annualRate === 'number') {
      weatherDataWithClearSky.clearSkyRate = clearSkyData.annualRate;
      console.log(`Using clear sky rate for location: ${clearSkyData.annualRate}%`);
    }
    
    // Calculate SIQS using the optimized method with nighttime forecasts
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherDataWithClearSky,
      finalBortleScale,
      3, // Default seeing conditions
      0.5, // Default moon phase
      forecastData
    );
    
    console.log(`Calculated SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}: ${siqsResult.score.toFixed(1)}`);
    
    // Ensure SIQS is positive
    const finalSiqs = Math.max(0, siqsResult.score);
    const isViable = finalSiqs >= 2.0; // Consistent threshold with other parts of the app
    
    // Store in cache
    setCacheEntry(cacheKey, {
      siqs: finalSiqs,
      isViable: isViable,
      timestamp: Date.now(),
      factors: siqsResult.factors
    });
    
    return {
      siqs: finalSiqs,
      isViable: isViable,
      factors: siqsResult.factors
    };
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return { siqs: 0, isViable: false };
  }
}
