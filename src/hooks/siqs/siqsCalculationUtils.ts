
/**
 * Format SIQS score for consistent display across the application
 * @param score SIQS score to format
 * @returns Formatted SIQS score as string with one decimal place
 */
export function formatSIQSScoreForDisplay(score: number | undefined | null): string {
  if (score === undefined || score === null || isNaN(score)) {
    return '0.0';
  }
  
  // Ensure score is between 0 and 10
  const validScore = Math.max(0, Math.min(10, score));
  
  // Format with one decimal place
  return validScore.toFixed(1);
}

/**
 * Get CSS color class based on SIQS score
 * @param score SIQS score
 * @returns Tailwind CSS class for appropriate color
 */
export function getSIQSColorClass(score: number | undefined | null): string {
  if (score === undefined || score === null || isNaN(score)) {
    return 'bg-red-500/80 border-red-400/50';
  }
  
  if (score >= 8) return 'bg-green-500/80 border-green-400/50';
  if (score >= 6) return 'bg-lime-500/80 border-lime-400/50';
  if (score >= 4) return 'bg-yellow-500/80 border-yellow-400/50';
  if (score >= 2) return 'bg-orange-500/80 border-orange-400/50';
  return 'bg-red-500/80 border-red-400/50';
}

/**
 * Get the appropriate text color for SIQS score
 * @param score SIQS score
 * @returns Tailwind CSS text color class
 */
export function getSIQSTextColorClass(score: number | undefined | null): string {
  if (score === undefined || score === null || isNaN(score)) {
    return 'text-red-400';
  }
  
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-lime-400';
  if (score >= 4) return 'text-yellow-400';
  if (score >= 2) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Check if SIQS score indicates viable conditions for astrophotography
 * @param score SIQS score
 * @param threshold Minimum viable score (default: 5.0)
 * @returns Boolean indicating if conditions are viable
 */
export function isSIQSViable(score: number | undefined | null, threshold = 5.0): boolean {
  if (score === undefined || score === null || isNaN(score)) {
    return false;
  }
  
  return score >= threshold;
}

/**
 * Check if conditions are good for viewing/photography based on SIQS score
 * @param score SIQS score 
 * @param threshold Minimum good condition score (default: 7.0)
 * @returns Boolean indicating if conditions are good
 */
export function isGoodViewingCondition(score: number | undefined | null, threshold = 7.0): boolean {
  if (score === undefined || score === null || isNaN(score)) {
    return false;
  }
  
  return score >= threshold;
}

/**
 * Normalize SIQS score to ensure it's within 0-10 range
 * @param score Raw SIQS score
 * @returns Normalized score between 0 and 10
 */
export function normalizeScore(score: number): number {
  if (isNaN(score)) return 0;
  return Math.max(0, Math.min(10, score));
}

/**
 * Calculate SIQS score with weather data
 * @param weatherData Weather data for location
 * @param bortleScale Bortle scale value for location
 * @param seeingConditions Seeing conditions value
 * @param moonPhase Moon phase value
 * @param forecastData Optional forecast data for nighttime calculation
 * @returns SIQS calculation result with score and factors
 */
export const calculateSIQSWithWeatherData = async (
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData?: any
): Promise<{ score: number; factors: any[] }> => {
  // Get cloud cover from weather data
  const cloudCover = weatherData?.cloudcover || weatherData?.cloudCover || 50;
  
  // Calculate base SIQS from cloud cover
  let siqsScore = Math.max(0, 10 - (cloudCover / 10));
  
  // Adjust for Bortle scale
  const bortleAdjustment = Math.max(0, 9 - bortleScale) / 9 * 3;
  siqsScore = Math.min(10, siqsScore + bortleAdjustment);
  
  // Adjust for moon phase (0 = new moon, 1 = full moon)
  const moonAdjustment = (1 - moonPhase) * 2;
  siqsScore = Math.min(10, siqsScore + moonAdjustment);
  
  // Create factors array for detailed breakdown
  const factors = [
    {
      name: "Cloud Cover",
      score: Math.max(0, 10 - (cloudCover / 10)),
      value: cloudCover
    },
    {
      name: "Light Pollution",
      score: bortleAdjustment,
      value: bortleScale
    },
    {
      name: "Moon Phase",
      score: moonAdjustment,
      value: moonPhase
    }
  ];
  
  // Normalize final score
  const normalizedScore = Math.max(0, Math.min(10, siqsScore));
  
  return {
    score: normalizedScore,
    factors
  };
};
