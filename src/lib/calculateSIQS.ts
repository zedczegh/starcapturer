
// SIQS = Stellar Imaging Quality Score
import { SIQSFactors, SIQSResult } from './siqs/types';
import { 
  calculateCloudScore,
  calculateLightPollutionScore,
  calculateSeeingScore,
  calculateWindScore,
  calculateHumidityScore,
  calculateMoonScore,
  calculateAQIScore
} from './siqs/factors';
import { 
  getCloudDescription,
  getLightPollutionDescription,
  getSeeingDescription,
  getWindDescription,
  getHumidityDescription,
  getAQIDescription
} from './siqs/descriptions';
import { isImagingImpossible, siqsToColor } from './siqs/utils';

// Re-export types and utility functions for backward compatibility
export type { SIQSFactors, SIQSResult } from './siqs/types';
export { siqsToColor } from './siqs/utils';

// Define a type for individual factor data
type FactorData = {
  name: string;
  score: number;
  description: string;
};

/**
 * Determines if a time is within astronomical night hours (6 PM to 8 AM)
 * @param dateTime The time to check
 * @returns boolean indicating if it's night time
 */
function isNightTime(dateTime: Date): boolean {
  const hour = dateTime.getHours();
  return hour >= 18 || hour < 8;
}

/**
 * Filters forecast data to include only nighttime hours
 * @param forecast Array of forecast items with time property
 * @returns Array of nighttime forecast items
 */
function filterNightTimeForecast(forecast: any[]): any[] {
  if (!forecast || !Array.isArray(forecast) || forecast.length === 0) return [];
  
  return forecast.filter(item => {
    if (!item || !item.time) return false;
    try {
      const itemTime = new Date(item.time);
      return isNightTime(itemTime);
    } catch (error) {
      console.error("Error parsing forecast time:", error);
      return false;
    }
  });
}

/**
 * Check if cloud cover exceeds the threshold (50%)
 * Note: We've removed the early return of 0 score for high cloud cover
 * to provide more encouraging feedback
 * @param cloudCover Cloud cover percentage
 * @returns True if cloud cover is over threshold
 */
function isCloudCoverTooHigh(cloudCover: number): boolean {
  return typeof cloudCover === 'number' && cloudCover > 50;
}

/**
 * Safely extracts a numerical value from a forecast item property
 * @param item The forecast item
 * @param property The property name to extract
 * @param defaultValue Default value if property is missing or invalid
 * @returns The extracted numerical value
 */
function safeGetNumberFromForecast(
  item: any, 
  property: string, 
  defaultValue: number
): number {
  if (!item || typeof item !== 'object') return defaultValue;
  
  const value = item[property];
  if (value === undefined || value === null) return defaultValue;
  
  const numValue = Number(value);
  return isNaN(numValue) ? defaultValue : numValue;
}

/**
 * Calculate the Stellar Imaging Quality Score based on various factors
 * @param factors Environmental and geographical factors
 * @returns SIQS score from 0-10 (higher is better)
 */
export function calculateSIQS(factors: SIQSFactors): SIQSResult {
  try {
    const { 
      cloudCover, 
      bortleScale, 
      seeingConditions, 
      windSpeed, 
      humidity, 
      moonPhase = 0,
      nightForecast = [],
      precipitation = 0,
      weatherCondition = "",
      aqi
    } = factors;
    
    // Validate critical inputs
    const validBortleScale = typeof bortleScale === 'number' && !isNaN(bortleScale) 
      ? Math.max(1, Math.min(9, bortleScale)) 
      : 5;
    
    // Filter nightForecast to only include nighttime hours (6 PM to 8 AM)
    const tonightForecast = filterNightTimeForecast(nightForecast);
    
    console.log(`SIQS calculation with ${tonightForecast.length} nighttime forecast items`);
    
    // Get the current date/time
    const now = new Date();
    const isCurrentlyNightTime = isNightTime(now);
    
    // If we have nighttime forecast data, prioritize that for calculation
    if (tonightForecast.length > 0) {
      console.log("Using nighttime forecast data for SIQS calculation");
      
      // Calculate average cloud cover from nighttime forecast with improved error handling
      let validItemCount = 0;
      const avgCloudCover = tonightForecast.reduce((sum, item) => {
        const cloudValue = safeGetNumberFromForecast(item, 'cloudCover', -1);
        if (cloudValue >= 0) {
          validItemCount++;
          return sum + cloudValue;
        }
        return sum;
      }, 0) / (validItemCount || 1);
      
      // Calculate average values for other factors
      validItemCount = 0;
      const avgWindSpeed = tonightForecast.reduce((sum, item) => {
        const windValue = safeGetNumberFromForecast(item, 'windSpeed', -1);
        if (windValue >= 0) {
          validItemCount++;
          return sum + windValue;
        }
        return sum;
      }, 0) / (validItemCount || 1);
      
      validItemCount = 0;
      const avgHumidity = tonightForecast.reduce((sum, item) => {
        const humidityValue = safeGetNumberFromForecast(item, 'humidity', -1);
        if (humidityValue >= 0) {
          validItemCount++;
          return sum + humidityValue;
        }
        return sum;
      }, 0) / (validItemCount || 1);
      
      console.log(`Average values - Cloud: ${avgCloudCover.toFixed(1)}%, Wind: ${avgWindSpeed.toFixed(1)}km/h, Humidity: ${avgHumidity.toFixed(1)}%`);
      
      // Calculate individual factor scores using nighttime data
      const cloudScore = calculateCloudScore(avgCloudCover);
      const lightPollutionScore = calculateLightPollutionScore(validBortleScale);
      const seeingScore = calculateSeeingScore(seeingConditions);
      const windScore = calculateWindScore(avgWindSpeed);
      const humidityScore = calculateHumidityScore(avgHumidity);
      const moonScore = calculateMoonScore(moonPhase);
      const aqiScore = typeof aqi === 'number' && !isNaN(aqi) ? calculateAQIScore(aqi) : 100;
      
      // Define weights for each factor
      const weights = {
        cloud: 0.30,
        lightPollution: 0.20,
        seeing: 0.15,
        wind: 0.10,
        humidity: 0.10,
        moon: 0.05,
        aqi: 0.10
      };
      
      // Calculate weighted score
      const weightedScore = (
        cloudScore * weights.cloud +
        lightPollutionScore * weights.lightPollution +
        seeingScore * weights.seeing +
        windScore * weights.wind +
        humidityScore * weights.humidity +
        moonScore * weights.moon +
        aqiScore * weights.aqi
      );
      
      // Convert to 0-10 scale for consistency
      const finalScore = weightedScore / 10;
      
      // Determine if conditions are viable (SIQS >= 4.0)
      const isViable = finalScore >= 4.0;
      
      // Create factors array for the result
      const factorsList: FactorData[] = [
        {
          name: "Cloud Cover",
          score: cloudScore,
          description: getCloudDescription(avgCloudCover)
        },
        {
          name: "Light Pollution",
          score: lightPollutionScore,
          description: getLightPollutionDescription(validBortleScale)
        },
        {
          name: "Seeing Conditions",
          score: seeingScore,
          description: getSeeingDescription(seeingConditions)
        },
        {
          name: "Wind",
          score: windScore,
          description: getWindDescription(avgWindSpeed)
        },
        {
          name: "Humidity",
          score: humidityScore,
          description: getHumidityDescription(avgHumidity)
        }
      ];
      
      // Add AQI factor if available
      if (aqi !== undefined) {
        factorsList.push({
          name: "Air Quality",
          score: aqiScore,
          description: getAQIDescription(aqi)
        });
      }
      
      console.log(`Final SIQS score based on nighttime forecast: ${finalScore.toFixed(1)}`);
      
      return {
        score: finalScore,
        isViable,
        factors: factorsList
      };
    }
    
    // If no nighttime forecast is available, fall back to current conditions
    console.log("No nighttime forecast available, using current conditions for SIQS");
    
    // Validate current condition values
    const validCloudCover = typeof cloudCover === 'number' && !isNaN(cloudCover) 
      ? Math.max(0, Math.min(100, cloudCover)) 
      : 50;
    
    const validSeeingConditions = typeof seeingConditions === 'number' && !isNaN(seeingConditions) 
      ? Math.max(1, Math.min(5, seeingConditions)) 
      : 3;
    
    const validWindSpeed = typeof windSpeed === 'number' && !isNaN(windSpeed) 
      ? Math.max(0, windSpeed) 
      : 10;
    
    const validHumidity = typeof humidity === 'number' && !isNaN(humidity) 
      ? Math.max(0, Math.min(100, humidity)) 
      : 50;
    
    const validMoonPhase = typeof moonPhase === 'number' && !isNaN(moonPhase) 
      ? Math.max(0, Math.min(1, moonPhase)) 
      : 0.5;
    
    const validAqi = typeof aqi === 'number' && !isNaN(aqi) 
      ? Math.max(0, aqi) 
      : undefined;
    
    // Calculate individual factor scores for current conditions
    const cloudScore = calculateCloudScore(validCloudCover);
    const lightPollutionScore = calculateLightPollutionScore(validBortleScale);
    const seeingScore = calculateSeeingScore(validSeeingConditions);
    const windScore = calculateWindScore(validWindSpeed);
    const humidityScore = calculateHumidityScore(validHumidity);
    const moonScore = calculateMoonScore(validMoonPhase);
    const aqiScore = validAqi !== undefined ? calculateAQIScore(validAqi) : 100;
    
    // Define weights for each factor
    const weights = {
      cloud: 0.30,
      lightPollution: 0.20,
      seeing: 0.15,
      wind: 0.10,
      humidity: 0.10,
      moon: 0.05,
      aqi: 0.10
    };
    
    // Calculate weighted score
    const weightedScore = (
      cloudScore * weights.cloud +
      lightPollutionScore * weights.lightPollution +
      seeingScore * weights.seeing +
      windScore * weights.wind +
      humidityScore * weights.humidity +
      moonScore * weights.moon +
      aqiScore * weights.aqi
    );
    
    // Convert to 0-10 scale
    const finalScore = weightedScore / 10;
    
    // Determine if conditions are viable (SIQS >= 4.0)
    const isViable = finalScore >= 4.0;
    
    // Create factors array for the result
    const factorsList: FactorData[] = [
      {
        name: "Cloud Cover",
        score: cloudScore,
        description: getCloudDescription(validCloudCover)
      },
      {
        name: "Light Pollution",
        score: lightPollutionScore,
        description: getLightPollutionDescription(validBortleScale)
      },
      {
        name: "Seeing Conditions",
        score: seeingScore,
        description: getSeeingDescription(validSeeingConditions)
      },
      {
        name: "Wind",
        score: windScore,
        description: getWindDescription(validWindSpeed)
      },
      {
        name: "Humidity",
        score: humidityScore,
        description: getHumidityDescription(validHumidity)
      }
    ];
    
    // Add AQI factor if available
    if (validAqi !== undefined) {
      factorsList.push({
        name: "Air Quality",
        score: aqiScore,
        description: getAQIDescription(validAqi)
      });
    }
    
    console.log(`Final SIQS score based on current conditions: ${finalScore.toFixed(1)}`);
    
    return {
      score: finalScore,
      isViable,
      factors: factorsList
    };
  } catch (error) {
    console.error("Error in SIQS calculation:", error);
    
    // Return a fallback value in case of calculation errors
    return {
      score: 5.0,
      isViable: true,
      factors: [
        {
          name: "Fallback Score",
          score: 50,
          description: "Error occurred during calculation, showing estimated values"
        }
      ]
    };
  }
}
