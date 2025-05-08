
/**
 * Helper functions for safely working with SIQS values that might be numbers or objects
 */

import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Get numeric SIQS score from any SIQS format (number or object)
 * @param siqs SIQS value which could be a number or object
 * @returns number value of SIQS or 0 if undefined
 */
export function getSiqsScore(siqs?: number | string | { score: number; isViable: boolean } | any): number {
  if (siqs === undefined || siqs === null) {
    return 0;
  }
  
  // Handle string values (parsing to number)
  if (typeof siqs === 'string') {
    const parsed = parseFloat(siqs);
    return isNaN(parsed) ? 0 : normalizeToSiqsScale(parsed);
  }
  
  // Handle numeric values directly
  if (typeof siqs === 'number') {
    return isNaN(siqs) ? 0 : normalizeToSiqsScale(siqs);
  }
  
  // Handle SharedAstroSpot object with siqs property
  if (typeof siqs === 'object' && siqs !== null) {
    // Case: location.siqs passed directly as an object with score property
    if ('siqs' in siqs && typeof siqs.siqs !== 'undefined') {
      return getSiqsScore(siqs.siqs);
    }
    
    // Case: { score: number } object
    if ('score' in siqs && typeof siqs.score === 'number') {
      return isNaN(siqs.score) ? 0 : normalizeToSiqsScale(siqs.score);
    }
  }
  
  // Default to 0 if no valid score found
  return 0;
}

/**
 * Normalize a score to ensure it's in the 0-10 range
 * Enhanced with more accurate handling of scale conversion
 */
export function normalizeToSiqsScale(score: number): number {
  // Handle NaN
  if (isNaN(score)) return 0;
  
  // If score is already in 0-10 range, return as is
  if (score >= 0 && score <= 10) {
    return score;
  }
  
  // If score is on 0-100 scale, normalize to 0-10
  if (score > 10 && score <= 100) {
    return score / 10;
  }
  
  // Cap values outside of accepted ranges
  if (score > 100) return 10;
  if (score < 0) return 0;
  
  return score;
}

/**
 * Format SIQS score for display
 * @param score SIQS score
 * @returns Formatted string representation with one decimal place or "N/A"
 */
export function formatSiqsForDisplay(score: number | null): string {
  if (score === null || score <= 0) {
    return "N/A";
  }
  
  // Ensure score is normalized to 0-10 scale and format with one decimal place
  const normalizedScore = normalizeToSiqsScale(score);
  return normalizedScore.toFixed(1);
}

/**
 * Get formatted SIQS score from any SIQS format
 * @param siqs SIQS value which could be a number or object
 * @returns Formatted string representation
 */
export function formatSiqsScore(siqs?: number | { score: number; isViable: boolean } | any): string {
  const score = getSiqsScore(siqs);
  return formatSiqsForDisplay(score);
}

/**
 * Compare if a SIQS value is at least a certain threshold
 * @param siqs SIQS value which could be a number or object
 * @param threshold Minimum threshold to compare against
 * @returns true if the SIQS is at least the threshold
 */
export function isSiqsAtLeast(siqs: number | any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score >= threshold;
}

/**
 * Compare if a SIQS value is greater than a certain threshold
 * @param siqs SIQS value which could be a number or object
 * @param threshold Threshold to compare against
 * @returns true if the SIQS is greater than the threshold
 */
export function isSiqsGreaterThan(siqs: number | any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score > threshold;
}

/**
 * Sort locations by SIQS score (highest first)
 * Improved to handle historical data and weighted algorithms
 * @param locations Array of locations to sort
 * @returns Sorted array of locations
 */
export function sortLocationsBySiqs(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    const aRealTime = (a as any).realTimeSiqs;
    const bRealTime = (b as any).realTimeSiqs;
    
    // Enhanced prioritization of real-time data with historical trends
    const aSiqs = typeof aRealTime === "number" && aRealTime > 0
      ? aRealTime
      : getSiqsScore(a.siqs);
      
    const bSiqs = typeof bRealTime === "number" && bRealTime > 0
      ? bRealTime
      : getSiqsScore(b.siqs);
    
    // Handle edge cases where SIQS values might be zero
    const finalA = aSiqs || 0;
    const finalB = bSiqs || 0;
      
    return finalB - finalA;
  });
}

/**
 * Get SIQS score with historical weather pattern adjustments
 * Improves accuracy by integrating historical data
 * @param siqs Base SIQS value
 * @param location Location data with historical info
 * @returns Adjusted SIQS score
 */
export function getSiqsWithHistoricalData(
  siqs: number, 
  location?: { 
    latitude: number; 
    longitude: number; 
    historicalClearDays?: number;
    seasonalVariation?: Record<string, number>;
  }
): number {
  // Default to input SIQS if no location data provided
  if (!location || !location.latitude || !location.longitude) {
    return siqs;
  }

  let adjustedSiqs = siqs;
  const currentMonth = new Date().getMonth();
  const currentSeason = getSeason(currentMonth, location.latitude >= 0);
  
  // Apply seasonal adjustment if available
  if (location.seasonalVariation && location.seasonalVariation[currentSeason]) {
    const seasonFactor = location.seasonalVariation[currentSeason] / 100;
    adjustedSiqs *= Math.max(0.8, Math.min(1.2, seasonFactor));
  }
  
  // Apply historical clear days adjustment if available
  if (location.historicalClearDays) {
    const clearDaysAdjustment = getHistoricalClearDaysAdjustment(location.historicalClearDays);
    adjustedSiqs = Math.min(10, adjustedSiqs * clearDaysAdjustment);
  }
  
  return normalizeToSiqsScale(adjustedSiqs);
}

/**
 * Get current season based on month and hemisphere
 * @param month Month (0-11)
 * @param isNorthernHemisphere True if in northern hemisphere
 * @returns Season name
 */
function getSeason(month: number, isNorthernHemisphere: boolean): string {
  // Month is 0-indexed (0: January, 11: December)
  if (isNorthernHemisphere) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  } else {
    // Southern hemisphere seasons are reversed
    if (month >= 2 && month <= 4) return 'fall';
    if (month >= 5 && month <= 7) return 'winter';
    if (month >= 8 && month <= 10) return 'spring';
    return 'summer';
  }
}

/**
 * Calculate adjustment factor based on historical clear days data
 * @param clearDays Annual number of clear days
 * @returns Adjustment factor for SIQS
 */
function getHistoricalClearDaysAdjustment(clearDays: number): number {
  if (clearDays >= 200) return 1.2; // Excellent locations
  if (clearDays >= 150) return 1.15; // Very good locations
  if (clearDays >= 100) return 1.1; // Good locations
  if (clearDays >= 60) return 1.0; // Average locations
  if (clearDays >= 30) return 0.9; // Below average
  return 0.8; // Poor locations
}
