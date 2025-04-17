
import { SiqsResult, WeatherDataWithClearSky } from './siqsTypes';
import { evaluateCloudCover, evaluateHumidity, evaluateTemperature, evaluateWindSpeed } from './siqsEvaluators';
import { adjustForClimate, adjustForTime, adjustForLight } from './siqsAdjustments';
import { getClimateRegion } from './climateRegions';

interface SiqsOptions {
  includeFactors?: boolean;
  language?: 'en' | 'zh';
}

/**
 * Calculate Sky Image Quality Score (SIQS) based on weather and location data
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number,
  weatherData?: WeatherDataWithClearSky,
  options: SiqsOptions = {}
): Promise<SiqsResult> {
  try {
    // Default options
    const { includeFactors = true } = options;
    
    // Use provided weather data or generate default values
    const weather = weatherData || {
      temperature: 15,
      humidity: 50,
      cloudCover: 30,
      windSpeed: 5,
      clearSky: 70,
    };
    
    // Core factors evaluation
    const cloudScore = evaluateCloudCover(weather.cloudCover);
    const humidityScore = evaluateHumidity(weather.humidity);
    const temperatureScore = evaluateTemperature(weather.temperature);
    const windScore = evaluateWindSpeed(weather.windSpeed || 0);
    
    // Get regional adjustments
    const climateRegion = getClimateRegion(latitude, longitude);
    
    // Apply adjustments
    const adjustedCloudScore = adjustForClimate(cloudScore, 'cloudCover', climateRegion);
    const adjustedHumidityScore = adjustForClimate(humidityScore, 'humidity', climateRegion);
    const adjustedTempScore = adjustForClimate(temperatureScore, 'temperature', climateRegion);
    
    // Calculate time adjustments (time of day/year)
    const timeAdjustedCloud = adjustForTime(adjustedCloudScore, latitude, longitude);
    
    // Light pollution adjustments based on Bortle scale
    const lightAdjustedScore = adjustForLight(
      (timeAdjustedCloud + adjustedHumidityScore + adjustedTempScore + windScore) / 4, 
      bortleScale
    );
    
    // Final SIQS calculation (scale 0-10)
    const siqs = Math.min(10, Math.max(0, lightAdjustedScore));
    
    // Determine viability (score >= 5.0 is generally viable)
    const isViable = siqs >= 5.0;
    
    // Create result object
    const result: SiqsResult = {
      siqs,
      isViable,
    };
    
    // Include factor details if requested
    if (includeFactors) {
      result.factors = [
        {
          name: 'Cloud Cover',
          score: timeAdjustedCloud,
          description: `${weather.cloudCover}% cover, adjusted for location and time`
        },
        {
          name: 'Humidity',
          score: adjustedHumidityScore,
          description: `${weather.humidity}% humidity, adjusted for climate`
        },
        {
          name: 'Temperature',
          score: adjustedTempScore,
          description: `${weather.temperature}°C, affects seeing conditions`
        },
        {
          name: 'Wind',
          score: windScore,
          description: `${weather.windSpeed || 0} km/h, affects stability`
        }
      ];
    }
    
    return result;
  } catch (error) {
    console.error('Error calculating SIQS:', error);
    return {
      siqs: 0,
      isViable: false
    };
  }
}
