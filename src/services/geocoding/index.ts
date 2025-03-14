
import { searchLocations } from './search';
import { reverseGeocode } from './reverseGeocoding';
import { Location, Language } from './types';

// Export the main API
export {
  searchLocations,
  reverseGeocode
};

// Export types
export type { Location, Language };

// Re-export utility methods for convenience
export * from './matchingUtils';
