
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
export type { SIQSFactors, SIQSFactor, SIQSResult } from './siqs/types';
export { siqsToColor } from './siqs/utils';

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
  
  // Check if conditions make imaging impossible first (fast path)
  if (isImagingImpossible(cloudCover, precipitation, weatherCondition, aqi)) {
    return {
      score: 0,
      isViable: false,
      factors: [
        {
          name: "Weather Conditions",
          score: 0,
          description: "Current conditions make imaging impossible"
        }
      ]
    };
  }
  
  // Use night forecast if available, otherwise use current conditions
  const actualCloudCover = nightForecast.length > 0 
    ? nightForecast.reduce((sum, item) => sum + item.cloudCover, 0) / nightForecast.length
    : cloudCover;
    
  const actualWindSpeed = nightForecast.length > 0
    ? nightForecast.reduce((sum, item) => sum + item.windSpeed, 0) / nightForecast.length
    : windSpeed;
    
  const actualHumidity = nightForecast.length > 0
    ? nightForecast.reduce((sum, item) => sum + item.humidity, 0) / nightForecast.length
    : humidity;
    
  // Calculate individual factor scores (0-100 scale)
  const cloudScore = calculateCloudScore(actualCloudCover);
  const lightPollutionScore = calculateLightPollutionScore(bortleScale);
  const seeingScore = calculateSeeingScore(seeingConditions);
  const windScore = calculateWindScore(actualWindSpeed);
  const humidityScore = calculateHumidityScore(actualHumidity);
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
  
  // Create factors array
  const factors = [
    {
      name: "Cloud Cover",
      score: cloudScore,
      description: getCloudDescription(actualCloudCover)
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
      description: getWindDescription(actualWindSpeed)
    },
    {
      name: "Humidity",
      score: humidityScore,
      description: getHumidityDescription(actualHumidity)
    }
  ];
  
  // Add AQI factor if available
  if (aqi !== undefined) {
    factors.push({
      name: "Air Quality",
      score: aqiScore,
      description: getAQIDescription(aqi)
    });
  }
  
  return {
    score: finalScore,
    isViable,
    factors
  };
}
