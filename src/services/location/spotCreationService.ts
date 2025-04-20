
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';
import { isWaterLocation } from '@/utils/validation';
import { getEnhancedLocationDetails } from '../geocoding/enhancedReverseGeocoding';
import { getLocationTimeInfo } from '@/utils/timezone/timeZoneCalculator';
import { SiqsCalculationOptions, SiqsResult } from '../realTimeSiqs/siqsTypes';

// Memory cache to avoid recalculating spots in the same session
const spotMemoryCache = new Map<string, SharedAstroSpot>();

// Fast spatial index using a grid system for quicker lookups
const spatialIndex = new Map<string, Set<string>>();

// Adaptive quality threshold based on location characteristics
const qualityThresholdsByRegion = new Map<string, number>();

// Predictive cache for next-search locations
const predictiveCache = new Set<string>();

/**
 * Get grid cell ID for spatial indexing
 * Using a grid system to quickly find nearby points
 */
const getGridCell = (lat: number, lng: number, precision: number = 2): string => {
  const latGrid = Math.floor(lat * precision);
  const lngGrid = Math.floor(lng * precision);
  return `${latGrid},${lngGrid}`;
};

/**
 * Add a spot to the spatial index for quick lookups
 */
const indexSpot = (spot: SharedAstroSpot): void => {
  const cellId = getGridCell(spot.latitude, spot.longitude);
  if (!spatialIndex.has(cellId)) {
    spatialIndex.set(cellId, new Set());
  }
  spatialIndex.get(cellId)?.add(spot.id);
  
  // Predictively add to surrounding cells for faster future lookups
  const surroundingCells = getSurroundingCells(spot.latitude, spot.longitude);
  for (const cell of surroundingCells) {
    if (!spatialIndex.has(cell)) {
      spatialIndex.set(cell, new Set());
    }
    spatialIndex.get(cell)?.add(spot.id);
  }
};

/**
 * Get surrounding grid cells for predictive caching
 */
const getSurroundingCells = (lat: number, lng: number, precision: number = 2): string[] => {
  const cells = [];
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const latGrid = Math.floor((lat + (i * 0.5 / precision)) * precision);
      const lngGrid = Math.floor((lng + (j * 0.5 / precision)) * precision);
      cells.push(`${latGrid},${lngGrid}`);
    }
  }
  return cells;
};

/**
 * Analyze location characteristics to determine optimal quality threshold
 */
const determineOptimalQualityThreshold = (lat: number, lng: number): number => {
  const regionKey = getGridCell(lat, lng, 0.5);
  
  if (qualityThresholdsByRegion.has(regionKey)) {
    return qualityThresholdsByRegion.get(regionKey) || 5;
  }
  
  // Default threshold with slight randomization for exploration
  const baseThreshold = 5;
  const randomFactor = Math.random() * 0.5 - 0.25; // -0.25 to +0.25
  const threshold = Math.max(4, Math.min(7, baseThreshold + randomFactor));
  
  qualityThresholdsByRegion.set(regionKey, threshold);
  return threshold;
};

/**
 * Check if a similar spot exists within the specified threshold
 * with adaptive distance weighting
 */
const hasSimilarSpot = (lat: number, lng: number, distanceThreshold: number = 0.01): boolean => {
  const cellId = getGridCell(lat, lng);
  const spotsInCell = spatialIndex.get(cellId);
  
  if (!spotsInCell) return false;
  
  for (const spotId of spotsInCell) {
    const spot = spotMemoryCache.get(spotId);
    if (spot) {
      const latDiff = Math.abs(spot.latitude - lat);
      const lngDiff = Math.abs(spot.longitude - lng);
      
      // Quick distance check using coordinate differences
      // This is faster than full Haversine calculation for nearby points
      if (latDiff < distanceThreshold && lngDiff < distanceThreshold) {
        return true;
      }
    }
  }
  
  // Check surrounding cells but with a tighter threshold
  const surroundingCells = getSurroundingCells(lat, lng);
  for (const cell of surroundingCells) {
    const spotsInSurroundingCell = spatialIndex.get(cell);
    if (spotsInSurroundingCell) {
      for (const spotId of spotsInSurroundingCell) {
        const spot = spotMemoryCache.get(spotId);
        if (spot) {
          const latDiff = Math.abs(spot.latitude - lat);
          const lngDiff = Math.abs(spot.longitude - lng);
          
          // Tighter threshold for surrounding cells
          const tighterThreshold = distanceThreshold * 0.7;
          if (latDiff < tighterThreshold && lngDiff < tighterThreshold) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
};

/**
 * Predict and cache locations likely to be searched next
 */
const predictNextLocations = (lat: number, lng: number): void => {
  // Predict in 8 compass directions
  const directions = [
    [1, 0], [1, 1], [0, 1], [-1, 1], 
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];
  
  directions.forEach(([latMult, lngMult]) => {
    const predictedLat = lat + (latMult * 0.1);
    const predictedLng = lng + (lngMult * 0.1);
    predictiveCache.add(`${predictedLat.toFixed(5)}-${predictedLng.toFixed(5)}`);
  });
};

export const createSpotFromPoint = async (
  point: { latitude: number; longitude: number; distance: number },
  minQuality: number = 5,
  precalculatedSiqs?: SiqsResult
): Promise<SharedAstroSpot | null> => {
  try {
    // Quick rejection cases for performance
    if (isWaterLocation(point.latitude, point.longitude)) {
      return null;
    }
    
    // Check memory cache first using coordinate key
    const cacheKey = `${point.latitude.toFixed(5)}-${point.longitude.toFixed(5)}`;
    if (spotMemoryCache.has(cacheKey)) {
      return spotMemoryCache.get(cacheKey) || null;
    }
    
    // Check predictive cache for warm cache hits
    if (predictiveCache.has(cacheKey)) {
      console.log("Predictive cache hit!");
      predictiveCache.delete(cacheKey); // Remove after hit
    }
    
    // Skip if similar spot exists nearby (avoid duplication)
    if (hasSimilarSpot(point.latitude, point.longitude)) {
      return null;
    }
    
    // Adaptively determine quality threshold based on region
    const adaptiveMinQuality = determineOptimalQualityThreshold(
      point.latitude,
      point.longitude
    );
    
    // Use adapted threshold if it's higher than provided threshold
    const effectiveMinQuality = Math.max(minQuality, adaptiveMinQuality);
    
    // Proceed with creation if we reach here
    const locationDetails = await getEnhancedLocationDetails(
      point.latitude,
      point.longitude
    );
    
    if (locationDetails.isWater) {
      return null;
    }
    
    const timeInfo = getLocationTimeInfo(point.latitude, point.longitude);
    const defaultBortleScale = 4;
    
    let siqsResult: SiqsResult;
    
    // Use precalculated SIQS if available to reduce API calls
    if (precalculatedSiqs) {
      siqsResult = precalculatedSiqs;
    } else {
      const options: SiqsCalculationOptions = {
        useSingleHourSampling: true,
        targetHour: 1, // Use 1 AM for optimal viewing conditions
        cacheDurationMins: 30,
        maxConcurrent: 2, // Limit concurrent requests to avoid rate limiting
        anomalyDetection: true // Enable anomaly detection for better results
      };

      siqsResult = await calculateRealTimeSiqs(
        point.latitude,
        point.longitude,
        defaultBortleScale,
        options
      );
    }
    
    if (siqsResult && siqsResult.siqs >= effectiveMinQuality) {
      const newSpot: SharedAstroSpot = {
        id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: locationDetails.name || 'Calculated Location',
        latitude: point.latitude,
        longitude: point.longitude,
        bortleScale: defaultBortleScale,
        siqs: siqsResult.siqs * 10,
        isViable: siqsResult.isViable,
        distance: point.distance,
        timestamp: new Date().toISOString(),
        timeInfo: {
          isNighttime: timeInfo.isNighttime,
          timeUntilNight: timeInfo.timeUntilNight,
          timeUntilDaylight: timeInfo.timeUntilDaylight
        }
      };
      
      // Cache the result to avoid recalculation
      spotMemoryCache.set(cacheKey, newSpot);
      indexSpot(newSpot);
      
      // Predict and cache next likely locations
      predictNextLocations(point.latitude, point.longitude);
      
      return newSpot;
    }
    
    return null;
  } catch (err) {
    console.warn("Error processing spot:", err);
    return null;
  }
};

// Export methods for cache management
export const clearSpotCache = (): void => {
  spotMemoryCache.clear();
  spatialIndex.clear();
  qualityThresholdsByRegion.clear();
  predictiveCache.clear();
};

export const getSpotCacheSize = (): number => {
  return spotMemoryCache.size;
};
