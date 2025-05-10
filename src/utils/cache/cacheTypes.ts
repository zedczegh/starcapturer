
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
  priority?: 'high' | 'medium' | 'low';
}

export const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
export const LOW_PRIORITY_TTL = 3 * 60 * 1000; // 3 minutes
export const HIGH_PRIORITY_TTL = 10 * 60 * 1000; // 10 minutes
