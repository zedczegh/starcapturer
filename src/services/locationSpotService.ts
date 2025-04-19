
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationValidator';
import { generateDistributedPoints } from './location/pointGenerationService';
import { getCachedSpots, cacheSpots } from './location/spotCacheService';
import { createSpotFromPoint } from './location/spotCreationService';

const BATCH_SIZE = 5;

export async function generateQualitySpots(
  centerLat: number,
  centerLng: number, 
  radius: number,
  limit: number = 10,
  minQuality: number = 5
): Promise<SharedAstroSpot[]> {
  // Check cache first
  const cachedSpots = getCachedSpots(centerLat, centerLng, radius, limit);
  if (cachedSpots) {
    return cachedSpots;
  }
  
  console.log(`Generating ${limit} quality spots within ${radius}km of [${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}]`);
  
  try {
    // Generate candidate points with better distribution
    const points = generateDistributedPoints(centerLat, centerLng, radius, limit * 3);
    
    // Process points in batches
    const validSpots: SharedAstroSpot[] = [];
    const batches = chunkArray(points, BATCH_SIZE);
    
    for (const batch of batches) {
      if (validSpots.length >= limit) break;
      
      const batchPromises = batch.map(async point => {
        if (isWaterLocation(point.latitude, point.longitude)) {
          return null;
        }
        
        return createSpotFromPoint(point, minQuality);
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validBatchSpots = batchResults.filter(Boolean) as SharedAstroSpot[];
      validSpots.push(...validBatchSpots);
    }
    
    // Sort and cache results
    const sortedSpots = sortByQualityAndDistance(validSpots)
      .slice(0, limit);
    
    cacheSpots(centerLat, centerLng, radius, limit, sortedSpots);
    
    console.log(`Generated ${sortedSpots.length} quality spots`);
    return sortedSpots;
    
  } catch (error) {
    console.error("Error generating quality spots:", error);
    return [];
  }
}

function sortByQualityAndDistance(spots: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...spots].sort((a, b) => {
    const aScore = typeof a.siqs === 'number' ? a.siqs : 0;
    const bScore = typeof b.siqs === 'number' ? b.siqs : 0;
    
    const aQuality = (aScore * 0.7) - ((a.distance || 0) * 0.3);
    const bQuality = (bScore * 0.7) - ((b.distance || 0) * 0.3);
    
    return bQuality - aQuality;
  });
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Re-export location store functions
export {
  addLocationToStore,
  getLocationFromStore,
  getAllLocationsFromStore,
  clearLocationStore
} from './locationStore';
