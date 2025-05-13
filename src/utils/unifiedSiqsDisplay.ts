
import { getSiqsScore } from './siqsHelpers';

/**
 * Gets a standardized SIQS score from various data formats for display
 * This function handles all the different ways SIQS might be stored
 */
export function getDisplaySiqs(siqsData: any): number | null {
  if (!siqsData) return null;
  
  // Use the utility function for consistent normalization
  const score = getSiqsScore(siqsData);
  
  // Return null for invalid/zero scores
  return score > 0 ? score : null;
}
