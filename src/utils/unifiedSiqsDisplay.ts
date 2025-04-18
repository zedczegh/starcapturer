
/**
 * Unified SIQS Display Helper
 * 
 * This utility provides optimized SIQS score display with smart caching
 * and prioritization between real-time, calculated, and static scores.
 */

import { hasCachedSiqs, getCachedSiqs } from '@/services/realTimeSiqs/siqsCache';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';

interface SiqsDisplayOptions {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number;
}

interface SiqsDisplayResult {
  siqs: number;
  source: 'realtime' | 'static' | 'calculated';
}

// A memory cache to avoid redundant calculations during a session
const inMemorySiqsCache = new Map<string, {siqs: number, timestamp: number}>();

/**
 * Get the appropriate SIQS display value with source information
 * Prioritizes: cached real-time > calculated > static/existing
 */
export function getDisplaySiqs(options: {
  realTimeSiqs: number | null;
  staticSiqs: number | null;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
}): number | null {
  const { realTimeSiqs, staticSiqs, isCertified, isDarkSkyReserve } = options;
  
  // For certified locations, don't fall back to static SIQS if we don't have real-time data
  if (isCertified && realTimeSiqs === null) {
    return null;
  }
  
  // Prioritize real-time SIQS score if available
  if (realTimeSiqs !== null) {
    return realTimeSiqs;
  }
  
  // Fall back to static SIQS for non-certified locations
  return staticSiqs;
}

/**
 * Get unified SIQS display with optimized calculations
 */
export async function getCompleteSiqsDisplay(options: SiqsDisplayOptions): Promise<SiqsDisplayResult> {
  const { latitude, longitude, bortleScale = 4, isCertified = false, isDarkSkyReserve = false, existingSiqs = 0 } = options;
  
  // Cache key based on coordinates
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Check in-memory cache first (fastest)
  const cachedValue = inMemorySiqsCache.get(cacheKey);
  if (cachedValue && Date.now() - cachedValue.timestamp < (isCertified ? 60000 : 300000)) {
    return { siqs: cachedValue.siqs, source: 'calculated' };
  }
  
  // Then check persistent cache
  if (hasCachedSiqs(latitude, longitude)) {
    const cachedData = getCachedSiqs(latitude, longitude);
    if (cachedData) {
      inMemorySiqsCache.set(cacheKey, { siqs: cachedData.siqs, timestamp: Date.now() });
      return { siqs: cachedData.siqs, source: 'calculated' };
    }
  }
  
  try {
    // Calculate real-time SIQS
    const result = await calculateRealTimeSiqs(latitude, longitude, bortleScale);
    
    if (result && result.siqs > 0) {
      // Update in-memory cache
      inMemorySiqsCache.set(cacheKey, { siqs: result.siqs, timestamp: Date.now() });
      return { siqs: result.siqs, source: 'realtime' };
    }
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
  }
  
  // Fall back to existing SIQS if available and not a certified location
  if (!isCertified && existingSiqs > 0) {
    return { siqs: existingSiqs, source: 'static' };
  }
  
  // Last resort: estimate based on location properties
  let estimatedSiqs = 0;
  
  if (isDarkSkyReserve) {
    estimatedSiqs = 8.5;
  } else if (isCertified) {
    estimatedSiqs = 7.0;
  } else if (bortleScale <= 3) {
    estimatedSiqs = 7.0;
  } else if (bortleScale <= 5) {
    estimatedSiqs = 5.0;
  } else {
    estimatedSiqs = 3.0;
  }
  
  // Update in-memory cache with estimated value
  inMemorySiqsCache.set(cacheKey, { siqs: estimatedSiqs, timestamp: Date.now() });
  
  return { siqs: estimatedSiqs, source: 'calculated' };
}
