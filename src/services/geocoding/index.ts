
import { searchLocations } from './search';
import { reverseGeocode, getLocationNameFromCoordinates } from './reverseGeocoding';
import { Location, Language } from './types';

// Export the main API
export {
  searchLocations,
  reverseGeocode,
  getLocationNameFromCoordinates
};

// Export types
export type { Location, Language };

// Re-export utility methods for convenience
export * from './matchingUtils';
