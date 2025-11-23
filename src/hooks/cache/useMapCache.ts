import { useState, useCallback } from 'react';
import { cacheManager, CacheKeys } from '@/utils/cache/cacheManager';

interface MapLocation {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  siqs?: number;
  [key: string]: any;
}

export const useMapCache = () => {
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const getCachedLocations = useCallback((
    lat: number, 
    lng: number, 
    radius: number
  ): MapLocation[] | null => {
    const key = CacheKeys.mapLocations(lat, lng, radius);
    return cacheManager.get<MapLocation[]>(key);
  }, []);

  const cacheLocations = useCallback((
    lat: number,
    lng: number,
    radius: number,
    locations: MapLocation[]
  ) => {
    const key = CacheKeys.mapLocations(lat, lng, radius);
    cacheManager.set(key, locations, 60 * 60 * 1000); // 1 hour
  }, []);

  const refreshCache = useCallback((lat: number, lng: number, radius: number) => {
    const key = CacheKeys.mapLocations(lat, lng, radius);
    cacheManager.clear(key);
    setLastRefresh(Date.now());
  }, []);

  const clearAllMapCache = useCallback(() => {
    // Clear all map-related cache
    const stats = cacheManager.getStats();
    cacheManager.clearAll();
    setLastRefresh(Date.now());
    return stats;
  }, []);

  return {
    getCachedLocations,
    cacheLocations,
    refreshCache,
    clearAllMapCache,
    lastRefresh
  };
};
