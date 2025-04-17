
import { SharedAstroSpot } from '@/types/weather';

/**
 * Filters out invalid locations from an array of locations
 * @param locations The array of locations to filter
 * @returns An array of valid locations
 */
export const filterValidLocations = (locations: SharedAstroSpot[]): SharedAstroSpot[] => {
  // Make sure locations is an array
  if (!Array.isArray(locations)) {
    console.warn('filterValidLocations received non-array input:', locations);
    return [];
  }
  
  console.log(`Filtering ${locations.length} locations for validity`);
  
  // Filter out invalid locations
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
  // Make sure locations is an array
  if (!Array.isArray(locations)) {
    console.warn('separateLocationTypes received non-array input:', locations);
    return { certifiedLocations: [], calculatedLocations: [] };
  }

  const certifiedLocations: SharedAstroSpot[] = [];
  const calculatedLocations: SharedAstroSpot[] = [];

  for (const location of locations) {
    if (isCertifiedLocation(location)) {
      certifiedLocations.push(location);
    } else {
      calculatedLocations.push(location);
    }
  }
  
  console.log(`Separated locations: ${certifiedLocations.length} certified, ${calculatedLocations.length} calculated`);

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
    console.log(`Returning certified-only locations: ${certifiedLocations.length}`);
    return [...certifiedLocations];
  }
  
  // For calculated view, include both but prioritize certified locations
  const combinedCount = certifiedLocations.length + calculatedLocations.length;
  console.log(`Returning combined locations for calculated view: ${combinedCount}`);
  return [...certifiedLocations, ...calculatedLocations];
};

/**
 * Checks if a location is a certified location (has certification or is a dark sky reserve)
 * @param location The location to check
 * @returns True if the location is certified, false otherwise
 */
export const isCertifiedLocation = (location: SharedAstroSpot): boolean => {
  return Boolean(location?.isDarkSkyReserve || location?.certification);
};

/**
 * Gets the SIQS score from a location, handling different formats
 * @param location The location to get the SIQS score from
 * @returns The SIQS score, or null if not available
 */
export const getSiqsScore = (location: SharedAstroSpot): number | null => {
  if (typeof location.siqs === 'number') {
    return location.siqs;
  }
  
  if (location.siqs && typeof location.siqs === 'object' && 'score' in location.siqs) {
    return location.siqs.score;
  }
  
  if (location.siqsResult && typeof location.siqsResult.score === 'number') {
    return location.siqsResult.score;
  }
  
  return null;
};
