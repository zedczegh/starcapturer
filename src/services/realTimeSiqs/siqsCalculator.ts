
import axios from 'axios';
import { calculateSIQS } from '@/lib/calculateSIQS';
import { getCurrentMoonPhase } from '@/utils/moonPhaseCalculator';
import { calculateAstronomicalNight } from '@/utils/astronomy/nightTimeCalculator';
import { calculateTonightCloudCover } from '@/utils/nighttimeSIQS';

// Cache for SIQS calculations to prevent excessive API calls
const siqsCache = new Map<string, { siqs: number; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Calculate real-time SIQS for a specific location
 */
export async function calculateRealTimeSiqs(latitude: number, longitude: number, bortleScale: number) {
  try {
    console.log(`Calculating real-time SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, Bortle: ${bortleScale}`);
    
    // Check cache first
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale}`;
    const cached = siqsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log('Using cached SIQS data:', cached.siqs);
      return { siqs: cached.siqs };
    }
    
    // Fetch weather data
    let weatherData;
    try {
      const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relativehumidity_2m,cloudcover,windspeed_10m&timezone=auto`);
      weatherData = response.data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Fallback to reasonable default values
      weatherData = {
        hourly: {
          temperature_2m: Array(24).fill(15), 
          relativehumidity_2m: Array(24).fill(60),
          cloudcover: Array(24).fill(50),
          windspeed_10m: Array(24).fill(10)
        }
      };
    }
    
    // Calculate moon phase
    const moonPhase = getCurrentMoonPhase();
    
    // Calculate cloud cover during astronomical night
    let cloudCover = 50; // Default value
    let tonightCloudCover = null;
    
    try {
      if (weatherData?.hourly?.cloudcover) {
        tonightCloudCover = calculateTonightCloudCover(weatherData.hourly, latitude, longitude);
        cloudCover = tonightCloudCover;
        console.log(`Tonight's astronomical night cloud cover: ${cloudCover}%`);
      }
    } catch (error) {
      console.error('Error calculating tonight cloud cover:', error);
      // Use the current hour's cloud cover as fallback
      const currentHour = new Date().getHours();
      cloudCover = weatherData?.hourly?.cloudcover[currentHour] || 50;
    }
    
    // Get current weather conditions
    const currentHour = new Date().getHours();
    const currentTemp = weatherData?.hourly?.temperature_2m?.[currentHour] || 15;
    const currentHumidity = weatherData?.hourly?.relativehumidity_2m?.[currentHour] || 60;
    const currentWindSpeed = weatherData?.hourly?.windspeed_10m?.[currentHour] || 10;
    
    // Build up SIQS input data with all available information
    const siqsInput = {
      cloudCover,
      bortleScale,
      seeingConditions: 2.5, // Default seeing conditions
      windSpeed: currentWindSpeed,
      humidity: currentHumidity, 
      moonPhase,
      clearSkyRate: 100 - cloudCover
    };
    
    // Calculate SIQS score using our algorithm
    const siqsResult = calculateSIQS(siqsInput);
    const siqs = siqsResult.score;
    
    console.log('Calculated SIQS score:', siqs);
    
    // Update cache
    siqsCache.set(cacheKey, { siqs, timestamp: Date.now() });
    
    return { siqs };
    
  } catch (error) {
    console.error('Error in calculateRealTimeSiqs:', error);
    throw new Error(`Failed to calculate SIQS: ${error}`);
  }
}

/**
 * Clear the location SIQS cache
 */
export function clearLocationCache() {
  siqsCache.clear();
  console.log("Cleared SIQS location cache");
}
