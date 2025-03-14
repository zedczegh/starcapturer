
import { searchLocations } from './search';
import { getLocationNameFromCoordinates } from './reverseGeocoding';
import { Location, Language } from './types';

// Export the main API
export {
  searchLocations,
  getLocationNameFromCoordinates
};

// Export types
export type { Location, Language };

// Re-export utility methods for convenience
export * from './matchingUtils';
