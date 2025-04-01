
/**
 * Centralized exports for location utilities
 * Makes imports more consistent across the application
 */

// Export distance calculation functions
export { calculateDistance, deg2rad } from '@/data/utils/distanceCalculator';

// Export location finding utilities
export { findClosestLocationImpl, getLocationInfoImpl } from '@/data/utils/locationFinder';

// Export general location utilities
export { 
  findClosestKnownLocation,
  estimateBortleScaleByLocation
} from '@/utils/locationUtils';

// Export Bortle scale utilities
export { 
  getBortleScaleDescription, 
  getBortleScaleColor 
} from '@/data/utils/bortleScaleUtils';

// Export location database access
export { 
  locationDatabase,
  findClosestLocation,
  getLocationInfo
} from '@/data/locationDatabase';

// Export dark sky location utilities
export {
  getAllDarkSkyLocations,
  findDarkSkyLocationsWithinRadius,
  getDarkSkyAstroSpots
} from '@/services/darkSkyLocationService';

// Export location search utilities
export {
  findLocationsWithinRadius,
  findCertifiedLocations,
  findCalculatedLocations,
  sortLocationsByQuality,
  clearLocationSearchCache
} from '@/services/locationSearchService';
