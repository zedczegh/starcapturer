
import { UserTag } from "@/hooks/useUserTags";

// Cache tags in memory during the session
const tagCache = new Map<string, UserTag[]>();

// Get cached tags for a user
export const getCachedTags = (userId: string): UserTag[] | null => {
  return tagCache.get(userId) || null;
};

// Set cached tags for a user
export const setCachedTags = (userId: string, tags: UserTag[]): void => {
  tagCache.set(userId, tags);
};

// Clear cache for a user
export const clearCachedTags = (userId: string): void => {
  tagCache.delete(userId);
};

// Make sure an array is returned for safety
export const ensureArray = <T>(possibleArray: T[] | undefined | null): T[] => {
  if (!possibleArray) return [];
  return Array.isArray(possibleArray) ? possibleArray : [];
};

// Safe filter function to avoid "undefined is not iterable" errors
export const safeFilter = <T>(
  array: T[] | undefined | null,
  filterFn: (item: T) => boolean
): T[] => {
  const safeArray = ensureArray(array);
  return safeArray.filter(filterFn);
};

// Safe map function to avoid similar errors
export const safeMap = <T, R>(
  array: T[] | undefined | null,
  mapFn: (item: T) => R
): R[] => {
  const safeArray = ensureArray(array);
  return safeArray.map(mapFn);
};
