
/**
 * Enhanced SIQS caching system
 * 
 * This module provides in-memory and persistent caching for SIQS calculations
 * to improve performance and reduce API calls.
 */

import { SiqsResult } from './siqsTypes';
import { getLocationKey, getCacheDuration, AUTO_CLEANUP_INTERVAL } from './cacheConfig';

// In-memory cache storage
const siqsCache = new Map<string, SiqsResult & { timestamp: number }>();

// Auto cleanup interval reference
let cleanupInterval: number | null = null;

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
      if (age < getCacheDuration()) {
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
      if (age < getCacheDuration()) {
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
  
  // Start cleanup interval if not already running
  if (!cleanupInterval) {
    startCleanupInterval();
  }
  
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
 * Clear SIQS cache for a specific location
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
 * Clear location-specific SIQS cache
 */
export function clearLocationSiqsCache(locationId: string): void {
  try {
    // Clear from in-memory cache
    for (const key of siqsCache.keys()) {
      if (key.includes(locationId)) {
        siqsCache.delete(key);
      }
    }
    
    // Clear from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`siqs_`) && key.includes(locationId)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error clearing location SIQS from cache:", error);
  }
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache(): number {
  const now = Date.now();
  let expiredCount = 0;
  
  // Find and remove expired entries
  for (const [key, value] of siqsCache.entries()) {
    const age = now - value.timestamp;
    if (age > getCacheDuration()) {
      siqsCache.delete(key);
      expiredCount++;
      
      try {
        const storageKey = `siqs_${key}`;
        localStorage.removeItem(storageKey);
      } catch (error) {
        // Ignore storage errors during cleanup
      }
    }
  }
  
  return expiredCount;
}

/**
 * Get current size of SIQS cache
 */
export function getSiqsCacheSize(): number {
  return siqsCache.size;
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
            if (age < getCacheDuration()) {
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
    
    // Start cleanup interval
    startCleanupInterval();
  } catch (error) {
    console.error("Error initializing SIQS cache from local storage:", error);
  }
}

/**
 * Start the auto cleanup interval
 */
function startCleanupInterval(): void {
  if (cleanupInterval) {
    return;
  }
  
  cleanupInterval = window.setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    // Find expired entries
    siqsCache.forEach((value, key) => {
      const age = now - value.timestamp;
      if (age > getCacheDuration()) {
        keysToDelete.push(key);
      }
    });
    
    // Delete expired entries
    keysToDelete.forEach(key => {
      siqsCache.delete(key);
      
      try {
        const storageKey = `siqs_${key}`;
        localStorage.removeItem(storageKey);
      } catch (error) {
        // Ignore storage errors during cleanup
      }
    });
    
    // If cache is empty, stop the interval
    if (siqsCache.size === 0) {
      if (cleanupInterval !== null) {
        window.clearInterval(cleanupInterval);
        cleanupInterval = null;
      }
    }
  }, AUTO_CLEANUP_INTERVAL);
}

// Initialize cache on module load
// (if this is called in the browser environment)
if (typeof window !== 'undefined') {
  initSiqsCache();
}

// Export cache for debugging
export const _debugCache = siqsCache;
