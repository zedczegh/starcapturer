
/**
 * Types for SIQS provider component
 */

export interface CacheEntry {
  data: any;
  timestamp: number;
}

export interface SiqsProviderProps {
  latitude?: number;
  longitude?: number;
  bortleScale?: number;
  onSiqsCalculated: (siqs: number | null, loading: boolean, confidence?: number) => void;
  isVisible?: boolean;
  forceUpdate?: boolean;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | null | any;
  priorityLevel?: 'high' | 'medium' | 'low';
}

export interface SiqsFetchOptions {
  latitude?: number;
  longitude?: number;
  bortleScale: number;
  isCertified: boolean;
  isDarkSkyReserve: boolean;
  existingSiqs: number | any;
  skipCache?: boolean;
  cacheKey: string | null;
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
}

export interface SiqsErrorHandlingOptions {
  isCertified: boolean;
  existingSiqsNumber: number;
  onSiqsCalculated: (siqs: number | null, loading: boolean, confidence?: number) => void;
}

/**
 * Represents a batch job for processing multiple SIQS requests
 */
export interface BatchJob {
  id: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  cacheKey?: string;
}
