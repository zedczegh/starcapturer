
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/validation';
import { generateDistributedPoints } from './location/pointGenerationService';
import { getCachedSpots, cacheSpots } from './location/spotCacheService';
import { createSpotFromPoint } from './location/spotCreationService';
import { getEffectiveCloudCover } from '@/lib/siqs/weatherDataUtils';
import { getSiqsScore } from '@/utils/siqsHelpers';

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
    // Generate more candidate points to ensure we find enough quality spots
    const points = generateDistributedPoints(centerLat, centerLng, radius, limit * 5);
    
    // Process points in batches with optimized SIQS calculation
    const validSpots: SharedAstroSpot[] = [];
    const batches = chunkArray(points, BATCH_SIZE);
    
    for (const batch of batches) {
      if (validSpots.length >= limit) break;
      
      // Process batch in parallel for better performance
      const batchPromises = batch.map(async point => {
        if (isWaterLocation(point.latitude, point.longitude)) {
          return null;
        }
        
        // Using optimized spot creation with single-hour cloud cover sampling
        // Pass a higher quality threshold to ensure only meaningful spots
        return createSpotFromPoint(point, minQuality + 1);
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validBatchSpots = batchResults.filter(Boolean) as SharedAstroSpot[];
      
      // Further filter spots based on enhanced criteria for meaningfulness
      const meaningfulSpots = validBatchSpots.filter(spot => isSpotMeaningful(spot));
      validSpots.push(...meaningfulSpots);
    }
    
    // Sort and cache results with improved quality/distance algorithm
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

/**
 * Determines if a spot is meaningful based on enhanced criteria
 * including SIQS score, weather conditions, and uniqueness
 */
function isSpotMeaningful(spot: SharedAstroSpot): boolean {
  // Spots must have a valid SIQS score
  const siqsScore = getSiqsScore(spot.siqs);
  if (siqsScore === null || siqsScore < 55) {
    return false;
  }
  
  // Check if the spot has weather data
  if (spot.weatherData) {
    // Get effective cloud cover considering precipitation and conditions
    const effectiveCloudCover = getEffectiveCloudCover(
      spot.weatherData.cloudCover,
      spot.weatherData.precipitation,
      spot.weatherData.weatherCondition
    );
    
    // Filter out spots with poor viewing conditions
    if (effectiveCloudCover > 70) {
      return false;
    }
    
    // Filter based on precipitation
    if (spot.weatherData.precipitation && spot.weatherData.precipitation > 1) {
      return false;
    }
  }
  
  // Always include viable spots
  if (spot.isViable) {
    return true;
  }
  
  // Include spots with higher quality despite distance
  const siqsValue = getSiqsScore(spot.siqs) || 0;
  const qualityDistanceRatio = siqsValue / 10 - (spot.distance || 0) / 100;
  if (qualityDistanceRatio > 0.5) {
    return true;
  }
  
  return false;
}

function sortByQualityAndDistance(spots: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...spots].sort((a, b) => {
    const aScore = getSiqsScore(a.siqs) || 0;
    const bScore = getSiqsScore(b.siqs) || 0;
    
    // Improved algorithm that better balances quality vs. distance
    // More weight to quality for farther spots that are exceptional
    const aQualityFactor = aScore / 100;
    const bQualityFactor = bScore / 100;
    
    const aDistanceFactor = (a.distance || 0) / 100;
    const bDistanceFactor = (b.distance || 0) / 100;
    
    // Quality has 70% weight, distance has 30% weight
    const aQuality = (aScore * 0.7) - ((a.distance || 0) * 0.3);
    const bQuality = (bScore * 0.7) - ((b.distance || 0) * 0.3);
    
    // Additional boost for exceptionally good spots
    const aBoost = aScore > 80 ? 10 : 0;
    const bBoost = bScore > 80 ? 10 : 0;
    
    return (bQuality + bBoost) - (aQuality + aBoost);
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
