
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from './siqsCalculator';

/**
 * Batch calculate SIQS for multiple locations
 */
export async function batchCalculateSiqs(
  locations: SharedAstroSpot[],
  defaultBortleScale: number = 4
): Promise<SharedAstroSpot[]> {
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
          siqs: {
            score: siqsResult.siqs,
            isViable: siqsResult.isViable
          },
          siqsResult
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
