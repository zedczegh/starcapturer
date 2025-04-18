
/**
 * Enhanced service for generating astronomy spots with batched processing,
 * improved spatial distribution, and terrain-corrected Bortle scale.
 */

import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateRealTimeSiqs } from "./realTimeSiqs/siqsCalculator";
import { isWaterLocation } from "@/utils/locationValidator";
import { getTerrainCorrectedBortleScale } from "@/utils/terrainCorrection";
import { calculateDistance } from "@/utils/geoUtils";

// Cache for generated spots to avoid redundant calculations
const spotCache = new Map<string, {
  spots: SharedAstroSpot[],
  timestamp: number
}>();

const SPOT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const BATCH_SIZE = 5; // Process spots in batches of 5 for better performance

/**
 * Generate spots using batched processing and improved spatial distribution
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radius Search radius in kilometers
 * @param limit Maximum number of spots to generate
 * @param minQuality Minimum SIQS score (0-10)
 * @returns Array of SharedAstroSpot objects
 */
export async function generateQualitySpots(
  centerLat: number,
  centerLng: number, 
  radius: number,
  limit: number = 10,
  minQuality: number = 5
): Promise<SharedAstroSpot[]> {
  // Check cache first
  const cacheKey = `spots-${centerLat.toFixed(2)}-${centerLng.toFixed(2)}-${radius}-${limit}`;
  const cachedSpots = spotCache.get(cacheKey);
  
  if (cachedSpots && Date.now() - cachedSpots.timestamp < SPOT_CACHE_DURATION) {
    console.log(`Using cached spots for ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`);
    return cachedSpots.spots;
  }
  
  console.log(`Generating ${limit} quality spots within ${radius}km of [${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}]`);
  
  try {
    // Generate candidate points using square root distribution
    // This creates a more even distribution across the area
    const points = generateOptimalDistributionPoints(centerLat, centerLng, radius, limit * 3);
    
    // Process points in batches for better performance
    const validSpots: SharedAstroSpot[] = [];
    const batches = chunkArray(points, BATCH_SIZE);
    
    for (const batch of batches) {
      if (validSpots.length >= limit) break;
      
      const batchPromises = batch.map(async point => {
        // Skip water locations early
        if (isWaterLocation(point.latitude, point.longitude)) {
          return null;
        }
        
        try {
          // Get terrain-corrected Bortle scale for better accuracy
          const correctedBortleScale = await getTerrainCorrectedBortleScale(
            point.latitude, 
            point.longitude
          ) || 4;
          
          // Calculate SIQS with improved parameters
          const siqsResult = await calculateRealTimeSiqs(
            point.latitude,
            point.longitude,
            correctedBortleScale
          );
          
          // Filter by quality threshold
          if (siqsResult && siqsResult.siqs >= minQuality) {
            return createSpotFromPoint(point, siqsResult.siqs, siqsResult.isViable, correctedBortleScale);
          }
        } catch (err) {
          console.warn("Error processing spot:", err);
        }
        
        return null;
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validBatchSpots = batchResults.filter(Boolean) as SharedAstroSpot[];
      validSpots.push(...validBatchSpots);
    }
    
    // Sort by quality and apply final spatial filtering
    const sortedSpots = sortByQualityAndDistance(validSpots)
      .slice(0, limit);
    
    // Cache the results
    spotCache.set(cacheKey, {
      spots: sortedSpots,
      timestamp: Date.now()
    });
    
    console.log(`Generated ${sortedSpots.length} quality spots`);
    return sortedSpots;
    
  } catch (error) {
    console.error("Error generating quality spots:", error);
    return [];
  }
}

/**
 * Generate points with improved spatial distribution using square root distance
 * This creates a more even distribution of points across the search radius
 */
function generateOptimalDistributionPoints(
  centerLat: number, 
  centerLng: number,
  radiusKm: number,
  count: number
): { latitude: number; longitude: number; distance: number }[] {
  const points: { latitude: number; longitude: number; distance: number }[] = [];
  
  // Use square root distribution for more even spatial distribution
  for (let i = 0; i < count; i++) {
    // Square root distribution - more even across the entire area
    const randomDistance = radiusKm * Math.sqrt(Math.random());
    const randomAngle = Math.random() * 2 * Math.PI;
    
    // Convert polar to cartesian coordinates
    const offsetX = randomDistance * Math.cos(randomAngle);
    const offsetY = randomDistance * Math.sin(randomAngle);
    
    // Convert offsets to lat/lng (approximation)
    const latOffset = offsetY / 111.32;
    const lngOffset = offsetX / (111.32 * Math.cos(centerLat * Math.PI / 180));
    
    const latitude = centerLat + latOffset;
    const longitude = centerLng + lngOffset;
    
    // Calculate actual distance for accuracy
    const distance = calculateDistance(centerLat, centerLng, latitude, longitude);
    
    points.push({ latitude, longitude, distance });
  }
  
  return points;
}

/**
 * Create a spot object from a point with quality data
 */
function createSpotFromPoint(
  point: { latitude: number; longitude: number; distance: number },
  siqs: number,
  isViable: boolean,
  bortleScale: number
): SharedAstroSpot {
  return {
    id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Calculated Location',
    latitude: point.latitude,
    longitude: point.longitude,
    bortleScale,
    siqs: siqs * 10, // Convert 0-10 SIQS to 0-100 scale
    isViable,
    distance: point.distance,
    timestamp: new Date().toISOString()
  };
}

/**
 * Sort locations by quality (SIQS) and distance
 * with improved weighting factors
 */
function sortByQualityAndDistance(spots: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...spots].sort((a, b) => {
    const aScore = typeof a.siqs === 'number' ? a.siqs : 0;
    const bScore = typeof b.siqs === 'number' ? b.siqs : 0;
    
    // Weight SIQS more heavily (70%) than distance (30%)
    // This prioritizes spots with better viewing conditions
    const aQuality = (aScore * 0.7) - ((a.distance || 0) * 0.3);
    const bQuality = (bScore * 0.7) - ((b.distance || 0) * 0.3);
    
    return bQuality - aQuality;
  });
}

/**
 * Split array into chunks for batch processing
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Clear the spot cache
 */
export function clearSpotCache(): void {
  spotCache.clear();
}
