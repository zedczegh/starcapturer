
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface CacheEntry {
  points: SharedAstroSpot[];
  timestamp: number;
  radius: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const pointCache = new Map<string, CacheEntry>();

export function getCachedPoints(
  latitude: number,
  longitude: number,
  radius: number
): SharedAstroSpot[] | null {
  const key = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
  const entry = pointCache.get(key);
  
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    pointCache.delete(key);
    return null;
  }
  
  return entry.points;
}

export function cachePoints(
  latitude: number,
  longitude: number,
  radius: number,
  points: SharedAstroSpot[]
): void {
  const key = `${latitude.toFixed(2)}-${longitude.toFixed(2)}-${radius}`;
  pointCache.set(key, {
    points,
    timestamp: Date.now(),
    radius
  });
}

export function clearPointCache(): void {
  pointCache.clear();
}
