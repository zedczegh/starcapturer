
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/validation';

// Helper to generate unique IDs for calculated locations
const generateUniqueId = () => `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Use a worker for location generation if supported
let pointGeneratorWorker: Worker | null = null;

try {
  if (typeof Worker !== 'undefined') {
    pointGeneratorWorker = new Worker(new URL('../workers/pointGenerator.ts', import.meta.url), { type: 'module' });
  }
} catch (error) {
  console.error('Error creating worker:', error);
}

/**
 * Find calculated astronomical viewing locations
 * @param latitude Central latitude for search
 * @param longitude Central longitude for search
 * @param searchRadius Radius in km to search within
 * @param limit Maximum number of locations to return
 * @returns Promise resolving to array of calculated locations
 */
export async function findCalculatedLocations(
  latitude: number,
  longitude: number,
  searchRadius: number = 100,
  limit: number = 10
): Promise<SharedAstroSpot[]> {
  if (!latitude || !longitude) {
    console.warn('Invalid coordinates for location search');
    return [];
  }
  
  // Try to use worker for better performance
  if (pointGeneratorWorker) {
    return findCalculatedLocationsWithWorker(latitude, longitude, searchRadius, limit);
  } else {
    // Fallback to direct generation
    return findCalculatedLocationsSync(latitude, longitude, searchRadius, limit);
  }
}

/**
 * Find calculated locations using a web worker for better performance
 */
function findCalculatedLocationsWithWorker(
  latitude: number,
  longitude: number,
  searchRadius: number = 100,
  limit: number = 10
): Promise<SharedAstroSpot[]> {
  return new Promise((resolve, reject) => {
    if (!pointGeneratorWorker) {
      reject(new Error('Worker not available'));
      return;
    }
    
    // Set up message handler
    pointGeneratorWorker.onmessage = async (e) => {
      const points = e.data;
      
      if (!points || points.length === 0) {
        resolve([]);
        return;
      }
      
      try {
        const enhancedPoints = await enhancePointsWithSIQS(points, latitude, longitude);
        resolve(enhancedPoints.slice(0, limit));
      } catch (error) {
        console.error('Error enhancing points:', error);
        reject(error);
      }
    };
    
    // Set up error handler
    pointGeneratorWorker.onerror = (error) => {
      console.error('Worker error:', error);
      reject(error);
    };
    
    // Request point generation
    pointGeneratorWorker.postMessage({
      centerLat: latitude,
      centerLng: longitude,
      radius: searchRadius,
      count: Math.min(limit * 2, 30) // Generate more points than needed to ensure quality
    });
  });
}

/**
 * Synchronous version of location finding without web worker
 */
async function findCalculatedLocationsSync(
  latitude: number,
  longitude: number,
  searchRadius: number = 100,
  limit: number = 10
): Promise<SharedAstroSpot[]> {
  // Import dynamically to avoid worker context issues
  const { generateRandomPoint } = await import('@/services/locationFilters');
  
  const points = [];
  const maxAttempts = limit * 5;
  let attempts = 0;
  
  while (points.length < Math.min(limit * 2, 20) && attempts < maxAttempts) {
    const point = generateRandomPoint(latitude, longitude, searchRadius);
    attempts++;
    
    if (!isWaterLocation(point.latitude, point.longitude)) {
      // Check if point is unique enough
      if (!points.some(existing => 
        Math.abs(existing.latitude - point.latitude) < 0.03 && 
        Math.abs(existing.longitude - point.longitude) < 0.03
      )) {
        points.push(point);
      }
    }
  }
  
  if (points.length === 0) {
    return [];
  }
  
  const enhancedPoints = await enhancePointsWithSIQS(points, latitude, longitude);
  return enhancedPoints.slice(0, limit);
}

/**
 * Add SIQS scores and other enhanced data to raw points
 */
async function enhancePointsWithSIQS(
  points: any[],
  userLatitude: number,
  userLongitude: number
): Promise<SharedAstroSpot[]> {
  // Process points in parallel for better performance
  const enhancedPointsPromises = points.map(async (point) => {
    try {
      // Calculate distance from user location
      const distance = calculateDistance(
        userLatitude,
        userLongitude,
        point.latitude,
        point.longitude
      );
      
      // Default bortle scale as fallback
      const defaultBortleScale = 4;
      
      // Calculate SIQS for this location - fixed by adding the missing parameter
      const siqsResult = await calculateRealTimeSiqs(point.latitude, point.longitude, defaultBortleScale);
      
      // Skip locations with poor SIQS scores
      if (!siqsResult || siqsResult.siqs < 3) {
        return null;
      }
      
      return {
        id: generateUniqueId(),
        name: 'Calculated Location',
        latitude: point.latitude,
        longitude: point.longitude,
        bortleScale: Math.floor(10 - siqsResult.siqs),
        siqs: siqsResult.siqs * 10,
        isViable: true,
        distance,
        timestamp: new Date().toISOString()
      } as SharedAstroSpot;
    } catch (error) {
      console.warn('Error calculating SIQS for point:', error);
      return null;
    }
  });
  
  // Wait for all promises to resolve
  const results = await Promise.all(enhancedPointsPromises);
  
  // Filter out nulls and sort by SIQS score (highest first)
  return results
    .filter((p): p is SharedAstroSpot => p !== null)
    .sort((a, b) => {
      // First by SIQS
      const aScore = typeof a.siqs === 'number' ? a.siqs : (a.siqs?.score || 0);
      const bScore = typeof b.siqs === 'number' ? b.siqs : (b.siqs?.score || 0);
      const siqsComparison = bScore - aScore;
      
      if (siqsComparison !== 0) return siqsComparison;
      
      // Then by distance
      return (a.distance || Infinity) - (b.distance || Infinity);
    });
}
