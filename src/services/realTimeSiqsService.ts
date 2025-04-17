
import { calculateRealTimeSiqs as calculateSiqs } from './realTimeSiqs/siqsCalculator';
import { clearSiqsCache } from './realTimeSiqs/siqsCache';

/**
 * Fetch real-time SIQS scores for a location with efficient caching
 */
export const fetchRealTimeSiqs = async (
  latitude: number,
  longitude: number,
  bortleScale: number = 5
) => {
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    console.error("Invalid coordinates for SIQS calculation");
    return { siqs: 0, isViable: false };
  }

  try {
    console.log(`Calculating SIQS for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    // This imports and uses the implementation from siqsCalculator.ts
    return await calculateSiqs(latitude, longitude, bortleScale);
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return { 
      siqs: 0, 
      isViable: false,
      error: "Failed to calculate SIQS"
    };
  }
};

/**
 * Clear SIQS calculation cache to force fresh data
 */
export const clearLocationCache = (): number => {
  try {
    // Clear in-memory cache
    const cleared = clearSiqsCache();
    
    // Also clear session storage entries related to SIQS
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('siqs_')) {
        sessionStorage.removeItem(key);
      }
    }
    
    console.log(`Cleared ${cleared} SIQS cache entries`);
    return cleared;
  } catch (error) {
    console.error("Error clearing SIQS cache:", error);
    return 0;
  }
};
