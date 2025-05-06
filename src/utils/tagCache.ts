
import { UserTag } from "@/hooks/useUserTags";

// Cache tags in memory during the session
const tagCache = new Map<string, UserTag[]>();

// Get cached tags for a user
export const getCachedTags = (userId: string): UserTag[] | null => {
  if (!userId) return null;
  return tagCache.get(userId) || null;
};

// Set cached tags for a user
export const setCachedTags = (userId: string, tags: UserTag[]): void => {
  if (!userId) return;
  tagCache.set(userId, ensureArray(tags));
};

// Clear cache for a user
export const clearCachedTags = (userId: string): void => {
  if (!userId) return;
  tagCache.delete(userId);
};

// Make sure an array is returned for safety
export const ensureArray = <T>(possibleArray: T[] | undefined | null): T[] => {
  if (!possibleArray) return [];
  if (!Array.isArray(possibleArray)) return [];
  return possibleArray;
};

// Safe filter function to avoid "undefined is not iterable" errors
export const safeFilter = <T>(
  array: T[] | undefined | null,
  filterFn: (item: T) => boolean
): T[] => {
  const safeArray = ensureArray(array);
  if (!safeArray || !Array.isArray(safeArray)) return [];
  
  try {
    return safeArray.filter(filterFn);
  } catch (error) {
    console.error("Error in safeFilter:", error);
    return [];
  }
};

// Safe map function to avoid similar errors
export const safeMap = <T, R>(
  array: T[] | undefined | null,
  mapFn: (item: T) => R
): R[] => {
  const safeArray = ensureArray(array);
  if (!safeArray || !Array.isArray(safeArray)) return [];
  
  try {
    return safeArray.map(mapFn);
  } catch (error) {
    console.error("Error in safeMap:", error);
    return [];
  }
};
