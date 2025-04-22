
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { generateRandomPoint, generatePointGrid } from "./locationFilters";
import { isWaterLocation } from "@/utils/validation";
import { calculateDistance } from "@/utils/geoUtils";
import { calculateRealTimeSiqs } from "./realTimeSiqs/siqsCalculator";

/**
 * Generate high-quality astronomy spots around a center point
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radius Radius in kilometers
 * @param limit Maximum number of spots to generate
 * @param minSiqs Minimum SIQS score required (0-10)
 * @returns Promise resolving to array of quality spots
 */
export async function generateQualitySpots(
  centerLat: number,
  centerLng: number,
  radius: number,
  limit: number = 10,
  minSiqs: number = 3
): Promise<SharedAstroSpot[]> {
  // Use multiple spot generation strategies for better diversity
  const strategies = [
    // Strategy 1: Grid-based placement for uniform distribution
    async () => {
      const gridPoints = generatePointGrid(centerLat, centerLng, radius, 3);
      return enhanceGridPoints(gridPoints, centerLat, centerLng, minSiqs);
    },
    
    // Strategy 2: Random placement for organic distribution
    async () => {
      const randomPoints = [];
      const count = Math.max(limit * 2, 20);
      
      for (let i = 0; i < count; i++) {
        randomPoints.push(generateRandomPoint(centerLat, centerLng, radius));
      }
      
      return enhanceRandomPoints(randomPoints, centerLat, centerLng, minSiqs);
    },
    
    // Strategy 3: Elevation-biased placement (high points often have better visibility)
    async () => {
      // This is a simplified version, in a real app we'd use elevation data
      // For now, we'll use random points with a distance bias (further points might be on hills)
      const biasedPoints = [];
      const count = Math.max(limit, 10);
      
      for (let i = 0; i < count; i++) {
        const point = generateRandomPoint(centerLat, centerLng, radius * 0.8 + (radius * 0.2 * Math.random()));
        biasedPoints.push(point);
      }
      
      return enhanceRandomPoints(biasedPoints, centerLat, centerLng, minSiqs);
    }
  ];
  
  // Execute all strategies in parallel for better performance
  try {
    const results = await Promise.all(strategies.map(strategy => strategy()));
    
    // Combine results from all strategies
    const combinedResults = results.flat();
    
    // Filter for uniqueness using grid-based deduplication
    const uniqueSpots = filterUniqueSpots(combinedResults);
    
    // Sort by SIQS score (highest first)
    const sortedSpots = uniqueSpots.sort((a, b) => {
      const aScore = typeof a.siqs === 'number' ? a.siqs : (a.siqs?.score || 0);
      const bScore = typeof b.siqs === 'number' ? b.siqs : (b.siqs?.score || 0);
      return bScore - aScore;
    });
    
    return sortedSpots.slice(0, limit);
  } catch (error) {
    console.error("Error generating quality spots:", error);
    return [];
  }
}

/**
 * Enhance grid points with SIQS scores and other metadata
 */
async function enhanceGridPoints(
  points: Array<{ latitude: number; longitude: number; distance: number }>,
  centerLat: number,
  centerLng: number,
  minSiqs: number
): Promise<SharedAstroSpot[]> {
  // Filter out points on water
  const validPoints = points.filter(p => !isWaterLocation(p.latitude, p.longitude));
  
  // Calculate SIQS for each point - do this in batches to prevent overwhelming APIs
  const batchSize = 5;
  const results: SharedAstroSpot[] = [];
  
  for (let i = 0; i < validPoints.length; i += batchSize) {
    const batch = validPoints.slice(i, i + batchSize);
    const batchPromises = batch.map(async point => {
      try {
        // Default bortle scale as fallback
        const defaultBortleScale = 4;
        
        // Fixed by adding the missing parameter
        const siqsResult = await calculateRealTimeSiqs(point.latitude, point.longitude, defaultBortleScale);
        
        if (!siqsResult || siqsResult.siqs < minSiqs) {
          return null;
        }
        
        return {
          id: `grid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: 'Quality Observation Point',
          latitude: point.latitude,
          longitude: point.longitude,
          bortleScale: Math.max(1, Math.floor(10 - siqsResult.siqs)),
          siqs: siqsResult.siqs * 10,
          isViable: true,
          distance: point.distance,
          timestamp: new Date().toISOString()
        } as SharedAstroSpot;
      } catch (error) {
        console.warn('Error calculating SIQS for grid point:', error);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r): r is SharedAstroSpot => r !== null));
    
    // If we have enough results, stop processing
    if (results.length >= 10) break;
  }
  
  return results;
}

/**
 * Enhance random points with SIQS scores and other metadata
 */
async function enhanceRandomPoints(
  points: Array<{ latitude: number; longitude: number; distance: number }>,
  centerLat: number,
  centerLng: number,
  minSiqs: number
): Promise<SharedAstroSpot[]> {
  // Filter out points on water
  const validPoints = points.filter(p => !isWaterLocation(p.latitude, p.longitude));
  
  // Calculate SIQS for each point - do this in batches to prevent overwhelming APIs
  const batchSize = 5;
  const results: SharedAstroSpot[] = [];
  
  for (let i = 0; i < validPoints.length; i += batchSize) {
    const batch = validPoints.slice(i, i + batchSize);
    const batchPromises = batch.map(async point => {
      try {
        // Default bortle scale as fallback
        const defaultBortleScale = 4;
        
        // Fixed by adding the missing parameter
        const siqsResult = await calculateRealTimeSiqs(point.latitude, point.longitude, defaultBortleScale);
        
        if (!siqsResult || siqsResult.siqs < minSiqs) {
          return null;
        }
        
        return {
          id: `random-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: 'Calculated Observation Point',
          latitude: point.latitude,
          longitude: point.longitude,
          bortleScale: Math.max(1, Math.floor(10 - siqsResult.siqs)),
          siqs: siqsResult.siqs * 10,
          isViable: true,
          distance: point.distance,
          timestamp: new Date().toISOString()
        } as SharedAstroSpot;
      } catch (error) {
        console.warn('Error calculating SIQS for random point:', error);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r): r is SharedAstroSpot => r !== null));
    
    // If we have enough results, stop processing
    if (results.length >= 10) break;
  }
  
  return results;
}

/**
 * Filter for unique spots using grid-based deduplication
 */
function filterUniqueSpots(spots: SharedAstroSpot[]): SharedAstroSpot[] {
  const gridCells = new Map<string, SharedAstroSpot>();
  
  // Grid size in degrees (approximately 1-2km)
  const gridSize = 0.02;
  
  spots.forEach(spot => {
    // Create a grid cell key using truncated coordinates
    const gridX = Math.floor(spot.latitude / gridSize);
    const gridY = Math.floor(spot.longitude / gridSize);
    const cellKey = `${gridX},${gridY}`;
    
    // If cell is empty or new spot has better SIQS, use it
    if (!gridCells.has(cellKey) || 
        (getSiqsValue(gridCells.get(cellKey)?.siqs || 0) < getSiqsValue(spot.siqs || 0))) {
      gridCells.set(cellKey, spot);
    }
  });
  
  return Array.from(gridCells.values());
}

/**
 * Helper function to get a numeric value from a SIQS property,
 * regardless of whether it's a number or an object with score
 */
function getSiqsValue(siqs: number | { score: number, isViable: boolean } | any): number {
  if (typeof siqs === 'number') {
    return siqs;
  }
  if (siqs && typeof siqs === 'object' && 'score' in siqs) {
    return siqs.score;
  }
  return 0;
}

/**
 * Validates a single astro spot against filtering criteria
 * with enhanced precision
 */
function isValidAstroSpot(
  spot: SharedAstroSpot, 
  qualityThreshold: number
): boolean {
  if (!spot.latitude || !spot.longitude) {
    return false;
  }

  if (isWaterLocation(spot.latitude, spot.longitude, false)) {
    return false;
  }

  if (spot.siqs !== undefined && getSiqsValue(spot.siqs) < qualityThreshold) {
    return false;
  }

  return true;
}

// Re-export location store functions
export {
  addLocationToStore,
  getLocationFromStore,
  getAllLocationsFromStore,
  clearLocationStore
} from './locationStore';
