
import { getSiqsScore, normalizeToSiqsScale } from './siqsHelpers';

/**
 * Unified display logic for SIQS scores
 * Provides consistent handling across the app
 */

export function getDisplaySiqs({ 
  realTimeSiqs, 
  staticSiqs, 
  isCertified,
  isDarkSkyReserve = false
}: {
  realTimeSiqs: number | null;
  staticSiqs: number | null;
  isCertified: boolean;
  isDarkSkyReserve?: boolean;
}): number {
  // First priority: valid real-time SIQS
  if (realTimeSiqs !== null && realTimeSiqs > 0) {
    return realTimeSiqs;
  }
  
  // Second priority: valid static SIQS
  if (staticSiqs !== null && staticSiqs > 0) {
    return staticSiqs;
  }
  
  // Fallbacks for certified locations
  if (isDarkSkyReserve) {
    return 8.0; // Dark sky reserves typically get high scores
  }
  
  if (isCertified) {
    return 6.5; // Standard certified location baseline
  }
  
  // No valid score available
  return 0;
}

// Get the appropriate color class based on SIQS score
export function getSiqsColorClass(score: number | null | undefined): string {
  const normalizedScore = getSiqsScore(score);
  
  if (!normalizedScore || normalizedScore <= 0) {
    return 'text-muted-foreground';
  }
  
  if (normalizedScore >= 8) return 'text-green-500';
  if (normalizedScore >= 6.5) return 'text-lime-500';
  if (normalizedScore >= 5) return 'text-yellow-500';
  if (normalizedScore >= 3.5) return 'text-orange-500';
  return 'text-red-500';
}

// Format SIQS score for display with proper precision
export function formatSiqsForDisplay(score: number | null | undefined): string {
  const normalizedScore = getSiqsScore(score);
  
  if (!normalizedScore || normalizedScore <= 0) {
    return '—';
  }
  
  return normalizedScore.toFixed(1);
}

// Determine if score should be shown on mobile
export function shouldShowScoreOnMobile(
  score: number | null | undefined,
  isCertified: boolean
): boolean {
  const normalizedScore = getSiqsScore(score);
  
  // Always show certified locations
  if (isCertified) return true;
  
  // For non-certified, only show valid scores
  return normalizedScore > 0;
}

export default {
  getDisplaySiqs,
  getSiqsColorClass,
  formatSiqsForDisplay,
  shouldShowScoreOnMobile
};
