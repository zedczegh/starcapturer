
/**
 * SIQS Cache Management
 * 
 * This module provides functionality to cache SIQS calculation results
 * to avoid recalculating the same values repeatedly.
 */

import { SiqsResult } from './siqsTypes';

// Cache duration constants
const DEFAULT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const LOCATION_CACHE_KEY_PREFIX = 'siqs-';

// In-memory cache for SIQS results
const siqsMemoryCache = new Map<string, {
  result: SiqsResult;
  timestamp: number;
  expiresAt: number;
}>();

/**
 * Generate a consistent cache key for a location
 */
function generateCacheKey(latitude: number, longitude: number): string {
  return `${LOCATION_CACHE_KEY_PREFIX}${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
}

/**
 * Check if SIQS data is cached for a specific location
 */
export function hasCachedSiqs(latitude: number, longitude: number): boolean {
  const cacheKey = generateCacheKey(latitude, longitude);
  const now = Date.now();
  
  // Check memory cache first (fastest)
  const memCached = siqsMemoryCache.get(cacheKey);
  if (memCached && memCached.expiresAt > now) {
    return true;
  }
  
  // Check localStorage if memory cache misses
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if (parsedCache.expiresAt > now) {
        // Refresh memory cache
        siqsMemoryCache.set(cacheKey, {
          result: parsedCache.result,
          timestamp: parsedCache.timestamp,
          expiresAt: parsedCache.expiresAt
        });
        return true;
      }
    }
  } catch (error) {
    console.error("Error checking SIQS cache:", error);
  }
  
  return false;
}

/**
 * Get cached SIQS data for a location
 */
export function getCachedSiqs(latitude: number, longitude: number): SiqsResult | null {
  const cacheKey = generateCacheKey(latitude, longitude);
  const now = Date.now();
  
  // Check memory cache first
  const memCached = siqsMemoryCache.get(cacheKey);
  if (memCached && memCached.expiresAt > now) {
    return memCached.result;
  }
  
  // Fall back to localStorage
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if (parsedCache.expiresAt > now) {
        return parsedCache.result;
      } else {
        // Clean up expired cache
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.error("Error retrieving cached SIQS:", error);
  }
  
  return null;
}

/**
 * Cache SIQS result for a location
 */
export function setSiqsCache(
  latitude: number,
  longitude: number,
  result: SiqsResult,
  durationMs: number = DEFAULT_CACHE_DURATION
): void {
  const cacheKey = generateCacheKey(latitude, longitude);
  const now = Date.now();
  const expiresAt = now + durationMs;
  
  const cacheData = {
    result,
    timestamp: now,
    expiresAt
  };
  
  // Update memory cache
  siqsMemoryCache.set(cacheKey, cacheData);
  
  // Update localStorage
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error setting SIQS cache:", error);
  }
}

/**
 * Clear SIQS cache for a specific location
 */
export function clearLocationSiqsCache(latitude: number, longitude: number): void {
  const cacheKey = generateCacheKey(latitude, longitude);
  
  // Clear from memory cache
  siqsMemoryCache.delete(cacheKey);
  
  // Clear from localStorage
  try {
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error("Error clearing SIQS cache for location:", error);
  }
}

/**
 * Clear all SIQS cache
 */
export function clearSiqsCache(): void {
  // Clear memory cache
  siqsMemoryCache.clear();
  
  // Clear localStorage cache
  try {
    const keys = Object.keys(localStorage);
    const siqsKeys = keys.filter(key => key.startsWith(LOCATION_CACHE_KEY_PREFIX));
    siqsKeys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing SIQS cache:", error);
  }
}

/**
 * Clean up expired cache entries
 * @returns Number of expired entries cleaned up
 */
export function cleanupExpiredCache(): number {
  const now = Date.now();
  let expiredCount = 0;
  
  // Clean memory cache
  for (const [key, value] of siqsMemoryCache.entries()) {
    if (value.expiresAt <= now) {
      siqsMemoryCache.delete(key);
      expiredCount++;
    }
  }
  
  // Clean localStorage cache
  try {
    const keys = Object.keys(localStorage);
    const siqsKeys = keys.filter(key => key.startsWith(LOCATION_CACHE_KEY_PREFIX));
    
    for (const key of siqsKeys) {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (parsedCache.expiresAt <= now) {
          localStorage.removeItem(key);
          expiredCount++;
        }
      }
    }
  } catch (error) {
    console.error("Error cleaning up expired SIQS cache:", error);
  }
  
  return expiredCount;
}

/**
 * Get the current size of the SIQS cache
 */
export function getSiqsCacheSize(): { memory: number; storage: number } {
  return {
    memory: siqsMemoryCache.size,
    storage: Object.keys(localStorage).filter(key => 
      key.startsWith(LOCATION_CACHE_KEY_PREFIX)
    ).length
  };
}
