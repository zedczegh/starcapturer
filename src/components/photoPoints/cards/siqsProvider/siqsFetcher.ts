
/**
 * SIQS data fetching functions
 */

import { getCompleteSiqsDisplay, SiqsDisplayOptions } from '@/utils/unifiedSiqsDisplay';
import { executeQueuedFetch } from './queueManager';
import { updateSiqsCache, getSiqsCacheKey } from './cacheManager';

/**
 * Fetch SIQS data for a location with queueing and caching
 */
export async function fetchSiqsData({
  latitude,
  longitude,
  bortleScale,
  isCertified,
  isDarkSkyReserve,
  existingSiqs,
  skipCache,
  cacheKey,
  onSuccess,
  onError
}: {
  latitude?: number;
  longitude?: number;
  bortleScale: number;
  isCertified: boolean;
  isDarkSkyReserve: boolean;
  existingSiqs: number | any;
  skipCache?: boolean;
  cacheKey: string | null;
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
}): Promise<void> {
  if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
    onError(new Error("Invalid coordinates"));
    return;
  }

  // Convert existingSiqs to number if possible
  const existingSiqsNumber = typeof existingSiqs === 'number' ? existingSiqs : 
    (typeof existingSiqs === 'object' && existingSiqs && 'score' in existingSiqs) ? existingSiqs.score : 0;
  
  // Queue or execute the fetch based on current load
  return executeQueuedFetch(cacheKey, async () => {
    try {
      const result = await getCompleteSiqsDisplay({
        latitude,
        longitude,
        bortleScale,
        isCertified,
        isDarkSkyReserve,
        existingSiqs: existingSiqsNumber,
        skipCache,
        useSingleHourSampling: true,
        targetHour: 1
      });
      
      // Update the caches
      if (cacheKey) {
        updateSiqsCache(cacheKey, result);
      }
      
      onSuccess(result);
    } catch (error) {
      console.error("Error in SIQS data fetching:", error);
      onError(error);
    }
  });
}

/**
 * Handle simplified SIQS fallback when full calculation fails
 */
export function handleSiqsError({
  isCertified, 
  existingSiqsNumber, 
  onSiqsCalculated
}: {
  isCertified: boolean;
  existingSiqsNumber: number;
  onSiqsCalculated: (siqs: number | null, loading: boolean, confidence?: number) => void;
}): void {
  if (isCertified) {
    // For certified locations, use existing score if available
    if (existingSiqsNumber > 0) {
      onSiqsCalculated(existingSiqsNumber, false, 7);
    } else {
      onSiqsCalculated(null, false);
    }
  } else if (existingSiqsNumber > 0) {
    onSiqsCalculated(existingSiqsNumber, false, 6);
  } else {
    onSiqsCalculated(null, false);
  }
}
