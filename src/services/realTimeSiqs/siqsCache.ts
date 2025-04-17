
/**
 * SIQS cache management system for better performance and less API calls
 */
import { SiqsResult } from './siqsTypes';

// In-memory cache for SIQS results with metadata
interface CacheEntry {
  data: SiqsResult;
  timestamp: number;
  expires: number;
}

// Cache storage - using Map for better performance with frequent access patterns
const siqsCache = new Map<string, CacheEntry>();

// Default cache durations
const DEFAULT_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Generate a cache key for a location
 */
function generateCacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

/**
 * Check if a location's SIQS is cached
 */
export function hasCachedSiqs(latitude: number, longitude: number): boolean {
  const key = generateCacheKey(latitude, longitude);
  
  if (siqsCache.has(key)) {
    const entry = siqsCache.get(key);
    const now = Date.now();
    
    // Return true only if entry exists and hasn't expired
    return !!entry && now < entry.expires;
  }
  
  return false;
}

/**
 * Get cached SIQS for a location
 */
export function getCachedSiqs(latitude: number, longitude: number): SiqsResult | null {
  const key = generateCacheKey(latitude, longitude);
  
  if (siqsCache.has(key)) {
    const entry = siqsCache.get(key);
    const now = Date.now();
    
    // Return data only if not expired
    if (entry && now < entry.expires) {
      return entry.data;
    } else if (entry) {
      // Auto-cleanup expired entries on access
      siqsCache.delete(key);
    }
  }
  
  return null;
}

/**
 * Set SIQS cache for a location
 */
export function setSiqsCache(
  latitude: number,
  longitude: number,
  data: SiqsResult,
  duration: number = DEFAULT_CACHE_DURATION
): void {
  const key = generateCacheKey(latitude, longitude);
  const now = Date.now();
  
  siqsCache.set(key, {
    data,
    timestamp: now,
    expires: now + duration
  });
  
  // If cache is getting too large, clean up oldest entries
  if (siqsCache.size > 1000) {
    cleanupOldestEntries(100);
  }
}

/**
 * Clean up expired cache entries
 * @returns Number of expired entries removed
 */
export function cleanupExpiredCache(): number {
  let expiredCount = 0;
  const now = Date.now();
  
  // Find and delete expired entries
  for (const [key, entry] of siqsCache.entries()) {
    if (now >= entry.expires) {
      siqsCache.delete(key);
      expiredCount++;
    }
  }
  
  return expiredCount;
}

/**
 * Clean up oldest cache entries
 */
function cleanupOldestEntries(count: number): void {
  // Convert to array, sort by timestamp
  const entries = Array.from(siqsCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  // Delete oldest entries up to count
  const toDelete = entries.slice(0, count);
  toDelete.forEach(([key]) => siqsCache.delete(key));
}

/**
 * Clear all SIQS cache
 */
export function clearSiqsCache(): void {
  siqsCache.clear();
}

/**
 * Clear SIQS cache for a specific location
 */
export function clearLocationSiqsCache(latitude: number, longitude: number): void {
  const key = generateCacheKey(latitude, longitude);
  siqsCache.delete(key);
}

/**
 * Get current SIQS cache size
 */
export function getSiqsCacheSize(): number {
  return siqsCache.size;
}
