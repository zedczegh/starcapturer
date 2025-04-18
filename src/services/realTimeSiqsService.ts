
import { calculateRealTimeSiqs as calculateSiqs } from './realTimeSiqs/siqsCalculator';
import { clearSiqsCache as clearAllSiqsCache, clearLocationSiqsCache as clearSingleLocationSiqsCache } from './realTimeSiqs/siqsCache';

/**
 * Calculate real-time SIQS based on current conditions at a location
 */
export const calculateRealTimeSiqs = calculateSiqs;

// Export cache clearing functions with appropriate parameters
export const clearSiqsCache = clearAllSiqsCache;

// Update to handle specific parameter format
export const clearLocationSiqsCache = (type: 'all' | 'location' = 'all', coordinates?: { latitude: number, longitude: number }) => {
  if (type === 'location' && coordinates) {
    return clearSingleLocationSiqsCache(coordinates.latitude, coordinates.longitude);
  } else {
    return clearAllSiqsCache();
  }
};
