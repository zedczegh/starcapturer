
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { generateDistributedPoints } from './pointGenerationService';
import { createSpotFromPoint } from './spotCreationService';
import { BATCH_SIZE, DEFAULT_SPOT_LIMIT } from '@/utils/constants';

/**
 * Generate calculated locations based on environmental factors
 */
export const generateCalculatedLocations = async (
  latitude: number,
  longitude: number,
  radius: number,
  limit = DEFAULT_SPOT_LIMIT
): Promise<SharedAstroSpot[]> => {
  try {
    // Generate distributed points within the radius
    const points = generateDistributedPoints(
      latitude, 
      longitude, 
      radius, 
      limit * 2 // Generate more points than needed to account for filtering
    );
    
    const spots: SharedAstroSpot[] = [];
    
    // Process points in batches to avoid overwhelming the system
    for (let i = 0; i < points.length; i += BATCH_SIZE) {
      const batch = points.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(point => createSpotFromPoint(point))
      );
      
      // Filter out null results and add valid spots
      const validSpots = batchResults.filter(spot => spot !== null) as SharedAstroSpot[];
      spots.push(...validSpots);
      
      // If we have enough spots, stop processing
      if (spots.length >= limit) {
        break;
      }
    }
    
    return spots.slice(0, limit);
  } catch (error) {
    console.error('Error generating calculated locations:', error);
    return [];
  }
};
