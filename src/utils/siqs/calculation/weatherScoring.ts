
/**
 * Specialized functions for scoring weather parameters for SIQS calculation
 */

/**
 * Calculate temperature score - ideal temp is around 15°C
 */
export function calculateTemperatureScore(temperature: number): number {
  // Assume 15°C is ideal, and score decreases as temp deviates
  return 10 - Math.min(10, Math.abs(temperature - 15) / 2);
}

/**
 * Calculate humidity score - lower humidity is better
 */
export function calculateHumidityScore(humidity: number): number {
  // Lower humidity is better for viewing
  return 10 - (humidity / 10);
}

/**
 * Calculate wind score - lower wind is better
 */
export function calculateWindScore(windSpeed: number): number {
  // Lower wind is better for viewing stability
  if (windSpeed < 5) return 10;
  if (windSpeed < 10) return 8;
  if (windSpeed < 15) return 6;
  if (windSpeed < 20) return 4;
  if (windSpeed < 30) return 2;
  return 0;
}

/**
 * Calculate cloud cover score
 */
export function calculateCloudCoverScore(cloudCover: number): number {
  return 10 - cloudCover / 10;
}

/**
 * Calculate precipitation score
 */
export function calculatePrecipitationScore(precipitation: number): number {
  return precipitation > 0 ? 0 : 10;
}

/**
 * Calculate bortle scale score
 */
export function calculateBortleScaleScore(bortleScale: number): number {
  return Math.max(0, 10 - bortleScale * 0.9);
}

/**
 * Calculate weighted score from factor components
 */
export function calculateWeightedScore(factors: { [key: string]: { score: number; weight: number } }): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const key in factors) {
    const factor = factors[key];
    weightedSum += factor.score * factor.weight;
    totalWeight += factor.weight;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
