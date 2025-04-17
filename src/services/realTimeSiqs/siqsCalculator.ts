
/**
 * Core SIQS calculation logic
 */

import { SiqsResult, WeatherDataWithClearSky, SiqsCalculationOptions, SiqsFactor } from './siqsTypes';
import { applyIntelligentAdjustments } from './siqsAdjustments';
import { findClimateRegion, getClimateAdjustmentFactor } from './climateRegions';

/**
 * Calculate basic SIQS score based on Bortle scale and weather
 * This is a simplified version of the algorithm
 */
export function calculateSiqsScore(
  bortleScale: number, 
  weatherData: WeatherDataWithClearSky,
  options: SiqsCalculationOptions = {}
): SiqsResult {
  // Validate inputs
  const validBortle = Math.max(1, Math.min(9, bortleScale));
  
  // Base score inversely related to Bortle scale (1-9)
  // Bortle 1 = best (9 points), Bortle 9 = worst (1 point)
  const bortleBase = 10 - validBortle;
  
  // Clear sky factor (0-1)
  const clearSkyFactor = Math.min(1, Math.max(0, weatherData.clearSky / 100));
  
  // Weather factors
  const tempFactor = getTemperatureFactor(weatherData.temperature);
  const humidityFactor = getHumidityFactor(weatherData.humidity);
  const windFactor = getWindFactor(weatherData.windSpeed || 0);
  
  // Calculate factors
  const factors: SiqsFactor[] = [];
  
  // Light pollution factor (40% weight)
  const lightPollutionScore = bortleBase;
  factors.push({
    name: 'Light Pollution',
    score: lightPollutionScore,
    description: `Bortle scale ${validBortle}/9`,
    value: validBortle
  });
  
  // Cloud cover factor (30% weight)
  const cloudCoverScore = clearSkyFactor * 10;
  factors.push({
    name: 'Cloud Cover',
    score: cloudCoverScore,
    description: `${100 - (weatherData.cloudCover || 0)}% clear`,
    value: weatherData.cloudCover
  });
  
  // Humidity factor (10% weight)
  const humidityScore = humidityFactor * 10;
  factors.push({
    name: 'Humidity',
    score: humidityScore,
    description: `${weatherData.humidity}% relative humidity`,
    value: weatherData.humidity
  });
  
  // Wind factor (10% weight)
  const windScore = windFactor * 10;
  factors.push({
    name: 'Wind',
    score: windScore,
    description: `${weatherData.windSpeed || 0} km/h`,
    value: weatherData.windSpeed
  });
  
  // Temperature factor (10% weight)
  const temperatureScore = tempFactor * 10;
  factors.push({
    name: 'Temperature',
    score: temperatureScore,
    description: `${weatherData.temperature}°C`,
    value: weatherData.temperature
  });
  
  // Calculate composite score with proper weighting
  let compositeScore = 
    (lightPollutionScore * 0.4) +
    (cloudCoverScore * 0.3) +
    (humidityScore * 0.1) +
    (windScore * 0.1) +
    (temperatureScore * 0.1);
  
  // Air quality adjustment if available
  if (weatherData.aqi !== undefined) {
    const aqiFactor = getAqiFactor(weatherData.aqi);
    compositeScore *= aqiFactor;
    
    factors.push({
      name: 'Air Quality',
      score: aqiFactor * 10,
      description: `AQI: ${weatherData.aqi}`,
      value: weatherData.aqi
    });
  }
  
  // Round to one decimal place
  compositeScore = Math.round(compositeScore * 10) / 10;
  
  // Determine if conditions are viable for astronomy
  // Generally, SIQS >= 5.0 is considered viable
  const isViable = compositeScore >= 5.0;
  
  // Create the final result
  const result: SiqsResult = {
    siqs: compositeScore,
    score: compositeScore, // Set both for compatibility
    isViable,
    factors: options.includeFactors ? factors : undefined
  };
  
  // Add metadata if requested
  if (options.includeMetadata) {
    result.metadata = {
      timestamp: new Date().toISOString(),
      bortleScale: validBortle,
      weatherSnapshot: { ...weatherData }
    };
  }
  
  return result;
}

/**
 * Get temperature factor (0-1)
 * Optimal temperatures are between 5°C and 25°C
 */
function getTemperatureFactor(temperature: number): number {
  if (temperature >= 5 && temperature <= 25) {
    return 1.0; // Optimal range
  }
  
  if (temperature < -10 || temperature > 35) {
    return 0.6; // Poor conditions
  }
  
  if (temperature < 0 || temperature > 30) {
    return 0.8; // Below average conditions
  }
  
  return 0.9; // Slight impact
}

/**
 * Get humidity factor (0-1)
 * Lower humidity is better for astronomy
 */
function getHumidityFactor(humidity: number): number {
  if (humidity <= 40) {
    return 1.0; // Excellent
  }
  
  if (humidity >= 90) {
    return 0.5; // Poor
  }
  
  // Linear scale between 40% and 90%
  return 1.0 - ((humidity - 40) / 100);
}

/**
 * Get wind factor (0-1)
 * Moderate wind is OK, strong wind is bad for astronomy
 */
function getWindFactor(windSpeed: number): number {
  if (windSpeed <= 10) {
    return 1.0; // Excellent
  }
  
  if (windSpeed >= 30) {
    return 0.4; // Poor
  }
  
  // Linear scale between 10km/h and 30km/h
  return 1.0 - ((windSpeed - 10) / 40);
}

/**
 * Get air quality factor (0-1)
 * Lower AQI is better for astronomy
 */
function getAqiFactor(aqi: number): number {
  if (aqi <= 50) {
    return 1.0; // Excellent
  }
  
  if (aqi >= 200) {
    return 0.6; // Poor
  }
  
  // Linear scale between 50 and 200
  return 1.0 - ((aqi - 50) / 375);
}
