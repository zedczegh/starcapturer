
import { SharedAstroSpot } from '@/lib/api/astroSpots';

const SPOT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const spotCache = new Map<string, {
  spots: SharedAstroSpot[],
  timestamp: number
}>();

export const getCachedSpots = (
  centerLat: number,
  centerLng: number,
  radius: number,
  limit: number
): SharedAstroSpot[] | null => {
  const cacheKey = `spots-${centerLat.toFixed(2)}-${centerLng.toFixed(2)}-${radius}-${limit}`;
  const cachedSpots = spotCache.get(cacheKey);
  
  if (cachedSpots && Date.now() - cachedSpots.timestamp < SPOT_CACHE_DURATION) {
    console.log(`Using cached spots for ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`);
    return cachedSpots.spots;
  }
  
  return null;
};

export const cacheSpots = (
  centerLat: number,
  centerLng: number,
  radius: number,
  limit: number,
  spots: SharedAstroSpot[]
): void => {
  const cacheKey = `spots-${centerLat.toFixed(2)}-${centerLng.toFixed(2)}-${radius}-${limit}`;
  spotCache.set(cacheKey, {
    spots,
    timestamp: Date.now()
  });
};

export const clearSpotCache = (): void => {
  spotCache.clear();
};
