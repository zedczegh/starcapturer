/**
 * Intelligent adjustments for SIQS scores based on location
 */
import { getClimateRegion } from './climateRegions';
import { WeatherData } from './siqsTypes';

/**
 * Apply intelligent adjustments to SIQS score based on location and conditions
 * @param baseScore Initial SIQS score
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param weatherData Weather data if available
 * @returns Adjusted SIQS score
 */
export function applyIntelligentAdjustments(
  baseScore: number,
  latitude: number,
  longitude: number,
  weatherData?: WeatherData
): number {
  let adjustedScore = baseScore;
  
  // Get climate region for this location
  const climateRegion = getClimateRegion(latitude, longitude);
  
  // Apply adjustments based on climate region
  if (climateRegion) {
    switch(climateRegion.name) {
      case 'Desert':
        // Desert regions have better transparency
        adjustedScore *= 1.05;
        break;
      case 'Arctic':
        // Arctic regions often have very clear air when weather is good
        if (weatherData?.cloudCover && weatherData.cloudCover < 30) {
          adjustedScore *= 1.1;
        }
        break;
      case 'Tropical':
        // Tropical regions often have higher humidity affecting seeing
        adjustedScore *= 0.95;
        break;
      // Other regions use base score
    }
  }
  
  // Apply adjustments for elevation (estimated by latitude)
  // High elevation locations tend to have better seeing conditions
  const isLikelyHighElevation = 
    (Math.abs(latitude) > 35 && Math.abs(latitude) < 50) || // Mountain ranges
    (longitude > -120 && longitude < -100 && latitude > 35 && latitude < 45); // Rocky Mountains
    
  if (isLikelyHighElevation) {
    adjustedScore *= 1.05;
  }
  
  // Ensure score stays within 0-10 range
  return Math.min(10, Math.max(0, adjustedScore));
}
