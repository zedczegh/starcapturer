
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
};

/**
 * Check if a similar spot exists within the specified threshold
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
  
  return false;
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
    
    // Skip if similar spot exists nearby (avoid duplication)
    if (hasSimilarSpot(point.latitude, point.longitude)) {
      return null;
    }
    
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
    
    if (siqsResult && siqsResult.siqs >= minQuality) {
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
};

export const getSpotCacheSize = (): number => {
  return spotMemoryCache.size;
};
