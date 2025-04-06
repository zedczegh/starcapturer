
/**
 * API functions for pollution data
 */
import { fetchWithTimeout } from './fetchUtils';

// Cache for pollution data to reduce API calls
const pollutionCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Fetch light pollution data
 */
export async function fetchLightPollutionData(latitude: number, longitude: number): Promise<any | null> {
  try {
    // Generate cache key
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    // Check cache (valid for 24 hours)
    const cachedData = pollutionCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < 24 * 60 * 60 * 1000) {
      return cachedData.data;
    }
    
    // Mock API call - in a real implementation, this would call a light pollution API
    // Simulate Bortle scale based on coordinates - more random for testing
    const latFactor = Math.abs((latitude % 10) / 10);
    const lngFactor = Math.abs((longitude % 10) / 10);
    const randomFactor = Math.random() * 2 - 1; // -1 to 1
    
    // Generate Bortle scale (1-9)
    const bortleScale = Math.max(1, Math.min(9, 
      Math.round(1 + (latFactor + lngFactor) * 4 + randomFactor)
    ));
    
    // Create pollution data
    const pollutionData = {
      bortleScale,
      lightPollutionIndex: ((bortleScale - 1) / 8) * 100, // 0-100
      skyQuality: 22 - (bortleScale * 1.5) // 22 (best) to 8 (worst) mag/arcsec²
    };
    
    // Cache the data
    pollutionCache.set(cacheKey, {
      data: pollutionData,
      timestamp: Date.now()
    });
    
    return pollutionData;
  } catch (error) {
    console.error("Error fetching light pollution data:", error);
    return null;
  }
}

/**
 * Get pollution cache statistics
 */
export function getPollutionCacheStats() {
  const now = Date.now();
  let totalAge = 0;
  
  pollutionCache.forEach(item => {
    totalAge += now - item.timestamp;
  });
  
  return {
    size: pollutionCache.size,
    averageAge: pollutionCache.size > 0 ? Math.round(totalAge / pollutionCache.size / 1000) : 0
  };
}

/**
 * Clean up expired pollution cache entries
 */
export function cleanupExpiredPollutionCache() {
  const now = Date.now();
  const expiry = 24 * 60 * 60 * 1000; // 24 hours
  
  pollutionCache.forEach((value, key) => {
    if (now - value.timestamp > expiry) {
      pollutionCache.delete(key);
    }
  });
}
