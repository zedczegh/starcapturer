
/**
 * Enhanced SIQS caching system
 * 
 * This module provides in-memory and persistent caching for SIQS calculations
 * to improve performance and reduce API calls.
 */

import { SiqsResult } from './siqsTypes';

// Cache duration constants
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes default
const CERTIFIED_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for certified locations
const AUTO_CLEANUP_INTERVAL = 60 * 1000; // Clean up every minute

// In-memory cache storage
const siqsCache = new Map<string, SiqsResult & { timestamp: number }>();

// Auto cleanup interval reference
let cleanupInterval: number | null = null;

/**
 * Generate a cache key for a location
 */
export function getLocationKey(latitude: number, longitude: number): string {
  // Round to 4 decimal places for reasonable location grouping
  return `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
}

/**
 * Get appropriate cache duration based on location properties
 */
export function getCacheDuration(isCertified = false): number {
  return isCertified ? CERTIFIED_CACHE_DURATION : CACHE_DURATION;
}

/**
 * Check if SIQS is cached for a specific location
 */
export function hasCachedSiqs(latitude: number, longitude: number): boolean {
  const key = getLocationKey(latitude, longitude);
  
  if (siqsCache.has(key)) {
    const cached = siqsCache.get(key);
    if (cached) {
      const now = Date.now();
      const age = now - cached.timestamp;
      
      // Check if cache is still valid
      if (age < CACHE_DURATION) {
        return true;
      }
      
      // If expired, remove from cache
      siqsCache.delete(key);
    }
  }
  
  return false;
}

/**
 * Get cached SIQS for a specific location
 */
export function getCachedSiqs(latitude: number, longitude: number): SiqsResult | null {
  const key = getLocationKey(latitude, longitude);
  
  if (siqsCache.has(key)) {
    const cached = siqsCache.get(key);
    if (cached) {
      const now = Date.now();
      const age = now - cached.timestamp;
      
      // Check if cache is still valid
      if (age < CACHE_DURATION) {
        return cached;
      }
      
      // If expired, remove from cache
      siqsCache.delete(key);
    }
  }
  
  return null;
}

/**
 * Store SIQS in cache
 */
export function setSiqsCache(latitude: number, longitude: number, result: SiqsResult): void {
  const key = getLocationKey(latitude, longitude);
  
  // Store result with timestamp
  siqsCache.set(key, {
    ...result,
    timestamp: Date.now()
  });
  
  // Store in local storage for persistence
  try {
    const storageKey = `siqs_${key}`;
    const storageValue = JSON.stringify({
      result,
      timestamp: Date.now()
    });
    localStorage.setItem(storageKey, storageValue);
  } catch (error) {
    console.error("Error saving SIQS to local storage:", error);
  }
}

/**
 * Clear SIQS cache for a specific location or all locations
 */
export function clearSiqsCache(latitude?: number, longitude?: number): void {
  if (latitude !== undefined && longitude !== undefined) {
    // Clear specific location
    const key = getLocationKey(latitude, longitude);
    siqsCache.delete(key);
    
    try {
      const storageKey = `siqs_${key}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error removing SIQS from local storage:", error);
    }
  } else {
    // Clear all cache
    siqsCache.clear();
    
    // Clear all SIQS entries from localStorage
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('siqs_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error clearing SIQS from local storage:", error);
    }
  }
}

/**
 * Initialize cache from local storage on app start
 */
export function initSiqsCache(): void {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('siqs_')) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const now = Date.now();
            const age = now - parsed.timestamp;
            
            // Only load if not expired
            if (age < CACHE_DURATION) {
              const locationKey = key.replace('siqs_', '');
              siqsCache.set(locationKey, {
                ...parsed.result,
                timestamp: parsed.timestamp
              });
            } else {
              // Remove expired entries
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Invalid entry, remove it
            localStorage.removeItem(key);
          }
        }
      }
    });
  } catch (error) {
    console.error("Error initializing SIQS cache from local storage:", error);
  }
}

/**
 * Clear SIQS cache for a specific location
 * This is an alias for clearSiqsCache with specific coordinates
 */
export function clearLocationSiqsCache(latitude: number, longitude: number): void {
  clearSiqsCache(latitude, longitude);
}

/**
 * Get the number of entries in the SIQS cache
 */
export function getSiqsCacheSize(): number {
  return siqsCache.size;
}

/**
 * Clean up expired cache entries
 * @returns Number of entries cleaned up
 */
export function cleanupExpiredCache(): number {
  let cleanedCount = 0;
  const now = Date.now();
  
  // Clean memory cache
  siqsCache.forEach((entry, key) => {
    const age = now - entry.timestamp;
    if (age > CACHE_DURATION) {
      siqsCache.delete(key);
      cleanedCount++;
    }
  });
  
  // Clean localStorage cache
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('siqs_')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed = JSON.parse(cached);
            const age = now - parsed.timestamp;
            if (age > CACHE_DURATION) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch (e) {
          // Invalid entry, remove it
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    });
  } catch (error) {
    console.error("Error cleaning up localStorage cache:", error);
  }
  
  return cleanedCount;
}

// Initialize cache on module load
// (if this is called in the browser environment)
if (typeof window !== 'undefined') {
  initSiqsCache();
}

// Export constants for use in other modules
export { CACHE_DURATION, CERTIFIED_CACHE_DURATION, AUTO_CLEANUP_INTERVAL };
