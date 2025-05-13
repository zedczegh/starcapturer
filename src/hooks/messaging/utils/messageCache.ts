
import { optimizedCache } from '@/utils/optimizedCache';

// Constants for message caching
export const MESSAGE_CACHE_KEY_PREFIX = 'messages_';
export const MESSAGE_CACHE_TTL = 60000; // 1 minute cache for messages

/**
 * Generate a cache key for messages between two users
 * @param currentUserId - The current user's ID
 * @param partnerId - The conversation partner's ID
 * @returns Generated cache key
 */
export const generateMessageCacheKey = (currentUserId: string, partnerId: string): string => {
  return `${MESSAGE_CACHE_KEY_PREFIX}${currentUserId}_${partnerId}`;
};

/**
 * Get cached messages for a conversation
 * @param currentUserId - The current user's ID
 * @param partnerId - The conversation partner's ID
 * @returns Cached messages or undefined if not cached
 */
export const getCachedMessages = <T>(currentUserId: string, partnerId: string): T[] | undefined => {
  const cacheKey = generateMessageCacheKey(currentUserId, partnerId);
  return optimizedCache.getCachedItem<T[]>(cacheKey);
};

/**
 * Store messages in cache
 * @param currentUserId - The current user's ID
 * @param partnerId - The conversation partner's ID
 * @param messages - Messages to cache
 */
export const cacheMessages = <T>(currentUserId: string, partnerId: string, messages: T[]): void => {
  const cacheKey = generateMessageCacheKey(currentUserId, partnerId);
  optimizedCache.setCachedItem(cacheKey, messages, MESSAGE_CACHE_TTL);
};
