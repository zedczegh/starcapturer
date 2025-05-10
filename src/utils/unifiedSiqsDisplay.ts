
/**
 * Unified SIQS Display Utility
 * 
 * This file provides a single source of truth for displaying SIQS scores
 * consistently across all map markers and popups.
 */

import { getSiqsScore, normalizeToSiqsScale } from './siqsHelpers';
import { formatMapSiqs, getSiqsColorClass } from './mapSiqsDisplay';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs, setSiqsCache } from '@/services/realTimeSiqs/siqsCache';

// Re-exports from the refactored utility files
import { 
  formatSiqsForDisplay, 
  getDisplaySiqs, 
  getLocationSiqs, 
  calculateSimplifiedSiqs,
  DEFAULT_SIQS 
} from './siqs/display/formatters';

import { 
  getCachedRealTimeSiqs 
} from './siqs/display/siqsCache';

import { 
  getCompleteSiqsDisplay 
} from './siqs/display/siqsCalculator';

interface SiqsDisplayOpts {
  realTimeSiqs: number | null;
  staticSiqs: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
}

// Helper function to safely get display SIQS, with type-safety
export function getDisplaySiqs(options: SiqsDisplayOpts): number {
  const { realTimeSiqs, staticSiqs, isCertified = false, isDarkSkyReserve = false } = options;
  
  // Always prefer real-time SIQS if available
  if (realTimeSiqs !== null && realTimeSiqs > 0) {
    return realTimeSiqs;
  }
  
  // Use static SIQS if available
  if (staticSiqs > 0) {
    return staticSiqs;
  }
  
  // Return 0 as last resort - no default scores
  return 0;
}

export {
  DEFAULT_SIQS,
  formatSiqsForDisplay,
  getLocationSiqs,
  getCachedRealTimeSiqs,
  calculateSimplifiedSiqs,
  getCompleteSiqsDisplay,
  // Re-export the types
  type SiqsDisplayOpts,
};

export type SiqsResult = {
  siqs: number;
  isViable?: boolean;
  loading?: boolean;
  formattedSiqs?: string;
  colorClass?: string;
  source?: string;
  metadata?: any;
  factors?: Array<{name: string; score: number; description?: string}>;
  weatherData?: any;
  forecastData?: any;
};
