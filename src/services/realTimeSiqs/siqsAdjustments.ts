
import { WeatherDataWithClearSky } from './siqsTypes';

/**
 * Apply intelligent adjustments to SIQS score based on multiple factors
 */
export function applyIntelligentAdjustments(
  baseScore: number,
  weatherData: WeatherDataWithClearSky,
  clearSkyData: any,
  bortleScale: number
): number {
  let score = baseScore;
  
  // Apply clear sky rate adjustment with diminishing returns curve
  if (clearSkyData && typeof clearSkyData.annualRate === 'number') {
    const clearSkyRate = clearSkyData.annualRate;
    // Non-linear adjustment that gives more benefit to very clear locations
    // but diminishing returns after 70%
    let clearSkyFactor = 1.0; // Default - no change
    
    if (clearSkyRate > 80) {
      clearSkyFactor = 1.25; // Exceptional
    } else if (clearSkyRate > 65) {
      clearSkyFactor = 1.15; // Excellent
    } else if (clearSkyRate > 50) {
      clearSkyFactor = 1.1; // Very good
    } else if (clearSkyRate < 30) {
      clearSkyFactor = 0.9; // Poor
    }
    
    score *= clearSkyFactor;
  }
  
  // Adjust for cloud cover with higher sensitivity
  if (typeof weatherData.cloudCover === 'number') {
    const cloudCover = weatherData.cloudCover;
    if (cloudCover < 5) {
      // Exceptional clear sky bonus
      score *= 1.1;
    } else if (cloudCover > 70) {
      // Heavy cloud penalty
      score *= 0.7;
    }
  }
  
  // Adjust for Bortle scale with non-linear impact
  // Dark sky locations get higher boost
  if (bortleScale <= 3) {
    score *= 1.15; // Significant boost for dark sky areas
  }
  
  // High humidity and precipitation penalty
  if (weatherData.humidity && weatherData.humidity > 85) {
    score *= 0.9;
  }
  
  if (weatherData.precipitation && weatherData.precipitation > 0) {
    score *= 0.7; // Active precipitation is a major limiting factor
  }
  
  return score;
}
