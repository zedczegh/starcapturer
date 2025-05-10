
/**
 * Helper functions for safely working with SIQS values that might be numbers or objects
 * This file re-exports the protected core SIQS functions to ensure they are used throughout the application
 */

import {
  getSiqsScore,
  normalizeToSiqsScale,
  formatSiqsForDisplay,
  formatSiqsScore,
  isSiqsAtLeast,
  isSiqsGreaterThan,
  sortLocationsBySiqs,
  SiqsValue
} from './protected/coreSiqsFunctions';

export {
  getSiqsScore,
  normalizeToSiqsScale,
  formatSiqsForDisplay,
  formatSiqsScore,
  isSiqsAtLeast,
  isSiqsGreaterThan,
  sortLocationsBySiqs
};

// Export the SiqsValue type properly with 'export type' syntax for isolatedModules
export type { SiqsValue };

// Additional SIQS helper functions can be added here but they should use the
// core protected functions rather than duplicating their logic
