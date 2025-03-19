
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
  
  // If we have no nighttime forecast and it's currently daytime, we'll still
  // use current conditions but apply a more optimistic approach
  const now = new Date();
  const isCurrentlyNightTime = isNightTime(now);
  
  // Check if current conditions make imaging impossible
  // But ONLY if it's nighttime AND we don't have a future forecast
  let currentlyImpossible = false;
  if (isCurrentlyNightTime && 
      isImagingImpossible(cloudCover, precipitation, weatherCondition, aqi) && 
      tonightForecast.length === 0) {
    currentlyImpossible = true;
  }
  
  // If we have forecast data for tonight, use that instead of current conditions
  // This is more relevant for users planning to observe later
  if (tonightForecast.length > 0) {
    // Check if tonight's forecast shows any viable observing windows
    const viablePeriods = tonightForecast.filter(item => 
      !isImagingImpossible(item.cloudCover, item.precipitation, item.weatherCondition, item.aqi)
    );
    
    // If there are viable periods tonight, use those for calculation
    if (viablePeriods.length > 0) {
      // Calculate average values from viable periods
      const avgCloudCover = viablePeriods.reduce((sum, item) => sum + item.cloudCover, 0) / viablePeriods.length;
      const avgWindSpeed = viablePeriods.reduce((sum, item) => sum + item.windSpeed, 0) / viablePeriods.length;
      const avgHumidity = viablePeriods.reduce((sum, item) => sum + item.humidity, 0) / viablePeriods.length;
      
      // Calculate individual factor scores (0-100 scale) using tonight's data
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
      
      // Calculate weighted score based on tonight's forecast
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
      
      return {
        score: finalScore,
        isViable,
        factors: factorsList
      };
    }
  }
  
  // If current conditions make imaging impossible and we don't have viable forecast periods,
  // return a zero score
  if (currentlyImpossible) {
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
  
  // Prioritize tonight's forecast if available, otherwise use current conditions
  // with optimistic adjustments if it's daytime
  const actualCloudCover = tonightForecast.length > 0 
    ? tonightForecast.reduce((sum, item) => sum + item.cloudCover, 0) / tonightForecast.length
    : isCurrentlyNightTime ? cloudCover : Math.min(cloudCover, 40); // Be more optimistic during day
    
  const actualWindSpeed = tonightForecast.length > 0
    ? tonightForecast.reduce((sum, item) => sum + item.windSpeed, 0) / tonightForecast.length
    : windSpeed;
    
  const actualHumidity = tonightForecast.length > 0
    ? tonightForecast.reduce((sum, item) => sum + item.humidity, 0) / tonightForecast.length
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
  
  // Create factors array for the result
  const factorsList: FactorData[] = [
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
    factorsList.push({
      name: "Air Quality",
      score: aqiScore,
      description: getAQIDescription(aqi)
    });
  }
  
  return {
    score: finalScore,
    isViable,
    factors: factorsList
  };
}
