
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

import type { 
  SiqsDisplayOpts, 
  SiqsResult 
} from './siqs/display/types';

// Export everything for backwards compatibility
export {
  DEFAULT_SIQS,
  formatSiqsForDisplay,
  getDisplaySiqs,
  getLocationSiqs,
  getCachedRealTimeSiqs,
  calculateSimplifiedSiqs,
  getCompleteSiqsDisplay,
  // Re-export the types
  type SiqsDisplayOpts,
  type SiqsResult
};
