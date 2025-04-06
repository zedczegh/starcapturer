
/**
 * Utilities for SIQS (Sky Index Quality Score) calculations
 */

/**
 * Normalize a score to a specific range
 * @param value Input value to normalize
 * @param minValue Minimum value in original range
 * @param maxValue Maximum value in original range
 * @param targetMin Minimum value in target range (default: 0)
 * @param targetMax Maximum value in target range (default: 100)
 * @returns Normalized value in target range
 */
export function normalizeScore(
  value: number,
  minValue: number = 0,
  maxValue: number = 10,
  targetMin: number = 0,
  targetMax: number = 10
): number {
  // Check for invalid input range
  if (maxValue === minValue) return targetMin;
  
  // Clamp value to input range
  const clampedValue = Math.max(minValue, Math.min(maxValue, value));
  
  // Calculate normalized value
  const normalizedValue = 
    ((clampedValue - minValue) / (maxValue - minValue)) * (targetMax - targetMin) + targetMin;
  
  return normalizedValue;
}

/**
 * Calculate weighted average of scores
 * @param scores Array of score values
 * @param weights Array of weight values (must be same length as scores)
 * @returns Weighted average
 */
export function calculateWeightedAverage(scores: number[], weights: number[]): number {
  // Ensure arrays are the same length
  if (scores.length !== weights.length) {
    throw new Error('Scores and weights arrays must be the same length');
  }
  
  // Calculate weighted sum and total weights
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < scores.length; i++) {
    weightedSum += scores[i] * weights[i];
    totalWeight += weights[i];
  }
  
  // Check for zero total weight
  if (totalWeight === 0) return 0;
  
  // Return weighted average
  return weightedSum / totalWeight;
}

/**
 * Apply a sigmoid curve to a score for better scaling
 * @param value Input value
 * @param midpoint Value at which the function returns 0.5
 * @param steepness Steepness of the sigmoid curve
 * @returns Sigmoid-transformed value between 0 and 1
 */
export function applySigmoidCurve(
  value: number, 
  midpoint: number = 0.5, 
  steepness: number = 10
): number {
  return 1 / (1 + Math.exp(-steepness * (value - midpoint)));
}

/**
 * Calculate a quality score with non-linear penalties
 * @param baseScore Base score (0-100)
 * @param penalties Array of penalty values (0-100)
 * @param weights Array of weights for penalties (must match penalties array length)
 * @returns Final score after applying penalties
 */
export function applyNonLinearPenalties(
  baseScore: number,
  penalties: number[],
  weights: number[]
): number {
  // Ensure arrays are the same length
  if (penalties.length !== weights.length) {
    throw new Error('Penalties and weights arrays must be the same length');
  }
  
  // Start with base score
  let finalScore = baseScore;
  
  // Apply each penalty with its weight
  for (let i = 0; i < penalties.length; i++) {
    // Skip if penalty is zero
    if (penalties[i] === 0) continue;
    
    // Apply non-linear penalty (using a quadratic function for steeper penalties for high values)
    const penaltyFactor = (penalties[i] / 100) * weights[i];
    const nonLinearPenalty = finalScore * penaltyFactor * (penalties[i] / 100);
    finalScore -= nonLinearPenalty;
  }
  
  // Ensure final score is within valid range
  return Math.max(0, Math.min(100, finalScore));
}

/**
 * Convert fractional score (0-10) to integer score with one decimal place (0.0-10.0)
 * @param score Raw score
 * @returns Formatted score
 */
export function formatSiqsScore(score: number): number {
  return parseFloat((Math.max(0, Math.min(10, score))).toFixed(1));
}

/**
 * Format SIQS score for display purposes
 * @param score Raw SIQS score
 * @returns Formatted score string
 */
export function formatSIQSScoreForDisplay(score: number): string {
  return formatSiqsScore(score).toFixed(1);
}

/**
 * Check if the current conditions are good for viewing
 * @param score SIQS score
 * @returns Boolean indicating if conditions are good
 */
export function isGoodViewingCondition(score: number): boolean {
  return score >= 6.0;
}

/**
 * Calculate SIQS with weather data and other factors
 * @param weatherData Weather data object
 * @param bortleScale Bortle scale value
 * @param seeingConditions Seeing conditions value
 * @param moonPhase Moon phase value (0-1)
 * @param forecastData Optional forecast data
 * @returns SIQS calculation result
 */
export async function calculateSIQSWithWeatherData(
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number = 0.5,
  forecastData?: any
): Promise<{ score: number; factors?: any[] }> {
  // Define weights for different factors
  const weights = {
    lightPollution: 0.35,
    cloudCover: 0.25,
    seeing: 0.15,
    moonPhase: 0.10,
    humidity: 0.05,
    wind: 0.05,
    temperature: 0.05,
  };
  
  // Process inputs
  const cloudCover = weatherData.cloudCover || 0;
  const humidity = weatherData.humidity || 50;
  const windSpeed = weatherData.windSpeed || 0;
  
  // Calculate individual scores (0-10 scale)
  const lightPollutionScore = Math.max(0, 10 - bortleScale);
  const cloudScore = Math.max(0, 10 - (cloudCover / 10));
  const seeingScore = Math.min(10, seeingConditions * 2);
  const moonScore = Math.max(0, 10 - (moonPhase * 10));
  const humidityScore = Math.max(0, 10 - (humidity / 10));
  const windScore = Math.max(0, 10 - (windSpeed / 2));
  
  // Combine scores using weighted average
  const combinedScore = (
    lightPollutionScore * weights.lightPollution +
    cloudScore * weights.cloudCover +
    seeingScore * weights.seeing +
    moonScore * weights.moonPhase +
    humidityScore * weights.humidity +
    windScore * weights.wind
  ) / (weights.lightPollution + weights.cloudCover + weights.seeing + 
        weights.moonPhase + weights.humidity + weights.wind);
  
  // Apply any additional adjustments from forecast data
  let finalScore = combinedScore;
  if (forecastData) {
    // Example adjustment based on forecast
    const forecastAdjustment = 0;  // would calculate based on forecast
    finalScore = Math.max(0, Math.min(10, finalScore + forecastAdjustment));
  }
  
  // Round to one decimal place for consistency
  finalScore = Math.round(finalScore * 10) / 10;
  
  // Track factors for analysis
  const factors = [
    { name: "Light Pollution", score: lightPollutionScore, weight: weights.lightPollution },
    { name: "Cloud Cover", score: cloudScore, weight: weights.cloudCover },
    { name: "Seeing Conditions", score: seeingScore, weight: weights.seeing },
    { name: "Moon Phase", score: moonScore, weight: weights.moonPhase },
    { name: "Humidity", score: humidityScore, weight: weights.humidity },
    { name: "Wind", score: windScore, weight: weights.wind }
  ];
  
  return { score: finalScore, factors };
}
