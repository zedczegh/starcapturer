
/**
 * SIQS caching utilities
 */

import { hasCachedSiqs, getCachedSiqs } from '@/services/realTimeSiqs/siqsCache';
import { normalizeToSiqsScale } from '@/utils/siqsHelpers';

/**
 * Get cached SIQS with optimized performance
 */
export function getCachedRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  skipCache: boolean = false
): number | null {
  if (!skipCache && hasCachedSiqs(latitude, longitude)) {
    const cached = getCachedSiqs(latitude, longitude);
    if (cached && cached.siqs > 0) {
      return normalizeToSiqsScale(cached.siqs);
    }
  }
  return null;
}
