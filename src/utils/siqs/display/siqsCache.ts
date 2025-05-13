
// SIQS Cache implementation for storing real-time SIQS values
import { optimizedCache } from '@/utils/optimizedCache';

const SIQS_CACHE_PREFIX = 'realtime-siqs-';
const CACHE_EXPIRY_HOURS = 3; // Cache expires after 3 hours

// Generate a cache key for a location
const getSiqsCacheKey = (lat: number, lng: number): string => {
  // Round coordinates to 3 decimal places for better cache hits
  const roundedLat = Math.round(lat * 1000) / 1000;
  const roundedLng = Math.round(lng * 1000) / 1000;
  return `${SIQS_CACHE_PREFIX}${roundedLat},${roundedLng}`;
};

// Get cached SIQS for a location
export const getCachedRealTimeSiqs = (lat: number, lng: number): number | null => {
  const key = getSiqsCacheKey(lat, lng);
  const cachedData = optimizedCache.get(key);
  
  if (!cachedData) return null;
  
  // Type guard to check if cachedData has expected structure
  if (typeof cachedData === 'object' && cachedData !== null && 'timestamp' in cachedData) {
    // Check if cache is still valid
    const timestamp = (cachedData as {timestamp: number}).timestamp;
    const expiryTime = timestamp + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);
    
    if (Date.now() < expiryTime && 'value' in cachedData) {
      return typeof (cachedData as {value: any}).value === 'number' ? (cachedData as {value: number}).value : null;
    }
  }
  
  return null;
};

// Store SIQS in cache
export const setCachedRealTimeSiqs = (lat: number, lng: number, siqs: number): void => {
  const key = getSiqsCacheKey(lat, lng);
  const cacheData = {
    value: siqs,
    timestamp: Date.now()
  };
  
  optimizedCache.set(key, cacheData, CACHE_EXPIRY_HOURS * 60 * 60);
};

// Clear all SIQS cache entries
export const clearRealTimeSiqsCache = (): void => {
  // Get all keys in the cache
  const allKeys = optimizedCache.keys();
  
  // Filter for SIQS cache keys and delete them
  allKeys
    .filter(key => key.startsWith(SIQS_CACHE_PREFIX))
    .forEach(key => optimizedCache.delete(key));
};

