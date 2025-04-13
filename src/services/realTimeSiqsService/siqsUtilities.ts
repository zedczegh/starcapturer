
import { WeatherDataWithClearSky } from './types';
import { extractNightForecasts, calculateAverageCloudCover } from '@/components/forecast/NightForecastUtils';

/**
 * Determine if it's nighttime for cache duration purposes
 */
export const isNighttime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 8; // 6 PM to 8 AM
};

/**
 * Process weather data with nighttime forecast for SIQS calculation
 */
export const processWeatherDataForSiqs = async (
  weatherData: WeatherDataWithClearSky,
  forecastData: any,
  finalBortleScale: number
): Promise<{
  siqs: number;
  isViable: boolean;
  factors?: any[];
}> => {
  console.log('Starting nighttime SIQS calculation');
  
  // Extract nighttime forecasts from forecast data
  const nighttimeForecasts = extractNightForecasts(forecastData);
  
  console.log(`Found ${nighttimeForecasts.length} nighttime forecast hours (6 PM to 8 AM)`);
  
  if (nighttimeForecasts.length === 0) {
    console.log('No nighttime forecasts found, using current weather data');
    // If no nighttime forecasts are available, use current weather data
    return {
      siqs: Math.max(0, 10 - finalBortleScale * 0.8 - weatherData.cloudCover * 0.03),
      isViable: finalBortleScale <= 4
    };
  }
  
  // Calculate average cloud cover separately for evening and morning
  const { 
    eveningForecasts,
    morningForecasts,
    averageCloudCover, 
    averageWindSpeed, 
    averageHumidity 
  } = calculateAverageCloudCover(nighttimeForecasts);
  
  console.log(`Evening forecasts (6PM-12AM): ${eveningForecasts.length}, Morning forecasts (1AM-8AM): ${morningForecasts.length}`);
  
  // Calculate weighted average cloud cover
  const eveningAvgCloud = eveningForecasts.reduce((sum, item) => sum + item.cloudCover, 0) / 
    Math.max(1, eveningForecasts.length);
  
  const morningAvgCloud = morningForecasts.reduce((sum, item) => sum + item.cloudCover, 0) / 
    Math.max(1, morningForecasts.length);
    
  console.log(`Average cloud cover - Evening: ${eveningAvgCloud.toFixed(1)}%, Morning: ${morningAvgCloud.toFixed(1)}%`);
  
  // Log average values for debugging
  console.log(`Average values - Cloud: ${averageCloudCover.toFixed(1)}%, Wind: ${averageWindSpeed.toFixed(1)}km/h, Humidity: ${averageHumidity.toFixed(1)}%`);
  
  // Calculate SIQS using nighttime forecast data
  const cloudFactor = Math.max(0, 8 - averageCloudCover * 0.08);
  const bortleFactor = Math.max(0, 9 - finalBortleScale * 1.0);
  const windFactor = Math.max(0, 1 - averageWindSpeed * 0.05);
  const humidityFactor = Math.max(0, 1 - averageHumidity * 0.005);
  
  const siqsScore = cloudFactor + bortleFactor + windFactor + humidityFactor;
  const finalSiqs = Math.max(0, Math.min(10, siqsScore));
  
  console.log(`Final SIQS score based on nighttime forecast: ${finalSiqs.toFixed(1)}`);
  
  return {
    siqs: finalSiqs,
    isViable: finalSiqs >= 2.0,
    factors: [
      { name: 'cloudCover', value: averageCloudCover, impact: cloudFactor },
      { name: 'bortleScale', value: finalBortleScale, impact: bortleFactor },
      { name: 'windSpeed', value: averageWindSpeed, impact: windFactor },
      { name: 'humidity', value: averageHumidity, impact: humidityFactor }
    ]
  };
};

/**
 * Clean up expired cache entries
 */
export const cleanupExpiredCache = (
  cache: Map<string, { timestamp: number }>,
  nightCacheDuration: number,
  dayCacheDuration: number
): number => {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, data] of cache.entries()) {
    const cacheDuration = isNighttime() ? nightCacheDuration : dayCacheDuration;
    
    if (now - data.timestamp > cacheDuration) {
      cache.delete(key);
      expiredCount++;
    }
  }
  
  return expiredCount;
};
