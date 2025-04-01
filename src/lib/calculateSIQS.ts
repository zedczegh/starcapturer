
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
    if (!item.time) return false;
    const itemTime = new Date(item.time);
    return isNightTime(itemTime);
  });
}

/**
 * Check if cloud cover exceeds 40% (imaging impossible threshold)
 * @param cloudCover Cloud cover percentage
 * @returns True if cloud cover is over 40%
 */
function isCloudCoverTooHigh(cloudCover: number): boolean {
  return typeof cloudCover === 'number' && cloudCover > 40;
}

/**
 * Calculate the Stellar Imaging Quality Score based on various factors
 * @param factors Environmental and geographical factors
 * @returns SIQS score from 0-10 (higher is better)
 */
export function calculateSIQS(factors: SIQSFactors): SIQSResult {
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
  
  // Filter nightForecast to only include nighttime hours (6 PM to 8 AM)
  const tonightForecast = filterNightTimeForecast(nightForecast);
  
  console.log(`SIQS calculation with ${tonightForecast.length} nighttime forecast items`);
  
  // Get the current date/time
  const now = new Date();
  const isCurrentlyNightTime = isNightTime(now);
  
  // If we have nighttime forecast data, prioritize that for calculation
  if (tonightForecast.length > 0) {
    console.log("Using nighttime forecast data for SIQS calculation");
    
    // Calculate average cloud cover from nighttime forecast
    const avgCloudCover = tonightForecast.reduce((sum, item) => sum + (item.cloudCover || 0), 0) / tonightForecast.length;
    
    // STRICT ENFORCEMENT of cloud cover > 40% = 0 rule
    if (isCloudCoverTooHigh(avgCloudCover)) {
      console.log(`Average cloud cover is ${avgCloudCover}%, which exceeds 40% threshold. SIQS score = 0`);
      return {
        score: 0,
        isViable: false,
        factors: [
          {
            name: "Cloud Cover",
            score: 0,
            description: getCloudDescription(avgCloudCover)
          }
        ]
      };
    }
    
    // Calculate average values for other factors
    const avgWindSpeed = tonightForecast.reduce((sum, item) => sum + (item.windSpeed || 0), 0) / tonightForecast.length;
    const avgHumidity = tonightForecast.reduce((sum, item) => sum + (item.humidity || 0), 0) / tonightForecast.length;
    
    // Calculate individual factor scores using nighttime data
    const cloudScore = calculateCloudScore(avgCloudCover);
    const lightPollutionScore = calculateLightPollutionScore(bortleScale);
    const seeingScore = calculateSeeingScore(seeingConditions);
    const windScore = calculateWindScore(avgWindSpeed);
    const humidityScore = calculateHumidityScore(avgHumidity);
    const moonScore = calculateMoonScore(moonPhase);
    const aqiScore = aqi ? calculateAQIScore(aqi) : 100;
    
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
        description: getLightPollutionDescription(bortleScale)
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
  
  // STRICT ENFORCEMENT of cloud cover > 40% = 0 rule for current conditions
  if (isCloudCoverTooHigh(cloudCover)) {
    console.log(`Current cloud cover is ${cloudCover}%, which exceeds 40% threshold. SIQS score = 0`);
    return {
      score: 0,
      isViable: false,
      factors: [
        {
          name: "Cloud Cover",
          score: 0,
          description: getCloudDescription(cloudCover)
        }
      ]
    };
  }
  
  // Calculate individual factor scores for current conditions
  const cloudScore = calculateCloudScore(cloudCover);
  const lightPollutionScore = calculateLightPollutionScore(bortleScale);
  const seeingScore = calculateSeeingScore(seeingConditions);
  const windScore = calculateWindScore(windSpeed);
  const humidityScore = calculateHumidityScore(humidity);
  const moonScore = calculateMoonScore(moonPhase);
  const aqiScore = aqi ? calculateAQIScore(aqi) : 100;
  
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
      description: getCloudDescription(cloudCover)
    },
    {
      name: "Light Pollution",
      score: lightPollutionScore,
      description: getLightPollutionDescription(bortleScale)
    },
    {
      name: "Seeing Conditions",
      score: seeingScore,
      description: getSeeingDescription(seeingConditions)
    },
    {
      name: "Wind",
      score: windScore,
      description: getWindDescription(windSpeed)
    },
    {
      name: "Humidity",
      score: humidityScore,
      description: getHumidityDescription(humidity)
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
  
  console.log(`Final SIQS score based on current conditions: ${finalScore.toFixed(1)}`);
  
  return {
    score: finalScore,
    isViable,
    factors: factorsList
  };
}
