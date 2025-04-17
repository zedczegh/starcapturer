
/**
 * SIQS score evaluators for different weather parameters
 */
import { WeatherDataWithClearSky } from './siqsTypes';

/**
 * Evaluate cloud cover impact on SIQS (0-10 scale)
 * Lower cloud cover = better score
 */
export function evaluateCloudCover(cloudCover: number): number {
  // Invert and scale: 0% cloud = 10, 100% cloud = 0
  if (cloudCover >= 100) return 0;
  if (cloudCover <= 0) return 10;
  
  // Non-linear scaling to penalize high cloud cover more
  return 10 * Math.pow((100 - cloudCover) / 100, 1.5);
}

/**
 * Evaluate humidity impact on SIQS (0-10 scale)
 * Lower humidity = better score (generally)
 */
export function evaluateHumidity(humidity: number): number {
  // Extremely low humidity can cause atmospheric distortion
  if (humidity < 15) return 7.5; 
  
  // Very high humidity reduces transparency
  if (humidity > 95) return 2.5;
  if (humidity > 85) return 4;
  if (humidity > 75) return 5.5;
  
  // Optimal range: 30-50%
  if (humidity >= 30 && humidity <= 50) return 9.5;
  
  // Decent range: 15-30% or 50-75%
  return 8 - ((humidity - 40) * (humidity - 40)) / 200;
}

/**
 * Evaluate temperature impact on SIQS (0-10 scale)
 * Temperature affects seeing conditions
 */
export function evaluateTemperature(temperature: number): number {
  // Very cold temperatures are generally good for seeing
  if (temperature < -20) return 9;
  
  // Extreme heat causes thermal turbulence
  if (temperature > 35) return 4;
  
  // Rapidly changing temperatures (around sunset) are problematic
  // We don't have data on temperature change rate here
  
  // Optimal range: -5 to 10°C
  if (temperature >= -5 && temperature <= 10) return 9;
  
  // Calculate score based on distance from optimal range
  const distanceFromOptimal = Math.min(
    Math.abs(temperature - (-5)),
    Math.abs(temperature - 10)
  );
  
  return Math.max(4, 9 - distanceFromOptimal / 5);
}

/**
 * Evaluate wind speed impact on SIQS (0-10 scale)
 */
export function evaluateWindSpeed(windSpeed: number): number {
  // No wind can allow heat to build up
  if (windSpeed < 1) return 7;
  
  // Light breeze is optimal (1-5 km/h)
  if (windSpeed <= 5) return 10;
  
  // Moderate wind still good (5-15 km/h)
  if (windSpeed <= 15) return 8.5;
  
  // Stronger wind affects stability (15-25 km/h)
  if (windSpeed <= 25) return 7;
  
  // High wind severely impacts viewing (25-40 km/h)
  if (windSpeed <= 40) return 4;
  
  // Very strong wind makes viewing difficult (>40 km/h)
  return 2;
}
