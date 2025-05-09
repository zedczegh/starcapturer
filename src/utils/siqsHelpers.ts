
/**
 * Utility functions for SIQS score handling and display
 */

// Normalize any SIQS value to the standard 0-10 scale
export function normalizeToSiqsScale(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  
  // Already in 0-10 range
  if (value >= 0 && value <= 10) {
    return Math.round(value * 10) / 10; // Round to 1 decimal
  }
  
  // Convert from 0-100 scale (percentage)
  if (value > 10 && value <= 100) {
    return Math.round((value / 10) * 10) / 10;
  }
  
  // Handle out of range values
  if (value > 100) return 10;
  if (value < 0) return 0;
  
  return 0;
}

// Extract SIQS score from various formats
export function getSiqsScore(siqs: any): number {
  if (siqs === null || siqs === undefined) return 0;
  
  // Handle number directly
  if (typeof siqs === 'number') {
    return normalizeToSiqsScale(siqs);
  }
  
  // Handle object with score property
  if (siqs && typeof siqs === 'object' && 'score' in siqs) {
    return normalizeToSiqsScale(siqs.score);
  }
  
  // Handle string (convert to number)
  if (typeof siqs === 'string') {
    const parsed = parseFloat(siqs);
    if (!isNaN(parsed)) {
      return normalizeToSiqsScale(parsed);
    }
  }
  
  return 0;
}

// Format SIQS for display with proper precision
export function formatSiqsForDisplay(siqs: number | null): string {
  if (siqs === null || siqs <= 0) {
    return "—";
  }
  
  // Keep one decimal place for visual consistency
  return siqs.toFixed(1);
}

// Export formatSiqsScore as an alias for formatSiqsForDisplay for backward compatibility
export const formatSiqsScore = formatSiqsForDisplay;

// Cache timing parameters for SIQS loading
const cachedTimingParams = {
  certified: {
    minLoadingTime: 400, // ms minimum loading time for certified locations
    maxLoadingTime: 800, // ms maximum loading time for certified locations
  },
  regular: {
    minLoadingTime: 300, // ms minimum loading time for regular locations
    maxLoadingTime: 700, // ms maximum loading time for regular locations
  }
};

/**
 * Unified display logic for SIQS scores with priority order
 */
export function getDisplaySiqs({ 
  realTimeSiqs, 
  staticSiqs, 
  isCertified, 
  isDarkSkyReserve 
}: {
  realTimeSiqs: number | null;
  staticSiqs: number | null;
  isCertified: boolean;
  isDarkSkyReserve: boolean;
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
    return 8; // Dark sky reserves typically get high scores
  }
  
  if (isCertified) {
    return 6.5; // Standard certified location baseline
  }
  
  // No valid score available
  return 0;
}

// Compare SIQS scores - check if first score is greater than second
export function isSiqsGreaterThan(siqs: any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score > threshold;
}

// Check if SIQS score is at least a certain value
export function isSiqsAtLeast(siqs: any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score >= threshold;
}

// Sort locations by SIQS score (highest first)
export function sortLocationsBySiqs(locations: any[]): any[] {
  return [...locations].sort((a, b) => {
    const scoreA = getSiqsScore(a.siqs) || 0;
    const scoreB = getSiqsScore(b.siqs) || 0;
    return scoreB - scoreA;
  });
}

export default {
  normalizeToSiqsScale,
  getSiqsScore,
  formatSiqsForDisplay,
  getDisplaySiqs,
  formatSiqsScore,
  isSiqsGreaterThan,
  isSiqsAtLeast,
  sortLocationsBySiqs
};
