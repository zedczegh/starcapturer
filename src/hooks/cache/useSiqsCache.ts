import { useState, useCallback } from 'react';
import { cacheManager, CacheKeys } from '@/utils/cache/cacheManager';

const SIQS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const useSiqsCache = () => {
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const getCachedSiqs = useCallback((lat: number, lng: number): number | null => {
    const key = CacheKeys.siqs(lat, lng);
    return cacheManager.get<number>(key);
  }, []);

  const cacheSiqs = useCallback((lat: number, lng: number, siqs: number) => {
    const key = CacheKeys.siqs(lat, lng);
    cacheManager.set(key, siqs, SIQS_CACHE_TTL);
  }, []);

  const refreshSiqs = useCallback((lat: number, lng: number) => {
    const key = CacheKeys.siqs(lat, lng);
    cacheManager.clear(key);
    setLastRefresh(Date.now());
  }, []);

  const isSiqsExpired = useCallback((lat: number, lng: number): boolean => {
    const key = CacheKeys.siqs(lat, lng);
    return !cacheManager.has(key);
  }, []);

  const clearAllSiqsCache = useCallback(() => {
    // This would need a more sophisticated approach in production
    // For now, we clear all cache
    const stats = cacheManager.getStats();
    cacheManager.clearAll();
    setLastRefresh(Date.now());
    return stats;
  }, []);

  return {
    getCachedSiqs,
    cacheSiqs,
    refreshSiqs,
    isSiqsExpired,
    clearAllSiqsCache,
    lastRefresh
  };
};
