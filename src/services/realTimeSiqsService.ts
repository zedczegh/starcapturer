
import { calculateRealTimeSiqs as calculateSiqs } from './realTimeSiqs/siqsCalculator';
import { clearSiqsCache as clearAllSiqsCache, clearLocationSiqsCache } from './realTimeSiqs/siqsCache';

/**
 * Calculate real-time SIQS based on current conditions at a location
 */
export const calculateRealTimeSiqs = calculateSiqs;

// Export cache clearing functions
export const clearSiqsCache = clearAllSiqsCache;
export { clearLocationSiqsCache };
