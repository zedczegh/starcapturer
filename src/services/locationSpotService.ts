
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/validation';
import { generateDistributedPoints } from './location/pointGenerationService';
import { getCachedSpots, cacheSpots } from './location/spotCacheService';
import { createSpotFromPoint } from './location/spotCreationService';
import { batchCalculateSiqs } from './realTimeSiqs/siqsCalculator';

const BATCH_SIZE = 5;
const MAX_TOTAL_SPOTS = 50; // Limit total spots to improve performance

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
  
  // Determine effective limit based on radius to avoid generating too many points for large areas
  const effectiveLimit = Math.min(
    limit,
    Math.max(5, Math.round(MAX_TOTAL_SPOTS * (radius <= 200 ? 1 : 200 / radius)))
  );
  
  console.log(`Using effective limit of ${effectiveLimit} spots for ${radius}km radius`);
  
  try {
    // Generate candidate points with better distribution
    const points = generateDistributedPoints(centerLat, centerLng, radius, effectiveLimit * 2);
    
    // Divide into regions for better processing
    const regions = divideIntoRegions(centerLat, centerLng, radius);
    
    // Process points in batches with optimized SIQS calculation
    const validSpots: SharedAstroSpot[] = [];
    const batches = chunkArray(points, BATCH_SIZE);
    
    // Prepare for batch SIQS calculation
    const locationBatch = points
      .filter(p => !isWaterLocation(p.latitude, p.longitude))
      .map(p => ({
        latitude: p.latitude, 
        longitude: p.longitude, 
        bortleScale: 4 // Default, will be refined later
      }));
    
    // Calculate SIQS for all points in one batch operation
    const batchSiqs = await batchCalculateSiqs(locationBatch, {
      useSingleHourSampling: true,
      maxConcurrent: 3
    });
    
    // Process points with pre-calculated SIQS
    for (const batch of batches) {
      if (validSpots.length >= effectiveLimit) break;
      
      // Process batch in parallel for better performance
      const batchPromises = batch.map(async point => {
        if (isWaterLocation(point.latitude, point.longitude)) {
          return null;
        }
        
        const pointKey = `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
        const precalculatedSiqs = batchSiqs[pointKey];
        
        // Using optimized spot creation with pre-calculated SIQS when available
        return createSpotFromPoint(point, minQuality, precalculatedSiqs);
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validBatchSpots = batchResults.filter(Boolean) as SharedAstroSpot[];
      validSpots.push(...validBatchSpots);
    }
    
    // Sort and cache results
    const sortedSpots = sortByQualityAndDistance(validSpots)
      .slice(0, effectiveLimit);
    
    cacheSpots(centerLat, centerLng, radius, effectiveLimit, sortedSpots);
    
    console.log(`Generated ${sortedSpots.length} quality spots`);
    return sortedSpots;
    
  } catch (error) {
    console.error("Error generating quality spots:", error);
    return [];
  }
}

/**
 * Divide search area into regions to better distribute points
 */
function divideIntoRegions(centerLat: number, centerLng: number, radiusKm: number) {
  // For very large search areas, use a grid approach
  if (radiusKm > 200) {
    const regions = [];
    const gridSize = Math.min(4, Math.floor(radiusKm / 100));
    const cellRadius = radiusKm / gridSize;
    
    // Create a grid of regions
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Calculate offset from center
        const latOffset = ((i - gridSize/2) + 0.5) * cellRadius * 2 / 111.32;
        const lngOffset = ((j - gridSize/2) + 0.5) * cellRadius * 2 / (111.32 * Math.cos(centerLat * Math.PI / 180));
        
        regions.push({
          id: `region-${i}-${j}`,
          center: [centerLat + latOffset, centerLng + lngOffset],
          radius: cellRadius
        });
      }
    }
    
    return regions;
  }
  
  // For smaller areas, just use quadrants
  return [
    {
      id: 'NE',
      center: [
        centerLat + (radiusKm / 3) / 111.32,
        centerLng + (radiusKm / 3) / (111.32 * Math.cos(centerLat * Math.PI / 180))
      ],
      radius: radiusKm / 2
    },
    {
      id: 'NW',
      center: [
        centerLat + (radiusKm / 3) / 111.32,
        centerLng - (radiusKm / 3) / (111.32 * Math.cos(centerLat * Math.PI / 180))
      ],
      radius: radiusKm / 2
    },
    {
      id: 'SE',
      center: [
        centerLat - (radiusKm / 3) / 111.32,
        centerLng + (radiusKm / 3) / (111.32 * Math.cos(centerLat * Math.PI / 180))
      ],
      radius: radiusKm / 2
    },
    {
      id: 'SW',
      center: [
        centerLat - (radiusKm / 3) / 111.32,
        centerLng - (radiusKm / 3) / (111.32 * Math.cos(centerLat * Math.PI / 180))
      ],
      radius: radiusKm / 2
    }
  ];
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
