
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

/**
 * Format SIQS value for display
 */
export function formatSiqsForDisplay(siqs: any): string {
  const displaySiqs = getDisplaySiqs(siqs);
  
  if (displaySiqs === null) {
    return 'N/A';
  }
  
  return displaySiqs.toFixed(1);
}

/**
 * Get normalized and display-ready SIQS score
 */
export function getDisplaySiqs(siqs: any): number | null {
  // Handle null/undefined
  if (!siqs) return null;
  
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
  
  // Couldn't find a valid SIQS value
  return null;
}

/**
 * Get SIQS quality level text
 */
export function getSiqsQualityText(siqs: any): string {
  const normalizedSiqs = getDisplaySiqs(siqs);
  
  if (normalizedSiqs === null) return 'Unknown';
  
  if (normalizedSiqs >= 8) return 'Excellent';
  if (normalizedSiqs >= 6) return 'Good';
  if (normalizedSiqs >= 4) return 'Average';
  if (normalizedSiqs >= 2) return 'Poor';
  return 'Bad';
}

/**
 * Check if SIQS is at least a certain value
 */
export function isSiqsAtLeast(siqs: any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score >= threshold;
}

/**
 * Check if SIQS is greater than a certain value
 */
export function isSiqsGreaterThan(siqs: any, threshold: number): boolean {
  const score = getSiqsScore(siqs);
  return score > threshold;
}

/**
 * Sort locations by their SIQS scores (highest first)
 */
export function sortLocationsBySiqs(locations: any[]): any[] {
  if (!Array.isArray(locations)) return [];
  
  return [...locations].sort((a, b) => {
    const scoreA = getSiqsScore(a.siqs);
    const scoreB = getSiqsScore(b.siqs);
    return scoreB - scoreA;
  });
}

