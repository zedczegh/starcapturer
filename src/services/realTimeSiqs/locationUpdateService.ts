
/**
 * Service for updating location data with real-time SIQS scores
 */

import { calculateRealTimeSiqs } from './siqsCalculator';
import { EnhancedLocation } from './siqsTypes';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Update a set of locations with real-time SIQS scores
 * @param locations Array of locations to update
 * @param defaultBortleScale Default Bortle scale if not specified
 * @returns Updated locations with SIQS scores
 */
export async function updateLocationsWithRealTimeSiqs(
  locations: EnhancedLocation[],
  defaultBortleScale: number = 4
): Promise<EnhancedLocation[]> {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return [];
  }

  const result = await Promise.all(
    locations.map(async (location) => {
      if (!location.latitude || !location.longitude) {
        return location;
      }

      try {
        const siqsResult = await calculateRealTimeSiqs(
          location.latitude,
          location.longitude,
          location.bortleScale || defaultBortleScale
        );

        return {
          ...location,
          siqsScore: siqsResult.siqs
        };
      } catch (error) {
        console.error(`Error calculating SIQS for location: ${location.id || 'unknown'}`, error);
        return location;
      }
    })
  );

  return result;
}

/**
 * Add placeholder SIQS scores to locations that don't have them
 */
export function addPlaceholderSiqsScores(
  locations: SharedAstroSpot[]
): SharedAstroSpot[] {
  if (!locations || !Array.isArray(locations)) return [];
  
  return locations.map(location => {
    if (location.siqs) return location;
    
    // Generate a placeholder score based on Bortle scale (if available)
    const bortleScale = location.bortleScale || 4;
    const placeholderScore = Math.max(1, 10 - bortleScale);
    
    return {
      ...location,
      siqs: {
        score: placeholderScore,
        isViable: placeholderScore >= 5
      }
    };
  });
}
