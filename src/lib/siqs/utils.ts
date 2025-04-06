
/**
 * Utility functions for the SIQS (Stellar Imaging Quality Score) system
 */
import { SIQSResult, SIQSFactor } from './types';

/**
 * Format a SIQS score with appropriate precision and display format
 * @param score Raw SIQS score (0-10 scale)
 * @returns Formatted score string
 */
export function formatSIQSScore(score: number | null): string {
  if (score === null || score === undefined || isNaN(score)) {
    return '—';
  }
  
  // Round to 1 decimal place
  const roundedScore = Math.round(score * 10) / 10;
  
  // Format with fixed decimal place
  return roundedScore.toFixed(1);
}

/**
 * Normalize a score to a standard 0-100 scale
 * @param score Raw score value
 * @param min Minimum possible score
 * @param max Maximum possible score
 * @param invert Whether to invert the scale (lower input = higher score)
 * @returns Normalized score on 0-100 scale
 */
export function normalizeScore(
  score: number, 
  min: number, 
  max: number, 
  invert: boolean = false
): number {
  // Ensure score is within bounds
  const boundedScore = Math.max(min, Math.min(max, score));
  
  // Calculate normalized value on 0-100 scale
  const normalized = ((boundedScore - min) / (max - min)) * 100;
  
  // Return inverted or normal score
  return invert ? 100 - normalized : normalized;
}

/**
 * Get the descriptive quality level based on SIQS score
 * @param score SIQS score (0-10 scale)
 * @returns Quality level description
 */
export function getSIQSLevel(score: number | null): string {
  if (score === null || score === undefined || isNaN(score)) {
    return 'Unknown';
  }
  
  if (score >= 9.0) return 'Outstanding';
  if (score >= 8.0) return 'Excellent';
  if (score >= 7.0) return 'Very Good';
  if (score >= 6.0) return 'Good';
  if (score >= 5.0) return 'Above Average';
  if (score >= 4.0) return 'Average';
  if (score >= 3.0) return 'Fair';
  if (score >= 2.0) return 'Poor';
  
  return 'Very Poor';
}

/**
 * Get color class for a SIQS score
 * @param score SIQS score (0-10 scale)
 * @returns Tailwind CSS color class
 */
export function getSIQSColorClass(score: number | null): string {
  if (score === null || score === undefined || isNaN(score)) {
    return 'text-gray-400';
  }
  
  if (score >= 9.0) return 'text-indigo-500';
  if (score >= 8.0) return 'text-blue-500';
  if (score >= 7.0) return 'text-teal-500';
  if (score >= 6.0) return 'text-green-500';
  if (score >= 5.0) return 'text-lime-500';
  if (score >= 4.0) return 'text-amber-500';
  if (score >= 3.0) return 'text-orange-500';
  if (score >= 2.0) return 'text-rose-500';
  
  return 'text-red-600';
}

/**
 * Get color hex value for a SIQS score (for non-Tailwind contexts)
 * @param score SIQS score (0-10 scale)
 * @returns Hex color string
 */
export function siqsToColor(score: number | null): string {
  if (score === null || score === undefined || isNaN(score)) {
    return '#9CA3AF'; // gray-400
  }
  
  if (score >= 9.0) return '#6366F1'; // indigo-500
  if (score >= 8.0) return '#3B82F6'; // blue-500
  if (score >= 7.0) return '#14B8A6'; // teal-500
  if (score >= 6.0) return '#22C55E'; // green-500
  if (score >= 5.0) return '#84CC16'; // lime-500
  if (score >= 4.0) return '#F59E0B'; // amber-500
  if (score >= 3.0) return '#F97316'; // orange-500
  if (score >= 2.0) return '#F43F5E'; // rose-500
  
  return '#DC2626'; // red-600
}

/**
 * Sort SIQS factors to ensure consistent order
 * @param factors Array of SIQS factors
 * @returns Sorted array of factors
 */
export function sortSIQSFactors(factors: SIQSFactor[]): SIQSFactor[] {
  const factorOrder: Record<string, number> = {
    'Light Pollution': 1,
    'Cloud Cover': 2,
    'Seeing Conditions': 3,
    'Wind': 4,
    'Humidity': 5,
    'Moonlight': 6,
    'Air Quality': 7,
    'Clear Sky Rate': 8,
    'Elevation': 9
  };
  
  return [...factors].sort((a, b) => {
    const orderA = factorOrder[a.name] || 99;
    const orderB = factorOrder[b.name] || 99;
    return orderA - orderB;
  });
}

/**
 * Create a summary of SIQS result with key factors
 * @param siqsResult SIQS calculation result
 * @returns Summary string with score and key factors
 */
export function createSIQSSummary(siqsResult: SIQSResult): string {
  const score = formatSIQSScore(siqsResult.score);
  const level = getSIQSLevel(siqsResult.score);
  
  // Get top positive and negative factors
  const sortedFactors = [...siqsResult.factors].sort((a, b) => b.score - a.score);
  const topPositive = sortedFactors[0];
  const topNegative = sortedFactors[sortedFactors.length - 1];
  
  let summary = `SIQS ${score}/10 (${level}).`;
  
  if (topPositive) {
    summary += ` Best: ${topPositive.name}.`;
  }
  
  if (topNegative && topNegative.score < 5) {
    summary += ` Limiting: ${topNegative.name}.`;
  }
  
  return summary;
}

/**
 * Generate recommendations based on SIQS score
 * @param score SIQS score (0-10 scale)
 * @param bortleScale Bortle scale value of the location
 * @returns Recommendation string
 */
export function getSIQSRecommendation(score: number, bortleScale: number): string {
  if (score >= 7.5) {
    return "Perfect conditions for all types of astrophotography including deep sky objects.";
  }
  
  if (score >= 6) {
    return "Great conditions for most imaging. Suitable for galaxies, nebulae and star clusters.";
  }
  
  if (score >= 5) {
    return "Good conditions. Consider focusing on brighter objects or using filters.";
  }
  
  if (score >= 4) {
    if (bortleScale <= 5) {
      return "Acceptable for lunar, planetary, and bright deep sky objects. Consider short exposures.";
    } else {
      return "Better for lunar and planetary imaging. Deep sky objects will be challenging.";
    }
  }
  
  if (score >= 3) {
    return "Limited imaging potential. Focus on lunar, planetary or very bright DSOs with filtering.";
  }
  
  return "Poor conditions for most imaging. Consider visual observation of bright objects only.";
}

/**
 * Validate cloud cover value ensures it's within valid range
 * @param cloudCover Cloud cover percentage
 * @returns Validated cloud cover value (0-100)
 */
export function validateCloudCover(cloudCover: number | null | undefined): number {
  if (cloudCover === null || cloudCover === undefined || isNaN(cloudCover)) {
    return 50; // Default to medium cloud cover
  }
  return Math.max(0, Math.min(100, cloudCover));
}

/**
 * Determine if imaging is impossible based on conditions
 * @param cloudCover Cloud cover percentage
 * @param precipitation Precipitation amount (mm)
 * @returns Boolean indicating if imaging is impossible
 */
export function isImagingImpossible(cloudCover: number, precipitation?: number): boolean {
  // If cloud cover is extremely high, imaging is likely impossible
  if (cloudCover >= 90) return true;
  
  // If there's significant precipitation, imaging is impossible
  if (precipitation !== undefined && precipitation > 0.5) return true;
  
  return false;
}

/**
 * Normalize factor scores to ensure consistent weighting
 * @param factors Array of SIQS factors with scores
 * @returns Array of factors with normalized scores
 */
export function normalizeFactorScores(factors: SIQSFactor[]): SIQSFactor[] {
  // Calculate total weight
  const totalWeight = factors.reduce((sum, factor) => sum + (factor.weight || 1), 0);
  
  // Normalize scores based on weights
  return factors.map(factor => ({
    ...factor,
    normalizedScore: factor.score * (factor.weight || 1) / totalWeight
  }));
}
