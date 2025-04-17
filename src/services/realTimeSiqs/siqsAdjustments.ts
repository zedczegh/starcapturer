
import { WeatherData } from './siqsTypes';
import { findClimateRegion } from './climateRegions';

/**
 * Apply intelligent adjustments to SIQS based on location and conditions
 * @param baseScore Base SIQS score
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param weatherData Weather data
 * @returns Adjusted SIQS score
 */
export function applyIntelligentAdjustments(
  baseScore: number,
  latitude: number,
  longitude: number,
  weatherData?: WeatherData
): number {
  let adjustedScore = baseScore;
  
  // Apply climate region adjustment
  const climateRegion = findClimateRegion(latitude, longitude);
  if (climateRegion) {
    // Get climate-specific adjustment
    const regionFactor = climateRegion.adjustmentFactors[0] || 1.0;
    adjustedScore *= regionFactor;
  }
  
  // Apply elevation adjustment (if we had elevation data)
  // For now, assume higher SIQS at high latitudes due to darker skies
  const latitudeAbs = Math.abs(latitude);
  if (latitudeAbs > 50) {
    // Polar regions get a bonus for darker skies
    adjustedScore *= 1.1;
  }
  
  // Apply weather condition adjustments
  if (weatherData) {
    // Adjust for extreme temperatures
    if (weatherData.temperature < -20 || weatherData.temperature > 35) {
      adjustedScore *= 0.9; // Penalty for uncomfortable viewing conditions
    }
    
    // Adjust for high wind speed
    if (weatherData.windSpeed && weatherData.windSpeed > 20) {
      adjustedScore *= 0.85; // Significant penalty for high winds
    }
    
    // Adjust for air quality
    if (weatherData.aqi && weatherData.aqi > 100) {
      adjustedScore *= 0.8; // Penalty for poor air quality
    }
  }
  
  // Ensure score stays within valid range
  return Math.max(1, Math.min(10, adjustedScore));
}
