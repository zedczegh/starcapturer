
/**
 * Cache type definitions
 */

export type CacheItem<T> = {
  data: T;
  expires: number;
};

export interface CacheOptions {
  ttl?: number;
  namespace?: string;
  persistToStorage?: boolean;
}

export const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
