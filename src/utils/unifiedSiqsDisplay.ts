
/**
 * Unified SIQS Display Utility
 * 
 * This file provides a single source of truth for displaying SIQS scores
 * consistently across all map markers and popups.
 */

// Import core SIQS helpers
import { 
  getSiqsScore, 
  normalizeToSiqsScale,
  formatSiqsForDisplay 
} from './siqsHelpers';

// Import from refactored utility files
import { 
  formatSiqsForDisplay as formatSiqsForDisplay_new,
  getDisplaySiqs as getDisplaySiqs_new,
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

// Import types
import type { 
  SiqsDisplayOpts, 
  SiqsResult,
  SiqsCalculationOptions 
} from './siqs/display/types';

// Re-export the map SIQS formatting functions
import { formatMapSiqs, getSiqsColorClass } from './mapSiqsDisplay';

// Export the real-time SIQS calculation function
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculatorAdapter';

// Cache services
import { 
  hasCachedSiqs, 
  getCachedSiqs, 
  setSiqsCache 
} from '@/services/realTimeSiqs/siqsCache';

// Convenience function to get display SIQS
export function getDisplaySiqs(siqs: any, defaultValue: string = 'N/A'): string {
  return formatSiqsForDisplay(getSiqsScore(siqs)) || defaultValue;
}

// Export everything for backwards compatibility
export {
  DEFAULT_SIQS,
  formatSiqsForDisplay,
  getLocationSiqs,
  getCachedRealTimeSiqs,
  calculateSimplifiedSiqs,
  getCompleteSiqsDisplay,
  calculateRealTimeSiqs,
  formatMapSiqs,
  getSiqsColorClass,
  getSiqsScore,
  normalizeToSiqsScale,
  hasCachedSiqs,
  getCachedSiqs,
  setSiqsCache,
  // Re-export the types
  type SiqsDisplayOpts,
  type SiqsResult,
  type SiqsCalculationOptions
};
