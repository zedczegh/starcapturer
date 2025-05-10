
/**
 * SIQS calculation and display utilities
 */

import { getSiqsScore, normalizeToSiqsScale } from '@/utils/siqsHelpers';
import { formatSiqsForDisplay } from './formatters';
import { getCachedRealTimeSiqs } from './siqsCache';

// Type definitions
export interface SiqsDisplayOpts {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | null;
  skipCache?: boolean;
  useSingleHourSampling?: boolean;
  targetHour?: number;
}

export interface SiqsResult {
  siqs: number;
  loading?: boolean;
  formattedSiqs?: string;
  colorClass?: string;
  source?: string;
  isViable?: boolean;
  metadata?: any;
}

/**
 * All-in-one function to get complete SIQS display information
 * No default scores for certified locations
 */
export async function getCompleteSiqsDisplay(options: SiqsDisplayOpts): Promise<SiqsResult> {
  const { 
    latitude, 
    longitude, 
    existingSiqs = null
  } = options;
  
  // Get existing SIQS, without defaults - never use default scores
  const staticSiqs = existingSiqs !== null ? getSiqsScore(existingSiqs) : 0;
                      
  const defaultResult: SiqsResult = {
    siqs: staticSiqs > 0 ? staticSiqs : 0,
    loading: false,
    formattedSiqs: formatSiqsForDisplay(staticSiqs > 0 ? staticSiqs : null),
    source: 'static'
  };
  
  // Check for cached value
  const cachedSiqs = getCachedRealTimeSiqs(latitude, longitude);
  if (cachedSiqs !== null) {
    return {
      siqs: cachedSiqs,
      loading: false,
      formattedSiqs: formatSiqsForDisplay(cachedSiqs),
      source: 'cached'
    };
  }
  
  // Return default if we don't have real-time data
  return defaultResult;
}
