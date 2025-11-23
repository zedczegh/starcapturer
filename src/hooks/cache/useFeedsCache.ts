import { useState, useCallback } from 'react';
import { cacheManager, CacheKeys } from '@/utils/cache/cacheManager';

const FEEDS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const useFeedsCache = () => {
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const getCachedFeeds = useCallback((userId: string, page: number = 1): any[] | null => {
    const key = CacheKeys.feeds(userId, page);
    return cacheManager.get<any[]>(key);
  }, []);

  const cacheFeeds = useCallback((userId: string, feeds: any[], page: number = 1) => {
    const key = CacheKeys.feeds(userId, page);
    cacheManager.set(key, feeds, FEEDS_CACHE_TTL);
  }, []);

  const refreshFeeds = useCallback((userId: string, page: number = 1) => {
    const key = CacheKeys.feeds(userId, page);
    cacheManager.clear(key);
    setLastRefresh(Date.now());
  }, []);

  const clearAllFeedsCache = useCallback(() => {
    cacheManager.clearAll();
    setLastRefresh(Date.now());
  }, []);

  const prependNewFeed = useCallback((userId: string, newFeed: any, page: number = 1) => {
    const key = CacheKeys.feeds(userId, page);
    const cachedFeeds = cacheManager.get<any[]>(key);
    
    if (cachedFeeds) {
      const updatedFeeds = [newFeed, ...cachedFeeds];
      cacheManager.set(key, updatedFeeds, FEEDS_CACHE_TTL);
    }
  }, []);

  return {
    getCachedFeeds,
    cacheFeeds,
    refreshFeeds,
    clearAllFeedsCache,
    prependNewFeed,
    lastRefresh
  };
};

