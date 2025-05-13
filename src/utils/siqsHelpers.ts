
/**
 * Helper functions for SIQS score handling
 */

/**
 * Normalize any SIQS value to the 0-10 scale
 */
export function normalizeToSiqsScale(value: number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  // If value is already in 0-10 range, return it
  if (value >= 0 && value <= 10) {
    return value;
  }
  
  // Handle values on 0-100 scale
  if (value > 10 && value <= 100) {
    return value / 10;
  }
  
  // Handle legacy values on 0-9 scale
  if (value >= 1 && value <= 9) {
    return (value / 9) * 10;
  }
  
  // For extreme outliers, clamp to 0-10 range
  return Math.max(0, Math.min(10, value));
}

/**
 * Extract SIQS score from different data structures
 */
export function getSiqsScore(siqs: any): number {
  // Handle null/undefined
  if (!siqs) return 0;
  
  // Handle numeric value
  if (typeof siqs === 'number') {
    return normalizeToSiqsScale(siqs);
  }
  
  // Handle object with score property
  if (typeof siqs === 'object') {
    if ('score' in siqs && typeof siqs.score === 'number') {
      return normalizeToSiqsScale(siqs.score);
    }
    
    if ('siqs' in siqs && typeof siqs.siqs === 'number') {
      return normalizeToSiqsScale(siqs.siqs);
    }
  }
  
  console.warn('Could not extract SIQS score from:', siqs);
  return 0;
}

/**
 * Check if SIQS value indicates good viewing conditions
 */
export function isGoodViewingCondition(siqs: any): boolean {
  const score = getSiqsScore(siqs);
  return score >= 5.5;
}

/**
 * Get quality class based on SIQS score
 */
export function getSiqsQualityClass(siqs: any): string {
  const score = getSiqsScore(siqs);
  
  if (score >= 8) return 'excellent';
  if (score >= 6) return 'good';
  if (score >= 4) return 'average'; 
  if (score >= 2) return 'poor';
  return 'bad';
}
