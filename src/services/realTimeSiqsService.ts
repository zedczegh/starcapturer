
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

// Re-export for backward compatibility
export const calculateRealTimeSiqs = fetchRealTimeSiqs;

/**
 * Batch calculate SIQS scores for multiple locations
 */
export const batchCalculateSiqs = async (
  locations: Array<{ latitude: number; longitude: number; bortleScale?: number }>
) => {
  if (!locations || !locations.length) {
    console.log("No locations provided for batch SIQS calculation");
    return [];
  }
  
  console.log(`Batch calculating SIQS for ${locations.length} locations`);
  const results = [];
  
  // Process locations in smaller batches to avoid overwhelming API
  const batchSize = 5;
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    const batchPromises = batch.map(loc => 
      fetchRealTimeSiqs(loc.latitude, loc.longitude, loc.bortleScale || 5)
        .catch(err => {
          console.error(`Error calculating SIQS for location:`, err);
          return { siqs: 0, isViable: false };
        })
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    for (let j = 0; j < batch.length; j++) {
      results.push({
        ...batch[j],
        siqsResult: batchResults[j]
      });
    }
    
    // Add small delay between batches
    if (i + batchSize < locations.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
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
