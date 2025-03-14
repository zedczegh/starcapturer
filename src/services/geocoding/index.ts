
import { searchLocations } from './search';
import { getLocationNameFromCoordinates, reverseGeocode } from './reverseGeocoding';
import { Location, Language } from './types';

// Export the main API
export {
  searchLocations,
  getLocationNameFromCoordinates,
  reverseGeocode
};

// Export types
export type { Location, Language };

// Re-export utility methods for convenience
export * from './matchingUtils';
