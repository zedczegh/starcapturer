/**
 * Utility functions for handling SIQS scores
 */

/**
 * Safely extracts a numeric SIQS score from either a number or an object with score property
 * @param siqs - The SIQS value, which can be a number, object, or null
 * @returns A numeric score or null
 */
export const getSiqsScore = (siqs: number | { score: number; isViable: boolean; } | null): number | null => {
  if (siqs === null || siqs === undefined) {
    return null;
  }
  
  // If siqs is already a number, return it
  if (typeof siqs === 'number') {
    return siqs;
  }
  
  // Otherwise, extract the score from the object
  return siqs.score;
};

/**
 * Sort locations by their SIQS scores (highest first)
 * @param locations - Array of locations with siqs or realTimeSiqs properties
 * @returns Sorted array of locations
 */
export const sortLocationsBySiqs = (locations: any[]): any[] => {
  return [...locations].sort((a, b) => {
    // Check for realTimeSiqs first, then fallback to siqs property
    const scoreA = a.realTimeSiqs !== undefined ? getSiqsScore(a.realTimeSiqs) : a.siqs;
    const scoreB = b.realTimeSiqs !== undefined ? getSiqsScore(b.realTimeSiqs) : b.siqs;
    
    // Handle null/undefined values in sorting
    if (scoreA === null || scoreA === undefined) return 1;
    if (scoreB === null || scoreB === undefined) return -1;
    
    // Higher scores come first (descending order)
    return scoreB - scoreA;
  });
};
