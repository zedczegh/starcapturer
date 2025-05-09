
import { getSiqsScore, normalizeToSiqsScale, SiqsValue } from './siqsHelpers';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';

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

/**
 * Get complete SIQS display data including real-time calculations when needed
 */
export async function getCompleteSiqsDisplay({
  latitude,
  longitude,
  bortleScale,
  isCertified,
  isDarkSkyReserve,
  existingSiqs,
  skipCache = false,
  useSingleHourSampling = true,
  targetHour = 1
}: {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | null;
  skipCache?: boolean;
  useSingleHourSampling?: boolean;
  targetHour?: number;
}): Promise<{
  siqs: number;
  source: 'realtime' | 'static' | 'default';
  confidence: number;
}> {
  try {
    // Calculate real-time SIQS
    const realTimeSiqsResult = await calculateRealTimeSiqs(
      latitude,
      longitude,
      bortleScale || 4,
      {
        useSingleHourSampling,
        targetHour,
        cacheDurationMins: skipCache ? 0 : 5
      }
    );
    
    if (realTimeSiqsResult && realTimeSiqsResult.siqs > 0) {
      return {
        siqs: realTimeSiqsResult.siqs,
        source: 'realtime',
        confidence: 9
      };
    }
    
    // Fall back to existing SIQS if available
    if (existingSiqs && existingSiqs > 0) {
      return {
        siqs: getSiqsScore(existingSiqs),
        source: 'static',
        confidence: 7
      };
    }
    
    // Use default values based on certification
    const defaultScore = isDarkSkyReserve ? 8.0 : (isCertified ? 6.5 : 0);
    
    return {
      siqs: defaultScore,
      source: 'default',
      confidence: isCertified ? 6 : 4
    };
  } catch (error) {
    console.error("Error in getCompleteSiqsDisplay:", error);
    
    // Fallback to static score in case of error
    if (existingSiqs && existingSiqs > 0) {
      return {
        siqs: getSiqsScore(existingSiqs),
        source: 'static',
        confidence: 5
      };
    }
    
    return {
      siqs: isDarkSkyReserve ? 8.0 : (isCertified ? 6.5 : 0),
      source: 'default',
      confidence: 4
    };
  }
}

// Get the appropriate color class based on SIQS score
export function getSiqsColorClass(score: SiqsValue): string {
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
export function formatSiqsForDisplay(score: SiqsValue): string {
  const normalizedScore = getSiqsScore(score);
  
  if (!normalizedScore || normalizedScore <= 0) {
    return '—';
  }
  
  return normalizedScore.toFixed(1);
}

// Determine if score should be shown on mobile
export function shouldShowScoreOnMobile(
  score: SiqsValue,
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
  shouldShowScoreOnMobile,
  getCompleteSiqsDisplay
};
