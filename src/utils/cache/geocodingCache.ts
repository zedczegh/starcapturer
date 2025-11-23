import { cacheManager, CacheKeys } from './cacheManager';

const GEOCODE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Track pending requests to prevent duplicates
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Cached reverse geocoding with deduplication
 * Prevents multiple simultaneous requests for the same location
 */
export const cachedReverseGeocode = async (
  lat: number,
  lng: number,
  geocodeFunction: (lat: number, lng: number) => Promise<any>
): Promise<any> => {
  const key = CacheKeys.reverseGeocode(lat, lng);
  
  // Check cache first
  const cached = cacheManager.get(key);
  if (cached) {
    return cached;
  }

  // Check if request is already pending
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending;
  }

  // Create new request
  const request = geocodeFunction(lat, lng)
    .then(result => {
      cacheManager.set(key, result, GEOCODE_CACHE_TTL);
      pendingRequests.delete(key);
      return result;
    })
    .catch(error => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, request);
  return request;
};

/**
 * Clear geocoding cache for a specific location
 */
export const clearGeocodeCache = (lat: number, lng: number) => {
  const key = CacheKeys.reverseGeocode(lat, lng);
  cacheManager.clear(key);
};
