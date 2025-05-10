
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { 
  getSiqsScore, 
  isSiqsAtLeast,
  sortLocationsBySiqs 
} from './siqsHelpers';

// Threshold for including a spot in filtered results
const DEFAULT_MINIMUM_SIQS = 5.0;

/**
 * Filter locations that meet minimum SIQS requirements
 * 
 * @param locations Array of locations to filter
 * @param minimumSiqs Optional minimum SIQS threshold
 * @returns Filtered array of locations
 */
export function filterBySiqs(
  locations: SharedAstroSpot[], 
  minimumSiqs = DEFAULT_MINIMUM_SIQS
): SharedAstroSpot[] {
  return locations.filter(location => {
    // Check for real-time SIQS first
    if ('realTimeSiqs' in location && typeof location.realTimeSiqs === 'number') {
      return location.realTimeSiqs >= minimumSiqs;
    }
    
    // Then check regular SIQS
    return isSiqsAtLeast(location.siqs, minimumSiqs);
  });
}

/**
 * Get the best locations based on SIQS score
 * 
 * @param locations Array of all locations
 * @param count Optional maximum number of locations to return
 * @param minimumSiqs Optional minimum SIQS threshold
 * @returns Array of best locations
 */
export function getBestSiqsLocations(
  locations: SharedAstroSpot[],
  count = 5,
  minimumSiqs = DEFAULT_MINIMUM_SIQS
): SharedAstroSpot[] {
  const filtered = filterBySiqs(locations, minimumSiqs);
  const sorted = sortLocationsBySiqs(filtered);
  return sorted.slice(0, count);
}

/**
 * Calculate average SIQS score across multiple locations
 * 
 * @param locations Array of locations to average
 * @returns Average SIQS score or null if no valid scores
 */
export function calculateAverageSiqs(locations: SharedAstroSpot[]): number | null {
  if (!locations.length) return null;
  
  const validScores = locations
    .map(location => getSiqsScore(location.siqs))
    .filter(score => score > 0);
  
  if (!validScores.length) return null;
  
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return sum / validScores.length;
}
