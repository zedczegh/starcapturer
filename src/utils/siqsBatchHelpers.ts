
/**
 * SIQS Batch Processing Helpers
 */

import { 
  isSiqsAtLeast,
  sortLocationsBySiqs,
  getSiqsScore 
} from './siqsHelpers';

/**
 * Filter locations based on minimum SIQS score
 */
export const filterByMinimumSiqs = (locations: any[], minimumScore: number = 5.5): any[] => {
  if (!Array.isArray(locations)) return [];
  
  return locations.filter(location => isSiqsAtLeast(location.siqs, minimumScore));
};

/**
 * Get the top N locations by SIQS score
 */
export const getTopLocationsBySiqs = (locations: any[], count: number = 5): any[] => {
  if (!Array.isArray(locations)) return [];
  
  const sorted = sortLocationsBySiqs(locations);
  return sorted.slice(0, count);
};

/**
 * Group locations by SIQS quality level
 */
export const groupLocationsByQuality = (locations: any[]): Record<string, any[]> => {
  if (!Array.isArray(locations)) return {};
  
  return locations.reduce((groups, location) => {
    const score = getSiqsScore(location.siqs);
    let quality = 'unknown';
    
    if (score >= 8) quality = 'excellent';
    else if (score >= 6) quality = 'good';
    else if (score >= 4) quality = 'average';
    else if (score >= 2) quality = 'poor';
    else quality = 'bad';
    
    if (!groups[quality]) {
      groups[quality] = [];
    }
    
    groups[quality].push(location);
    return groups;
  }, {} as Record<string, any[]>);
};

/**
 * Calculate average SIQS for a group of locations
 */
export const calculateAverageSiqs = (locations: any[]): number => {
  if (!Array.isArray(locations) || locations.length === 0) return 0;
  
  const validLocations = locations.filter(loc => loc && loc.siqs);
  if (validLocations.length === 0) return 0;
  
  const sum = validLocations.reduce((total, loc) => {
    return total + getSiqsScore(loc.siqs);
  }, 0);
  
  return sum / validLocations.length;
};

