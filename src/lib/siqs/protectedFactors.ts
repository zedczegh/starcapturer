
/**
 * Protected SIQS factors implementation with validation
 * This file adds safety checks to prevent accidental modifications
 * to the core SIQS algorithm which is critical for accurate sky quality measurements
 */

import { 
  calculateCloudScore,
  calculateLightPollutionScore,
  calculateSeeingScore,
  calculateWindScore, 
  calculateHumidityScore,
  calculateMoonScore,
  calculateAQIScore,
  calculateClearSkyScore,
  normalizeScore
} from './factors';

// Core weights for SIQS calculation - these are scientifically calibrated
// WARNING: Changing these values will affect the accuracy of the entire system
const PROTECTED_WEIGHTS = Object.freeze({
  cloud: 0.27,
  lightPollution: 0.18,
  seeing: 0.14, 
  wind: 0.09,
  humidity: 0.09,
  moon: 0.05,
  aqi: 0.08,
  clearSky: 0.10
});

// Validation to ensure weights sum to 1.0
const WEIGHT_SUM = Object.values(PROTECTED_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
if (Math.abs(WEIGHT_SUM - 1.0) > 0.001) {
  console.error(`SIQS algorithm integrity error: weights do not sum to 1.0 (${WEIGHT_SUM.toFixed(3)})`);
}

// Protected versions of the factor calculation functions
export const protectedFactors = {
  // Read-only access to the core weights
  getWeights: () => ({ ...PROTECTED_WEIGHTS }),
  
  // Protected factor calculation functions that validate inputs
  calculateCloudScore: (cloudCover: number): number => {
    if (typeof cloudCover !== 'number' || cloudCover < 0 || cloudCover > 100) {
      console.warn(`Invalid cloud cover value: ${cloudCover}, using fallback`);
      return calculateCloudScore(50); // Fallback to midpoint
    }
    return calculateCloudScore(cloudCover);
  },
  
  calculateLightPollutionScore: (bortleScale: number): number => {
    if (typeof bortleScale !== 'number' || bortleScale < 1 || bortleScale > 9) {
      console.warn(`Invalid Bortle scale value: ${bortleScale}, using fallback`);
      return calculateLightPollutionScore(5); // Fallback to midpoint
    }
    return calculateLightPollutionScore(bortleScale);
  },
  
  calculateSeeingScore: (seeingConditions: number): number => {
    if (typeof seeingConditions !== 'number' || seeingConditions < 1 || seeingConditions > 5) {
      console.warn(`Invalid seeing conditions value: ${seeingConditions}, using fallback`);
      return calculateSeeingScore(3); // Fallback to midpoint
    }
    return calculateSeeingScore(seeingConditions);
  },
  
  calculateWindScore: (windSpeed: number): number => {
    if (typeof windSpeed !== 'number' || windSpeed < 0) {
      console.warn(`Invalid wind speed value: ${windSpeed}, using fallback`);
      return calculateWindScore(10); // Fallback to moderate wind
    }
    return calculateWindScore(windSpeed);
  },
  
  calculateHumidityScore: (humidity: number): number => {
    if (typeof humidity !== 'number' || humidity < 0 || humidity > 100) {
      console.warn(`Invalid humidity value: ${humidity}, using fallback`);
      return calculateHumidityScore(50); // Fallback to midpoint
    }
    return calculateHumidityScore(humidity);
  },
  
  calculateMoonScore: (moonPhase: number): number => {
    if (typeof moonPhase !== 'number' || moonPhase < 0 || moonPhase > 1) {
      console.warn(`Invalid moon phase value: ${moonPhase}, using fallback`);
      return calculateMoonScore(0.5); // Fallback to half moon
    }
    return calculateMoonScore(moonPhase);
  },
  
  calculateAQIScore: (aqi: number): number => {
    if (typeof aqi !== 'number' || aqi < 0) {
      console.warn(`Invalid AQI value: ${aqi}, using fallback`);
      return calculateAQIScore(50); // Fallback to moderate AQI
    }
    return calculateAQIScore(aqi);
  },
  
  calculateClearSkyScore: (clearSkyRate: number): number => {
    if (typeof clearSkyRate !== 'number' || clearSkyRate < 0 || clearSkyRate > 100) {
      console.warn(`Invalid clear sky rate: ${clearSkyRate}, using fallback`);
      return calculateClearSkyScore(50); // Fallback to midpoint
    }
    return calculateClearSkyScore(clearSkyRate);
  },
  
  normalizeScore
};

/**
 * Calculates weighted SIQS score based on individual factor scores
 * with built-in validation to ensure algorithm integrity
 */
export function calculateWeightedScore(factorScores: Record<string, number>): number {
  // Validate that all required factors are present
  const requiredFactors = [
    'cloud', 'lightPollution', 'seeing', 
    'wind', 'humidity', 'moon', 'aqi'
  ];
  
  const missingFactors = requiredFactors.filter(factor => 
    factorScores[factor] === undefined || 
    typeof factorScores[factor] !== 'number'
  );
  
  if (missingFactors.length > 0) {
    console.warn(`Missing required factors: ${missingFactors.join(', ')}, using default values`);
    // Apply default values for missing factors
    missingFactors.forEach(factor => {
      factorScores[factor] = 50; // Use middle value as fallback
    });
  }
  
  // Calculate weighted sum
  let weightedSum = 0;
  let totalWeight = 0;
  
  Object.entries(PROTECTED_WEIGHTS).forEach(([factor, weight]) => {
    const score = factorScores[factor];
    if (typeof score === 'number') {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  });
  
  // Adjust if some weights were skipped
  if (totalWeight > 0 && totalWeight < 1) {
    weightedSum = weightedSum / totalWeight;
  }
  
  // Convert to 0-10 scale
  return normalizeScore(weightedSum / 10);
}
