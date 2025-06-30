
/**
 * Cache type definitions for the application
 */

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  expires: number; // Add expires property for storage cache compatibility
}

export interface CacheOptions {
  ttl?: number;
  persistToStorage?: boolean;
  namespace?: string;
}

export const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export type CacheKey = string;
export type CacheValue<T> = T;
