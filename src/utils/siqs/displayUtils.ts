
import { SIQSResult } from '@/lib/siqs/types';

/**
 * Format SIQS score with one decimal place
 * @param score SIQS score number
 * @returns Formatted string
 */
export function formatSiqsScore(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score)) return '0.0';
  return score.toFixed(1);
}

/**
 * Get SIQS color class based on score
 * @param score SIQS score
 * @returns CSS class name for color
 */
export function getSiqsColorClass(score: number): string {
  if (score >= 7.5) {
    return 'bg-green-500/80 border-green-400/50';
  } else if (score >= 5.0) {
    return 'bg-amber-500/80 border-amber-400/50';
  } else if (score >= 2.5) {
    return 'bg-orange-500/80 border-orange-400/50';
  } else {
    return 'bg-red-500/80 border-red-400/50';
  }
}

/**
 * Get SIQS text color class based on score
 * @param score SIQS score
 * @returns CSS class name for text color
 */
export function getSiqsTextColorClass(score: number): string {
  if (score >= 7.5) {
    return 'text-green-500';
  } else if (score >= 5.0) {
    return 'text-amber-500';
  } else if (score >= 2.5) {
    return 'text-orange-500';
  } else {
    return 'text-red-500';
  }
}

/**
 * Get SIQS level description based on score
 * @param score SIQS score
 * @returns Text description of quality level
 */
export function getSiqsLevel(score: number): string {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Average';
  if (score >= 3) return 'Poor';
  return 'Bad';
}

/**
 * Get SIQS description based on score
 * @param score SIQS score
 * @returns Descriptive text about the score
 */
export function getSiqsDescription(score: number, language: string = 'en'): string {
  if (score >= 9) {
    return language === 'zh' 
      ? "天文摄影的绝佳条件。"
      : "Exceptional conditions for astrophotography.";
  } else if (score >= 7) {
    return language === 'zh'
      ? "极好的条件，强烈推荐。"
      : "Excellent conditions, highly recommended.";
  } else if (score >= 5) {
    return language === 'zh'
      ? "良好的条件，适合成像。"
      : "Good conditions, suitable for imaging.";
  } else if (score >= 3) {
    return language === 'zh'
      ? "中等条件，可能有一些限制。"
      : "Moderate conditions, some limitations may apply.";
  } else {
    return language === 'zh'
      ? "条件较差，不推荐成像。"
      : "Poor conditions, not recommended for imaging.";
  }
}

/**
 * Check if a SIQS score is valid and usable
 * @param score The SIQS score to check
 * @returns Boolean indicating if the score is valid
 */
export function isValidSiqsScore(score: number | null | undefined): boolean {
  return score !== null && score !== undefined && !isNaN(score);
}

/**
 * Extract consistent SIQS display data from any location or SIQS result
 * @param location Location object or SIQS result
 * @returns Formatted display data
 */
export function extractSiqsDisplayData(location: any) {
  if (!location) {
    return {
      displayScore: '0.0',
      colorClass: 'bg-red-500/80 border-red-400/50',
      isViable: false,
      isNighttimeCalculation: false
    };
  }
  
  // Get SIQS value with consistent approach
  let siqsValue = null;
  
  // First try siqsResult.score (most accurate)
  if (location.siqsResult && typeof location.siqsResult.score === 'number' && !isNaN(location.siqsResult.score)) {
    siqsValue = location.siqsResult.score;
  }
  // Then try the siqs property
  else if (typeof location.siqs === 'number' && !isNaN(location.siqs)) {
    siqsValue = location.siqs;
  }
  // Lastly estimate from bortle scale if we have it
  else if (typeof location.bortleScale === 'number' && !isNaN(location.bortleScale)) {
    siqsValue = (10 - location.bortleScale * 0.75) + 3;
  }
  
  // If we don't have a valid SIQS value, return placeholder
  if (siqsValue === null) {
    return {
      displayScore: 'N/A',
      colorClass: 'bg-gray-500/70 border-gray-400/50',
      isViable: false,
      isNighttimeCalculation: false,
      isPending: true
    };
  }
  
  // Ensure value is in range 0-10
  siqsValue = Math.min(10, Math.max(0, siqsValue));
  
  // Format score with consistent decimal places
  const displayScore = formatSiqsScore(siqsValue);
  
  // Check if nighttime calculation was used
  const isNighttimeCalculation = location.siqsResult?.metadata?.calculationType === 'nighttime' ||
    location.siqsResult?.isNighttimeCalculation === true ||
    (Array.isArray(location.siqsResult?.factors) && 
      location.siqsResult?.factors.some((f: any) => f.nighttimeData));
  
  // Get color class based on score
  const colorClass = getSiqsColorClass(siqsValue);
  
  return {
    displayScore,
    colorClass,
    isViable: siqsValue >= 5.0,
    isNighttimeCalculation
  };
}
