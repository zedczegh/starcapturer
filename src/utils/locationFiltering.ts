
import { SharedAstroSpot } from '@/types/weather';

/**
 * Filters out invalid locations from an array of locations
 * @param locations The array of locations to filter
 * @returns An array of valid locations
 */
export const filterValidLocations = (locations: SharedAstroSpot[]): SharedAstroSpot[] => {
  return locations.filter(
    loc => loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
  );
};

/**
 * Separates certified and calculated locations into different arrays
 * @param locations The array of locations to separate
 * @returns An object containing certified and calculated locations
 */
export const separateLocationTypes = (
  locations: SharedAstroSpot[]
): { certifiedLocations: SharedAstroSpot[]; calculatedLocations: SharedAstroSpot[] } => {
  const certifiedLocations: SharedAstroSpot[] = [];
  const calculatedLocations: SharedAstroSpot[] = [];

  for (const location of locations) {
    if (isCertifiedLocation(location)) {
      certifiedLocations.push(location);
    } else {
      calculatedLocations.push(location);
    }
  }

  return { certifiedLocations, calculatedLocations };
};

/**
 * Merges certified and calculated locations with proper prioritization
 * @param certifiedLocations Array of certified locations
 * @param calculatedLocations Array of calculated locations
 * @param activeView Current view mode
 * @returns Merged array of locations
 */
export const mergeLocations = (
  certifiedLocations: SharedAstroSpot[],
  calculatedLocations: SharedAstroSpot[],
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  if (activeView === 'certified') {
    return [...certifiedLocations];
  }
  
  // For calculated view, include both but prioritize certified locations
  return [...certifiedLocations, ...calculatedLocations];
};

/**
 * Checks if a location is a certified location (has certification or is a dark sky reserve)
 * @param location The location to check
 * @returns True if the location is certified, false otherwise
 */
export const isCertifiedLocation = (location: SharedAstroSpot): boolean => {
  return Boolean(location.isDarkSkyReserve || location.certification);
};
