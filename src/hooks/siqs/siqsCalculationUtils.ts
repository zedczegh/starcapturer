
import { calculateSIQS } from '@/lib/calculateSIQS';
import { SIQSResult, SIQSFactor } from '@/lib/siqs/types';
import { extractNightForecasts, calculateAverageCloudCover } from '@/components/forecast/NightForecastUtils';

/**
 * Calculate SIQS with weather data and optional forecast data
 */
export async function calculateSIQSWithWeatherData(
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData?: any
): Promise<SIQSResult> {
  try {
    // If we have forecast data, use nighttime forecast for better accuracy
    if (forecastData?.hourly) {
      console.info("Using nighttime forecast data for SIQS calculation");
      
      const nightForecast = extractNightForecasts(forecastData.hourly);
      
      if (nightForecast.length > 0) {
        // Calculate averages for important parameters
        const { 
          cloudCoverAverage,
          windSpeedAverage,
          humidityAverage
        } = calculateAverageValues(nightForecast);
        
        console.info(`Average values - Cloud: ${cloudCoverAverage.toFixed(1)}%, Wind: ${windSpeedAverage.toFixed(1)}km/h, Humidity: ${humidityAverage.toFixed(1)}%`);
        
        // Calculate SIQS with night forecast data
        const siqsResult = calculateSIQS({
          cloudCover: cloudCoverAverage,
          bortleScale,
          seeingConditions,
          windSpeed: windSpeedAverage,
          humidity: humidityAverage,
          moonPhase,
          aqi: weatherData.aqi,
          clearSkyRate: weatherData.clearSkyRate,
          nightForecast
        });
        
        console.info(`Final SIQS score based on nighttime forecast: ${siqsResult.score.toFixed(1)}`);
        console.info(`Final SIQS score based on nighttime forecast: ${siqsResult.score.toFixed(1)}`);
        console.info(`Using nighttime forecast for SIQS calculation: ${siqsResult.score}`);
        
        return siqsResult;
      }
    }
    
    // Fallback to regular calculation if no forecast data
    const siqsResult = calculateSIQS({
      cloudCover: weatherData.cloudCover,
      bortleScale,
      seeingConditions,
      windSpeed: weatherData.windSpeed,
      humidity: weatherData.humidity,
      moonPhase,
      aqi: weatherData.aqi,
      weatherCondition: weatherData.weatherCondition,
      precipitation: weatherData.precipitation,
      clearSkyRate: weatherData.clearSkyRate
    });
    
    return siqsResult;
  } catch (error) {
    console.error("Error calculating SIQS with weather data:", error);
    
    // Return a minimal valid result on error
    return {
      score: 0,
      factors: [],
      isViable: false
    };
  }
}

/**
 * Calculate average values from nighttime forecast
 */
function calculateAverageValues(nightForecast: any[]) {
  let cloudCoverSum = 0;
  let windSpeedSum = 0;
  let humiditySum = 0;
  
  nightForecast.forEach(item => {
    cloudCoverSum += typeof item.cloud_cover === 'number' ? item.cloud_cover : 0;
    windSpeedSum += typeof item.wind_speed === 'number' ? item.wind_speed : 0;
    humiditySum += typeof item.humidity === 'number' ? item.humidity : 0;
  });
  
  const count = nightForecast.length || 1;
  
  return {
    cloudCoverAverage: cloudCoverSum / count,
    windSpeedAverage: windSpeedSum / count,
    humidityAverage: humiditySum / count
  };
}

/**
 * Calculate SIQS with minimal parameters
 */
export function calculateBasicSIQS(bortleScale: number): number {
  // Simple calculation based only on Bortle scale
  return Math.max(1, 10 - bortleScale);
}
