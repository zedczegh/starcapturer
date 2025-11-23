import { useState, useCallback } from 'react';
import { cacheManager, CacheKeys } from '@/utils/cache/cacheManager';

const MESSAGES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
  [key: string]: any;
}

export const useMessagesCache = () => {
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const getCachedMessages = useCallback((userId: string, page: number = 1): Message[] | null => {
    const key = CacheKeys.messages(userId, page);
    return cacheManager.get<Message[]>(key);
  }, []);

  const cacheMessages = useCallback((userId: string, messages: Message[], page: number = 1) => {
    const key = CacheKeys.messages(userId, page);
    cacheManager.set(key, messages, MESSAGES_CACHE_TTL);
  }, []);

  const refreshMessages = useCallback((userId: string, page: number = 1) => {
    const key = CacheKeys.messages(userId, page);
    cacheManager.clear(key);
    setLastRefresh(Date.now());
  }, []);

  const clearAllMessagesCache = useCallback(() => {
    cacheManager.clearAll();
    setLastRefresh(Date.now());
  }, []);

  return {
    getCachedMessages,
    cacheMessages,
    refreshMessages,
    clearAllMessagesCache,
    lastRefresh
  };
};
