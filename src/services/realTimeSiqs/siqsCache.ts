/**
 * Enhanced SIQS caching system
 * 
 * This module provides in-memory and persistent caching for SIQS calculations
 * to improve performance and reduce API calls.
 */

import { SiqsResult } from './siqsTypes';

// In-memory cache storage
const siqsCache = new Map<string, SiqsResult & { timestamp: number }>();

// Constants
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (increased from previous duration)
const AUTO_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 300; // Maximum number of entries to keep in cache

// Auto cleanup interval reference
let cleanupInterval: number | null = null;

/**
 * Get cache key for a specific location
 */
function getLocationKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
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
  
  // Try to load from localStorage as a fallback
  try {
    const storageKey = `siqs_${key}`;
    const cachedItem = localStorage.getItem(storageKey);
    
    if (cachedItem) {
      const cached = JSON.parse(cachedItem);
      const now = Date.now();
      const age = now - cached.timestamp;
      
      if (age < CACHE_DURATION) {
        // Load into memory cache
        siqsCache.set(key, {
          ...cached.result,
          timestamp: cached.timestamp
        });
        return true;
      } else {
        // Clean up expired localStorage item
        localStorage.removeItem(storageKey);
      }
    }
  } catch (error) {
    console.error("Error checking localStorage SIQS cache:", error);
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
  
  // Try to load from localStorage as a fallback
  try {
    const storageKey = `siqs_${key}`;
    const cachedItem = localStorage.getItem(storageKey);
    
    if (cachedItem) {
      const cached = JSON.parse(cachedItem);
      const now = Date.now();
      const age = now - cached.timestamp;
      
      if (age < CACHE_DURATION) {
        // Load into memory cache
        siqsCache.set(key, {
          ...cached.result,
          timestamp: cached.timestamp
        });
        return cached.result;
      } else {
        // Clean up expired localStorage item
        localStorage.removeItem(storageKey);
      }
    }
  } catch (error) {
    console.error("Error retrieving localStorage SIQS cache:", error);
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
  
  // Check cache size and prune if necessary
  if (siqsCache.size > MAX_CACHE_SIZE) {
    pruneCache();
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
    if (age > CACHE_DURATION) {
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
 * Prune cache when it gets too large
 * Removes oldest entries first
 */
function pruneCache(): void {
  try {
    // Convert to array to sort by timestamp
    const entries = Array.from(siqsCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Keep only the newer entries
    const toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.3)); // Remove oldest 30%
    
    for (const [key] of toRemove) {
      siqsCache.delete(key);
      
      try {
        const storageKey = `siqs_${key}`;
        localStorage.removeItem(storageKey);
      } catch (error) {
        // Ignore storage errors during pruning
      }
    }
    
    console.log(`Pruned ${toRemove.length} oldest entries from SIQS cache`);
  } catch (error) {
    console.error("Error pruning SIQS cache:", error);
  }
}

/**
 * Start the cleanup interval
 */
function startCleanupInterval(): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const expiredCount = cleanupExpiredCache();
    if (expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired SIQS cache entries`);
    }
  }, AUTO_CLEANUP_INTERVAL) as unknown as number;
}

/**
 * Get current size of SIQS cache
 */
export function getSiqsCacheSize(): { memory: number, storage: number } {
  let storageCount = 0;
  
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('siqs_')) {
        storageCount++;
      }
    });
  } catch (error) {
    console.error("Error counting localStorage SIQS cache:", error);
  }
  
  return {
    memory: siqsCache.size,
    storage: storageCount
  };
}

// Initialize cleanup interval on module load
startCleanupInterval();

// Export other functions
export { getLocationKey, CACHE_DURATION, MAX_CACHE_SIZE };
