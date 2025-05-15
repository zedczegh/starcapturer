
/**
 * Simple memory cache for SIQS scores to improve performance
 * and prevent redundant calculations
 */

// In-memory cache for SIQS scores
const siqsCache = new Map<string, { 
  siqs: number; 
  timestamp: number;
  metadata?: { 
    calculatedAt: string;
    source?: string;
  };
}>();

// Cache duration in milliseconds (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * Create a cache key for a location
 */
export function createCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/**
 * Set cached SIQS for a location
 */
export function setCachedRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  siqs: number,
  source?: string
): void {
  const key = createCacheKey(latitude, longitude);
  siqsCache.set(key, { 
    siqs, 
    timestamp: Date.now(),
    metadata: {
      calculatedAt: new Date().toISOString(),
      source: source || 'realtime'
    }
  });
}

/**
 * Get cached SIQS for a location
 * Returns null if not in cache or cache is expired
 */
export function getCachedRealTimeSiqs(latitude: number, longitude: number): number | null {
  const key = createCacheKey(latitude, longitude);
  const cached = siqsCache.get(key);
  
  if (!cached) return null;
  
  // Check if cache has expired
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    siqsCache.delete(key);
    return null;
  }
  
  return cached.siqs;
}

/**
 * Check if a location has a cached SIQS value
 */
export function hasCachedSiqs(latitude: number, longitude: number): boolean {
  const key = createCacheKey(latitude, longitude);
  return siqsCache.has(key);
}

/**
 * Get cached SIQS with metadata
 */
export function getCachedSiqs(latitude: number, longitude: number) {
  const key = createCacheKey(latitude, longitude);
  return siqsCache.get(key);
}

/**
 * Clear all cached SIQS values
 */
export function clearSiqsCache(): void {
  siqsCache.clear();
}

/**
 * Clear cached SIQS for a specific location
 */
export function clearLocationSiqsCache(latitude: number, longitude: number): void {
  const key = createCacheKey(latitude, longitude);
  siqsCache.delete(key);
}

/**
 * Get the current size of the SIQS cache
 */
export function getSiqsCacheSize(): number {
  return siqsCache.size;
}

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of siqsCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      siqsCache.delete(key);
    }
  }
}
