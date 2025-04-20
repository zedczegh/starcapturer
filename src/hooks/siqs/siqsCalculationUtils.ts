
/**
 * Utility functions for SIQS (Stellar Imaging Quality Score) calculation
 */

/**
 * Calculate SIQS using weather data
 */
export async function calculateSIQSWithWeatherData(
  weatherData: any, 
  bortleScale: number, 
  seeingConditions: number,
  moonPhase: number = 0,
  forecastData?: any
): Promise<{
  score: number;
  isViable: boolean;
  factors: any[];
  level: string;
  nighttimeCloudData?: any;
}> {
  if (!weatherData) {
    console.warn("No weather data provided for SIQS calculation");
    return { score: 0, isViable: false, factors: [], level: 'bad' };
  }
  
  const temperatureScore = 10 - Math.abs(weatherData.temperature - 15) / 5;
  const humidityScore = 10 - weatherData.humidity / 10;
  const windSpeedScore = 10 - weatherData.windSpeed / 5;
  let cloudCoverScore = 10 - weatherData.cloudCover / 10;
  
  let effectiveCloudCover = weatherData.cloudCover;

  // If we have forecast data, attempt to use single hour sampling
  if (forecastData && forecastData.hourly) {
    const hourlyExtractor = require("@/utils/weather/hourlyCloudCoverExtractor");
    const singleHourCloudCover = hourlyExtractor.extractSingleHourCloudCover(forecastData, 1); // Use 1 AM by default
    
    if (singleHourCloudCover !== null) {
      console.log(`Using 1AM cloud cover for SIQS calculation: ${singleHourCloudCover.toFixed(1)}%`);
      effectiveCloudCover = singleHourCloudCover;
    }
  }
  
  cloudCoverScore = 10 - effectiveCloudCover / 10;
  
  const bortleScaleScore = 10 - bortleScale;
  const seeingConditionsScore = 10 - seeingConditions;
  
  let moonPhaseScore = 10;
  if (moonPhase) {
    moonPhaseScore = 10 - moonPhase * 5;
  }
  
  let precipitationScore = 10;
  if (weatherData.precipitation > 0) {
    precipitationScore = 0;
  }
  
  let aqiScore = 10;
  if (weatherData.aqi) {
    aqiScore = 10 - weatherData.aqi / 50;
  }
  
  let clearSkyRateScore = 5;
  if (weatherData.clearSkyRate) {
    clearSkyRateScore = weatherData.clearSkyRate / 20;
  }
  
  const rawScore = (
    temperatureScore +
    humidityScore +
    windSpeedScore +
    cloudCoverScore +
    bortleScaleScore +
    seeingConditionsScore +
    moonPhaseScore +
    precipitationScore +
    aqiScore +
    clearSkyRateScore
  ) / 10;
  
  const score = Math.max(0, Math.min(10, rawScore));
  const isViable = score >= 3.0;
  
  const factors = [
    { name: 'Temperature', score: temperatureScore, description: `Temperature: ${weatherData.temperature}°C` },
    { name: 'Humidity', score: humidityScore, description: `Humidity: ${weatherData.humidity}%` },
    { name: 'Wind Speed', score: windSpeedScore, description: `Wind Speed: ${weatherData.windSpeed} km/h` },
    { name: 'Cloud Cover', score: cloudCoverScore, description: `Cloud Cover: ${effectiveCloudCover}%` },
    { name: 'Bortle Scale', score: bortleScaleScore, description: `Bortle Scale: ${bortleScale}` },
    { name: 'Seeing Conditions', score: seeingConditionsScore, description: `Seeing Conditions: ${seeingConditions}` },
    { name: 'Moon Phase', score: moonPhaseScore, description: `Moon Phase: ${moonPhase}` },
    { name: 'Precipitation', score: precipitationScore, description: `Precipitation: ${weatherData.precipitation} mm` },
    { name: 'Air Quality Index', score: aqiScore, description: `Air Quality Index: ${weatherData.aqi}` },
    { name: 'Clear Sky Rate', score: clearSkyRateScore, description: `Clear Sky Rate: ${weatherData.clearSkyRate}%` }
  ];
  
  let level = 'bad';
  if (score >= 8) level = 'excellent';
  else if (score >= 6) level = 'good';
  else if (score >= 4) level = 'average';
  else if (score >= 2) level = 'poor';
  
  return {
    score,
    isViable,
    factors,
    level,
    nighttimeCloudData: weatherData.nighttimeCloudData || null
  };
}

/**
 * Get the best hour for astronomical viewing based on cloud cover
 */
export function getBestAstronomicalHour(forecastData: any): number | null {
  if (!forecastData || !forecastData.hourly) {
    return null;
  }
  
  try {
    const hourlyData = forecastData.hourly;
    let bestHour = 1; // Default to 1 AM
    let lowestCloudCover = 100;
    
    // Check hours between 10 PM and 4 AM (common dark sky hours)
    for (let hour = 22; hour <= 23; hour++) {
      const hourlyExtractor = require("@/utils/weather/hourlyCloudCoverExtractor");
      const cloudCover = hourlyExtractor.extractSingleHourCloudCover(forecastData, hour);
      if (cloudCover !== null && cloudCover < lowestCloudCover) {
        lowestCloudCover = cloudCover;
        bestHour = hour;
      }
    }
    
    for (let hour = 0; hour <= 4; hour++) {
      const hourlyExtractor = require("@/utils/weather/hourlyCloudCoverExtractor");
      const cloudCover = hourlyExtractor.extractSingleHourCloudCover(forecastData, hour);
      if (cloudCover !== null && cloudCover < lowestCloudCover) {
        lowestCloudCover = cloudCover;
        bestHour = hour;
      }
    }
    
    return bestHour;
  } catch (error) {
    console.warn("Error finding best astronomical hour:", error);
    return 1; // Default to 1 AM
  }
}

/**
 * Normalize a score to ensure it's in the 0-10 range
 */
export function normalizeScore(score: number): number {
  return Math.max(0, Math.min(10, score));
}
