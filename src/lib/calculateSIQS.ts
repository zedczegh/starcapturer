
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
 * Check if cloud cover exceeds the threshold
 * MODIFIED: Now we just flag if it's very poor for imaging (>80%)
 * @param cloudCover Cloud cover percentage
 * @returns True if cloud cover is extremely high
 */
function isCloudCoverTooHigh(cloudCover: number): boolean {
  return typeof cloudCover === 'number' && cloudCover > 80;
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
    
    // MODIFIED: We still calculate score even with high cloud cover
    // instead of returning 0 immediately
    const cloudScore = calculateCloudScore(avgCloudCover);
    const isVeryPoorConditions = isCloudCoverTooHigh(avgCloudCover);
    
    // Add encouraging message for poor conditions
    let encouragementMessage = null;
    if (avgCloudCover > 50) {
      encouragementMessage = "Don't worry, clear skies will eventually come! Try our Photo Points Nearby feature to find ideal astro-spots!";
    }
    
    // For extremely poor conditions, we'll still provide a minimal score
    // but mark it as non-viable for imaging
    if (isVeryPoorConditions) {
      console.log(`Average cloud cover is ${avgCloudCover}%, which is very poor for imaging. Limited SIQS score.`);
      
      // Calculate basic weather factors anyway
      const avgWindSpeed = tonightForecast.reduce((sum, item) => sum + (item.windSpeed || 0), 0) / tonightForecast.length;
      const avgHumidity = tonightForecast.reduce((sum, item) => sum + (item.humidity || 0), 0) / tonightForecast.length;
      
      return {
        score: cloudScore / 10, // Convert to 0-10 scale (will be 0.5 or less)
        isViable: false,
        encouragementMessage,
        factors: [
          {
            name: "Cloud Cover",
            score: cloudScore,
            description: getCloudDescription(avgCloudCover)
          },
          {
            name: "Wind",
            score: calculateWindScore(avgWindSpeed),
            description: getWindDescription(avgWindSpeed)
          },
          {
            name: "Humidity",
            score: calculateHumidityScore(avgHumidity),
            description: getHumidityDescription(avgHumidity)
          }
        ]
      };
    }
    
    // Calculate average values for other factors
    const avgWindSpeed = tonightForecast.reduce((sum, item) => sum + (item.windSpeed || 0), 0) / tonightForecast.length;
    const avgHumidity = tonightForecast.reduce((sum, item) => sum + (item.humidity || 0), 0) / tonightForecast.length;
    
    // Calculate individual factor scores using nighttime data
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
      encouragementMessage,
      factors: factorsList
    };
  }
  
  // If no nighttime forecast is available, fall back to current conditions
  console.log("No nighttime forecast available, using current conditions for SIQS");
  
  // MODIFIED: We still calculate score even with high cloud cover
  const cloudScore = calculateCloudScore(cloudCover);
  const isVeryPoorConditions = isCloudCoverTooHigh(cloudCover);
  
  // Add encouraging message for poor conditions
  let encouragementMessage = null;
  if (cloudCover > 50) {
    encouragementMessage = "Don't worry, clear skies will eventually come! Try our Photo Points Nearby feature to find ideal astro-spots!";
  }
  
  // For extremely poor conditions, we'll still provide a minimal score
  if (isVeryPoorConditions) {
    console.log(`Current cloud cover is ${cloudCover}%, which is very poor for imaging. Limited SIQS score.`);
    return {
      score: cloudScore / 10, // Convert to 0-10 scale (will be 0.5 or less)
      isViable: false,
      encouragementMessage,
      factors: [
        {
          name: "Cloud Cover",
          score: cloudScore,
          description: getCloudDescription(cloudCover)
        },
        {
          name: "Wind",
          score: calculateWindScore(windSpeed),
          description: getWindDescription(windSpeed)
        },
        {
          name: "Humidity",
          score: calculateHumidityScore(humidity),
          description: getHumidityDescription(humidity)
        }
      ]
    };
  }
  
  // Calculate individual factor scores for current conditions
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
    encouragementMessage,
    factors: factorsList
  };
}
