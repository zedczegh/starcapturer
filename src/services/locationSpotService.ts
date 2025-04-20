
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/validation';
import { generateDistributedPoints } from './location/pointGenerationService';
import { getCachedSpots, cacheSpots } from './location/spotCacheService';
import { createSpotFromPoint } from './location/spotCreationService';
import { batchCalculateSiqs } from './realTimeSiqs/siqsCalculator';

const BATCH_SIZE = 5;
const MAX_TOTAL_SPOTS = 50; // Limit total spots to improve performance
const QUALITY_BIAS_FACTOR = 0.7; // Higher values favor quality over distance

export async function generateQualitySpots(
  centerLat: number,
  centerLng: number, 
  radius: number,
  limit: number = 10,
  minQuality: number = 5
): Promise<SharedAstroSpot[]> {
  // Check cache first with intelligent cache key generation
  const cachedSpots = getCachedSpots(centerLat, centerLng, radius, minQuality);
  if (cachedSpots) {
    return cachedSpots;
  }
  
  console.log(`Generating ${limit} quality spots within ${radius}km of [${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}]`);
  
  // Determine effective limit based on radius to avoid generating too many points for large areas
  // Use adaptive scaling based on radius size
  const effectiveLimit = determineEffectiveLimit(limit, radius);
  
  console.log(`Using effective limit of ${effectiveLimit} spots for ${radius}km radius`);
  
  try {
    // Generate candidate points with better distribution
    // Use a context-aware distribution strategy based on radius size
    const distributionStrategy = radius > 300 ? 'grid' : 
                                radius > 100 ? 'fibonacci' : 'blue_noise';
    
    const points = generateDistributedPoints(
      centerLat, 
      centerLng, 
      radius, 
      effectiveLimit * 2,
      distributionStrategy
    );
    
    // Divide into regions for better processing with intelligent region selection
    const regions = divideIntoOptimalRegions(centerLat, centerLng, radius);
    
    // Process points in batches with optimized SIQS calculation
    const validSpots: SharedAstroSpot[] = [];
    const batches = chunkArray(points, BATCH_SIZE);
    
    // Prepare for batch SIQS calculation with pre-filtering
    const locationBatch = points
      .filter(p => !isWaterLocation(p.latitude, p.longitude))
      .map(p => ({
        latitude: p.latitude, 
        longitude: p.longitude, 
        bortleScale: 4 // Default, will be refined later
      }));
    
    // Calculate SIQS for all points in one batch operation with enhanced concurrency
    const batchSiqs = await batchCalculateSiqs(locationBatch, {
      useSingleHourSampling: true,
      maxConcurrent: determineOptimalConcurrency(locationBatch.length)
    });
    
    // Use AbortController for cancelable processing if too many results found
    const abortController = new AbortController();
    const signal = abortController.signal;
    let processedCount = 0;
    
    // Process batches in parallel with cancelation support
    const batchPromises = batches.map(async (batch, batchIndex) => {
      if (signal.aborted) return [];
      
      // Delay processing of later batches slightly to prioritize early results
      if (batchIndex > 0) {
        await new Promise(resolve => setTimeout(resolve, batchIndex * 50));
      }
      
      // Process batch with intelligent point selection
      const batchPromises = batch.map(async point => {
        if (signal.aborted) return null;
        
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
      
      processedCount += batch.length;
      
      // If we have enough spots already, cancel remaining batches
      if (validSpots.length + validBatchSpots.length >= effectiveLimit * 1.5) {
        abortController.abort();
      }
      
      return validBatchSpots;
    });
    
    // Wait for all batches to complete or abort
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Collect valid spots from successful batches
    batchResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        validSpots.push(...result.value);
      }
    });
    
    // Sort and cache results with adaptive quality/distance weighting
    const sortedSpots = sortByQualityAndDistance(validSpots, QUALITY_BIAS_FACTOR)
      .slice(0, effectiveLimit);
    
    // Cache with optimization flags
    cacheSpots(centerLat, centerLng, radius, minQuality, sortedSpots);
    
    console.log(`Generated ${sortedSpots.length} quality spots from ${processedCount}/${points.length} candidates`);
    return sortedSpots;
    
  } catch (error) {
    console.error("Error generating quality spots:", error);
    return [];
  }
}

/**
 * Determine optimal concurrent API calls based on batch size
 */
function determineOptimalConcurrency(batchSize: number): number {
  // Scale concurrency based on batch size but with reasonable limits
  if (batchSize <= 5) return 2;
  if (batchSize <= 15) return 3;
  if (batchSize <= 30) return 4;
  return 5; // Maximum concurrent calls
}

/**
 * Determine effective limit based on radius size with adaptive scaling
 */
function determineEffectiveLimit(requestedLimit: number, radius: number): number {
  // For very small radii, we can be more generous with spots
  if (radius <= 50) return Math.min(requestedLimit, MAX_TOTAL_SPOTS);
  
  // For medium radii, scale down slightly
  if (radius <= 200) {
    return Math.min(
      requestedLimit,
      Math.max(5, Math.round(MAX_TOTAL_SPOTS * 0.9))
    );
  }
  
  // For large radii, scale down more aggressively
  const scaleFactor = Math.max(0.2, 200 / radius);
  return Math.min(
    requestedLimit,
    Math.max(5, Math.round(MAX_TOTAL_SPOTS * scaleFactor))
  );
}

/**
 * Divide search area into regions to better distribute points
 * Enhanced with optimal region sizing based on terrain type
 */
function divideIntoOptimalRegions(centerLat: number, centerLng: number, radiusKm: number) {
  // Determine if this is a likely urban area (simplified check)
  const isLikelyUrbanArea = radiusKm < 100;
  
  // For very large search areas, use a grid approach
  if (radiusKm > 200) {
    const regions = [];
    // Scale grid size based on radius - more cells for larger areas
    const gridSize = Math.min(
      5, 
      Math.max(2, Math.floor(radiusKm / 100))
    );
    const cellRadius = radiusKm / gridSize;
    
    // Create a grid of regions with adaptive density
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Calculate offset from center with jitter to avoid uniform grid
        const jitterFactor = 0.1; // 10% random jitter
        const jitterLat = (Math.random() * jitterFactor * 2 - jitterFactor) * cellRadius / 111.32;
        const jitterLng = (Math.random() * jitterFactor * 2 - jitterFactor) * cellRadius / (111.32 * Math.cos(centerLat * Math.PI / 180));
        
        const latOffset = ((i - gridSize/2) + 0.5) * cellRadius * 2 / 111.32 + jitterLat;
        const lngOffset = ((j - gridSize/2) + 0.5) * cellRadius * 2 / (111.32 * Math.cos(centerLat * Math.PI / 180)) + jitterLng;
        
        regions.push({
          id: `region-${i}-${j}`,
          center: [centerLat + latOffset, centerLng + lngOffset],
          radius: cellRadius * (0.9 + Math.random() * 0.2) // Add 0-20% radius variation
        });
      }
    }
    
    return regions;
  }
  
  // For urban areas, use denser distribution
  if (isLikelyUrbanArea) {
    return generateUrbanRegions(centerLat, centerLng, radiusKm);
  }
  
  // For smaller rural areas, use standard quadrants with randomization
  return [
    {
      id: 'NE',
      center: [
        centerLat + (radiusKm / 3 + Math.random() * radiusKm / 10) / 111.32,
        centerLng + (radiusKm / 3 + Math.random() * radiusKm / 10) / (111.32 * Math.cos(centerLat * Math.PI / 180))
      ],
      radius: radiusKm / 2
    },
    {
      id: 'NW',
      center: [
        centerLat + (radiusKm / 3 + Math.random() * radiusKm / 10) / 111.32,
        centerLng - (radiusKm / 3 + Math.random() * radiusKm / 10) / (111.32 * Math.cos(centerLat * Math.PI / 180))
      ],
      radius: radiusKm / 2
    },
    {
      id: 'SE',
      center: [
        centerLat - (radiusKm / 3 + Math.random() * radiusKm / 10) / 111.32,
        centerLng + (radiusKm / 3 + Math.random() * radiusKm / 10) / (111.32 * Math.cos(centerLat * Math.PI / 180))
      ],
      radius: radiusKm / 2
    },
    {
      id: 'SW',
      center: [
        centerLat - (radiusKm / 3 + Math.random() * radiusKm / 10) / 111.32,
        centerLng - (radiusKm / 3 + Math.random() * radiusKm / 10) / (111.32 * Math.cos(centerLat * Math.PI / 180))
      ],
      radius: radiusKm / 2
    },
    {
      id: 'CENTER',
      center: [centerLat, centerLng],
      radius: radiusKm / 3
    }
  ];
}

/**
 * Generate regions optimized for urban areas
 */
function generateUrbanRegions(centerLat: number, centerLng: number, radiusKm: number) {
  const regions = [];
  // Use more regions for urban areas to find dark spots outside city centers
  const innerRadius = radiusKm * 0.3;
  const middleRadius = radiusKm * 0.6;
  const outerRadius = radiusKm;
  
  // Central area (likely brightest)
  regions.push({
    id: 'center',
    center: [centerLat, centerLng],
    radius: innerRadius
  });
  
  // Middle ring (8 directions)
  const directions = [
    [1, 0], [0.7071, 0.7071], [0, 1], [-0.7071, 0.7071],
    [-1, 0], [-0.7071, -0.7071], [0, -1], [0.7071, -0.7071]
  ];
  
  directions.forEach(([latMult, lngMult], i) => {
    const latDelta = (middleRadius / 111.32) * latMult;
    const lngDelta = (middleRadius / (111.32 * Math.cos(centerLat * Math.PI / 180))) * lngMult;
    
    regions.push({
      id: `middle-${i}`,
      center: [centerLat + latDelta, centerLng + lngDelta],
      radius: (middleRadius - innerRadius) * 0.8
    });
  });
  
  // Outer ring (more focused on outskirts where dark spots are more likely)
  directions.forEach(([latMult, lngMult], i) => {
    const latDelta = (outerRadius / 111.32) * latMult;
    const lngDelta = (outerRadius / (111.32 * Math.cos(centerLat * Math.PI / 180))) * lngMult;
    
    regions.push({
      id: `outer-${i}`,
      center: [centerLat + latDelta, centerLng + lngDelta],
      radius: (outerRadius - middleRadius) * 0.8
    });
  });
  
  return regions;
}

/**
 * Sort spots by quality and distance with adaptive weighting
 */
function sortByQualityAndDistance(spots: SharedAstroSpot[], qualityBias: number = 0.7): SharedAstroSpot[] {
  const distanceBias = 1 - qualityBias;
  
  return [...spots].sort((a, b) => {
    const aScore = typeof a.siqs === 'number' ? a.siqs : 0;
    const bScore = typeof b.siqs === 'number' ? b.siqs : 0;
    
    // Normalize distances to 0-100 scale to match SIQS
    const maxDistance = Math.max(...spots.map(s => s.distance || 0));
    const normalizedDistanceA = maxDistance ? ((a.distance || 0) / maxDistance) * 100 : 0;
    const normalizedDistanceB = maxDistance ? ((b.distance || 0) / maxDistance) * 100 : 0;
    
    // Quality gets higher weight, distance gets lower weight
    const aQuality = (aScore * qualityBias) - (normalizedDistanceA * distanceBias);
    const bQuality = (bScore * qualityBias) - (normalizedDistanceB * distanceBias);
    
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
