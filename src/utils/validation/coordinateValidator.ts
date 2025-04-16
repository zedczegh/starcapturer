
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Validate location coordinates are within valid ranges
 */
export const hasValidCoordinates = (location: SharedAstroSpot): boolean => {
  return Boolean(
    location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number' &&
    isFinite(location.latitude) &&
    isFinite(location.longitude) &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180
  );
};

/**
 * Create a unique ID for a location
 */
export const getLocationId = (location: SharedAstroSpot): string => {
  return location.id || 
    `location-${location.latitude?.toFixed(6)}-${location.longitude?.toFixed(6)}`;
};
